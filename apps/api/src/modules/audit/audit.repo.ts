import postgres, { JSONValue } from 'postgres';

export type AuditEvent = {
  id: string;
  occurredAt: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  correlationId: string;
  payload: JSONValue;
};

export function buildAuditRepo(sql: postgres.Sql) {
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
