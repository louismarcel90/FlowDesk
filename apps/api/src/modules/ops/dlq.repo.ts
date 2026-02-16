import { JSONValue } from 'postgres';
import type { Sql } from '../../db/client';

export type NotificationDlqRow = {
  id: string;
  job_id: string;
  notification_id: string;
  channel: string;
  reason: string;
  payload: JSONValue; 
  created_at: Date;
  reprocessed_at: Date | null;
};

export function buildDlqRepo(sql: Sql) {
  return {
    async list(limit: number) {
      return sql<NotificationDlqRow[]>`
        select id, job_id, notification_id, channel, reason, payload, created_at, reprocessed_at
        from notification_dlq
        order by created_at desc
        limit ${limit}
      `;
    },

    async markReprocessed(id: string): Promise<void> {
      await sql`update notification_dlq set reprocessed_at = now() where id = ${id}`;
    },

    async getById(id: string) {
      const rows = await sql<NotificationDlqRow[]>`
        select id, job_id, notification_id, channel, reason, payload
        from notification_dlq
        where id = ${id}
        limit 1
      `;
      return rows[0] ?? null;
    },

    async requeueJob(jobId: string): Promise<void> {
      await sql`
        update notification_jobs
        set status = 'pending',
            attempt = 0,
            next_attempt_at = now(),
            last_error = null,
            locked_at = null
        where id = ${jobId}
      `;
    }
  };
}
