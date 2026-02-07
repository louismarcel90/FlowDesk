import type { Sql } from '../../db/client';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type AuditEvent = {
  id: string;
  occurredAt: Date;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  correlationId: string;
  payload: JsonValue;
};

export function buildAuditRepo(sql: Sql) {
  return {
    async append(e: AuditEvent) {
      await sql`
        insert into audit_events (id, occurred_at, actor_user_id, action, entity_type, entity_id, correlation_id, payload)
        values (${e.id}, ${e.occurredAt}, ${e.actorUserId ?? null}, ${e.action}, ${e.entityType}, ${e.entityId}, ${e.correlationId}, 
        ${sql.json(e.payload)})
      `;
    },
  };
}