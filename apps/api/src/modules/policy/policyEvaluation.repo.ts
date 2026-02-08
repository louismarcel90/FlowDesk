import type { Sql } from '../../db/client';
import type { JsonValue } from '../../types/json';

export function buildPolicyEvalRepo(sql: Sql) {
  return {
    async insert(row: {
      id: string;
      occurredAt: Date;
      userId?: string;
      orgId?: string;
      action: string;
      resourceType: string;
      resourceId: string;
      allow: boolean;
      reason?: string;
      rule?: string;
      correlationId: string;
      input: JsonValue;
      result: JsonValue;
    }) {
      await sql`
        insert into policy_evaluations
          (id, occurred_at, user_id, org_id, action, resource_type, resource_id, allow, reason, rule, correlation_id, input, result)
        values
          (${row.id}, ${row.occurredAt}, ${row.userId ?? null}, ${row.orgId ?? null}, ${row.action}, ${row.resourceType}, ${row.resourceId},
           ${row.allow}, ${row.reason ?? null}, ${row.rule ?? null}, ${row.correlationId}, ${sql.json(row.input)}, ${sql.json(row.result)})
      `;
    }
  };
}
