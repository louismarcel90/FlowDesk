// import postgres from 'postgres';
// import { kafka } from '../kafka/client';
// import 'dotenv/config';
// import { randomUUID } from 'node:crypto';

// const sql = postgres(process.env.DATABASE_URL!, { max: 5 });

// const TOPIC = 'flowdesk.domain.v1';

// async function publishOnce() {
//   const producer = kafka.producer();
//   await producer.connect();

//   const rows = await sql<{
//     id: string;
//     aggregate_id: string;
//     event_type: string;
//     payload: any; 
//     correlation_id: string;
//   }[]>`
//     select id, aggregate_id, event_type, payload, correlation_id
//     from outbox_events
//     where published_at is null
//     order by occurred_at asc
//     limit 50
//   `;

//   for (const e of rows) {
//     await producer.send({
//       topic: TOPIC,
//       messages: [
//         {
//           key: e.aggregate_id,
//           value: JSON.stringify({
//             eventId: e.id,
//             type: e.event_type,
//             payload: e.payload,
//             correlationId: e.correlation_id
//           })
//         }
//       ]
//     });

//     await sql`update outbox_events set published_at = now() where id = ${e.id}`;
//     console.log(`[publisher] published ${e.event_type} ${e.id}`);
//   }

//   await producer.disconnect();
// }

// async function main() {
//   console.log('[publisher] starting');
//   // loop simple (pas de cron externe)
//   // toutes les 2s
//   for (;;) {
//     await publishOnce().catch((e) => console.error(e));
//     await new Promise((r) => setTimeout(r, 2000));
//   }
// }

// main().catch((e) => {
//   console.error(e);
//   process.exit(1);
// });

import postgres, { type JSONValue } from "postgres";
import { kafka } from "../kafka/client";
import "dotenv/config";

type OutboxRow = {
  id: string;
  aggregate_id: string;
  event_type: string;
  payload: JSONValue;
  correlation_id: string;
};

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Set it in apps/workers/.env");
}

const sql = postgres(DATABASE_URL, { max: 5 });

const TOPIC = "flowdesk.domain.v1";

async function publishOnce(): Promise<void> {
  const producer = kafka.producer();

  try {
    await producer.connect();

    const rows = await sql<OutboxRow[]>`
      select id, aggregate_id, event_type, payload, correlation_id
      from outbox_events
      where published_at is null
      order by occurred_at asc
      limit 50
    `;

    if (rows.length === 0) return;

    for (const e of rows) {
      await producer.send({
        topic: TOPIC,
        messages: [
          {
            key: e.aggregate_id,
            value: JSON.stringify({
              eventId: e.id,
              aggregateId: e.aggregate_id,
              type: e.event_type,
              payload: e.payload,
              correlationId: e.correlation_id,
            }),
          },
        ],
      });

      await sql`
        update outbox_events
        set published_at = now()
        where id = ${e.id}
      `;

      console.log(`[publisher] published ${e.event_type} ${e.id}`);
    }
  } finally {
    // toujours fermer, même si une exception arrive
    await producer.disconnect().catch(() => {});
  }
}

async function main(): Promise<void> {
  console.log("[publisher] starting");

  // loop simple (pas de cron externe) : toutes les 2s
  for (;;) {
    try {
      await publishOnce();
    } catch (err) {
      console.error("[publisher] error:", err);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
