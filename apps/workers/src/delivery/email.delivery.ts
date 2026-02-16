import postgres, { JSONValue } from 'postgres';
import nodemailer from 'nodemailer';
import { kafka } from '../kafka/client';
import { renderEmail } from '../templates/registry';
import { randomUUID, createHash } from 'node:crypto';
import "dotenv/config";


const sql = postgres(process.env.DATABASE_URL!, { max: 10 });
const TOPIC = 'flowdesk.notifications.v1';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: Number(process.env.SMTP_PORT ?? '1025'),
  secure: false
});


type DecisionApprovedEmailPayload = {
  decisionId?: string;
  decisionTitle?: string;
};

function asDecisionApprovedPayload(payload: JSONValue): DecisionApprovedEmailPayload {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const p = payload as Record<string, unknown>;
    return {
      decisionId: typeof p.decisionId === "string" ? p.decisionId : undefined,
      decisionTitle: typeof p.decisionTitle === "string" ? p.decisionTitle : undefined,
    };
  }
  return {};
}
 

function deterministicBackoffSeconds(attempt: number) {
  // attempt starts at 1
  // 1→10s, 2→30s, 3→2m, 4→10m, 5→30m
  const table = [10, 30, 120, 600, 1800];
  return table[Math.min(attempt - 1, table.length - 1)];
}

function idempotencyKey(notificationId: string, channel: string) {
  return createHash('sha256').update(`${notificationId}:${channel}`).digest('hex');
}

async function markAttempt(jobId: string, success: boolean, error?: string) {
  await sql`
    insert into notification_attempts (id, job_id, success, error)
    values (${randomUUID()}, ${jobId}, ${success}, ${error ?? null})
  `;
}

export async function runEmailDelivery() {
  const consumer = kafka.consumer({ groupId: 'flowdesk-delivery-email' });
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: true });

  console.log('[delivery-email] listening');

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const evt = JSON.parse(message.value.toString());
      if (evt.channel !== 'email') return;

      const { notificationId, jobId, userId, orgId, correlationId } = evt;

      // lock job if due
      const rows = await sql<{
        id: string;
        status: string;
        attempt: number;
        max_attempts: number;
        next_attempt_at: Date;
        notification_id: string;
      }[]>`
        select id, status, attempt, max_attempts, next_attempt_at, notification_id
        from notification_jobs
        where id = ${jobId}
        limit 1
      `;
      const job = rows[0];
      if (!job) return;
      if (job.status === 'done' || job.status === 'dlq') return;

      const now = new Date();
      if (job.next_attempt_at > now) return; // not due yet

      // load notification payload
      const notifRows = await sql<{
        id: string;
        type: string;
        payload: JSONValue;
      }[]>`
        select id, type, payload
        from notifications
        where id = ${notificationId}
        limit 1
      `;
      const notif = notifRows[0];
      if (!notif) return;

      // compute to_address (MVP: user email from users table)
      const userRows = await sql<{ email: string }[]>`
        select email from users where id = ${userId} limit 1
      `;
      const to = userRows[0]?.email;
      if (!to) return;

      // idempotency guard
      const idem = idempotencyKey(notificationId, 'email');
      const already = await sql<{ id: string }[]>`
        select id from notification_deliveries where idempotency_key = ${idem} limit 1
      `;
      if (already[0]) {
        // already delivered/attempted terminally
        await sql`update notification_jobs set status = 'done' where id = ${jobId}`;
        return;
      }

      // attempt send
      try {
        // template mapping (MVP: decision.approved)
        const templateId = 'email/decision-approved';
        const templateVersion = 1;

        const p = asDecisionApprovedPayload(notif.payload);

        const decisionTitle = p.decisionTitle ?? 'Decision';
        const decisionId = p.decisionId ?? '';

        const rendered = renderEmail(
          { templateId, version: templateVersion },
          { decisionId, decisionTitle, orgId }
        );

        // simulate failure (for testing retries)
        if (process.env.SIMULATE_EMAIL_FAIL === '1') {
          throw new Error('SIMULATED_EMAIL_FAILURE');
        }

        await transporter.sendMail({
          from: process.env.SMTP_FROM ?? 'flowdesk@local.test',
          to,
          subject: rendered.subject,
          html: rendered.html,
          headers: { 'x-correlation-id': correlationId, 'x-notification-id': notificationId }
        });

        await sql`
          insert into notification_deliveries
            (id, notification_id, channel, to_address, template_id, template_version, status, sent_at, error, idempotency_key)
          values
            (${randomUUID()}, ${notificationId}, 'email', ${to}, ${templateId}, ${templateVersion}, 'sent', now(), null, ${idem})
        `;

        await markAttempt(jobId, true);

        await sql`update notification_jobs set status = 'done' where id = ${jobId}`;

        console.log(`[delivery-email] sent notification ${notificationId} to ${to}`);
      } catch (e) {
        const attemptNext = job.attempt + 1;
        const err = String(e);

        await markAttempt(jobId, false, err);

        if (attemptNext >= job.max_attempts) {
          await sql`
            update notification_jobs
            set status = 'dlq', attempt = ${attemptNext}, last_error = ${err}
            where id = ${jobId}
          `;

          await sql`
            insert into notification_dlq (id, job_id, notification_id, channel, reason, payload)
            values (${randomUUID()}, ${jobId}, ${notificationId}, 'email', ${err}, ${sql.json({ notificationId, jobId })})
          `;

          console.log(`[delivery-email] DLQ notification ${notificationId} reason=${err}`);
          return;
        }

        const delaySec = deterministicBackoffSeconds(attemptNext);
        const nextAt = new Date(Date.now() + delaySec * 1000);

        await sql`
          update notification_jobs
          set attempt = ${attemptNext},
              next_attempt_at = ${nextAt},
              status = 'pending',
              last_error = ${err}
          where id = ${jobId}
        `;

        console.log(`[delivery-email] retry scheduled notification ${notificationId} attempt=${attemptNext} in ${delaySec}s`);
      }
    }
  });
}

runEmailDelivery().catch((e) => {
  console.error(e);
  process.exit(1);
});
