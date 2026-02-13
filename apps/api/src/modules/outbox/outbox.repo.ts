import type { Sql } from '../../db/client';
import { JsonValue } from '../policy/policyEvaluation.types';

export type OutboxRepo = ReturnType<typeof buildOutboxRepo>;

export function buildOutboxRepo(sql: Sql) {
  return {
    async enqueue(e: {
      id: string;
      aggregateType: string;
      aggregateId: string;
      eventType: string;
      payload: JsonValue;
      correlationId: string;
    }) {
      await sql`
        insert into outbox_events (id, occurred_at, aggregate_type, aggregate_id, event_type, payload, correlation_id)
        values (${e.id}, now(), ${e.aggregateType}, ${e.aggregateId}, ${e.eventType}, ${sql.json(e.payload)}, ${e.correlationId})
      `;
    }
  };
}
