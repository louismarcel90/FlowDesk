import 'dotenv/config';
import postgres from 'postgres';
import { kafka } from '../kafka/client';
import { randomUUID } from 'node:crypto';

const sql = postgres(process.env.DATABASE_URL!, { max: 10 });

const DOMAIN_TOPIC = 'flowdesk.domain.v1';
const NOTIF_TOPIC = 'flowdesk.notifications.v1';

function isWithinQuietHours(now: Date, start: string, end: string) {
  // start/end "HH:MM" in local timezone already (MVP: assume server timezone = user timezone)
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  if (s <= e) return mins >= s && mins < e;
  return mins >= s || mins < e; // crosses midnight
}

function nextAllowedAt(now: Date, end: string) {
  const [eh, em] = end.split(':').map(Number);
  const d = new Date(now);
  d.setHours(eh, em, 0, 0);
  if (d <= now) d.setDate(d.getDate() + 1);
  return d;
}

export async function runOrchestrator() {
  const consumer = kafka.consumer({ groupId: 'flowdesk-orchestrator' });
  const producer = kafka.producer();

  await consumer.connect();
  await producer.connect();
  await consumer.subscribe({ topic: DOMAIN_TOPIC, fromBeginning: true });

  console.log('[orchestrator] listening');

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const evt = JSON.parse(message.value.toString());
      const { eventId, type, payload, correlationId } = evt;

      if (type !== 'decision.approved') return;

      // Determine recipients (MVP: all members of org)
      const orgId = payload.orgId as string;

      const members = await sql<{ user_id: string }[]>`
        select user_id from memberships where org_id = ${orgId}
      `;

      for (const m of members) {
        // preferences
        const prefs = await sql<{
          email_enabled: boolean;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
        }[]>`
          select email_enabled, quiet_hours_start, quiet_hours_end
          from notification_preferences
          where org_id = ${orgId} and user_id = ${m.user_id}
          limit 1
        `;

        const emailEnabled = prefs[0]?.email_enabled ?? true;
        if (!emailEnabled) continue;

        const now = new Date();
        let nextAttemptAt = now;

        const qStart = prefs[0]?.quiet_hours_start;
        const qEnd = prefs[0]?.quiet_hours_end;

        if (qStart && qEnd && isWithinQuietHours(now, qStart, qEnd)) {
          nextAttemptAt = nextAllowedAt(now, qEnd);
        }

        // notification record (idempotent by source_event_id+user ideally; MVP: allow duplicates guarded at delivery)
        const notificationId = randomUUID();
        const jobId = randomUUID();

        // store notification
        await sql`
          insert into notifications (id, org_id, user_id, type, correlation_id, source_event_id, payload)
          values (${notificationId}, ${orgId}, ${m.user_id}, ${type}, ${correlationId}, ${eventId}, ${sql.json(payload)})
        `;

        // enqueue job
        await sql`
          insert into notification_jobs (id, notification_id, channel, attempt, max_attempts, next_attempt_at, status)
          values (${jobId}, ${notificationId}, 'email', 0, 5, ${nextAttemptAt}, 'pending')
        `;

        // emit orchestration event
        await producer.send({
          topic: NOTIF_TOPIC,
          messages: [
            {
              key: notificationId,
              value: JSON.stringify({
                notificationId,
                jobId,
                channel: 'email',
                type,
                orgId,
                userId: m.user_id,
                correlationId
              })
            }
          ]
        });

        console.log(`[orchestrator] created notification ${notificationId} job ${jobId}`);
      }
    }
  });
}

runOrchestrator().catch((e) => {
  console.error(e);
  process.exit(1);
});
