import type { Sql } from '../../db/client';

type inAppNotificationRow = {
  id: string;
  org_id: string;
  user_id: string;
  type: string;
  title: string | null;
  body: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  source_event_id: string;
  correlation_id: string;
  createdAt: Date | null;
  readAt?: Date | null;
};

export function buildInAppRepo(sql: Sql) {
  return {
    async unreadCount(userId: string) {
      const rows = await sql<{ count: number }[]>`
        select count(*)::int as count
        from in_app_notifications
        where user_id = ${userId} and read_at is null
      `;
      return rows[0]?.count ?? 0;
    },

    async listInbox(userId: string, limit: number, cursor?: string) {
      // cursor = created_at ISO string of last item (simple & deterministic)
      if (!cursor) {
        return sql<inAppNotificationRow[]>`
          select id, type, title, body, entity_type, entity_id, created_at, read_at
          from in_app_notifications
          where user_id = ${userId}
          order by created_at desc
          limit ${limit}
        `;
      }

      return sql<inAppNotificationRow[]>`
        select id, type, title, body, entity_type, entity_id, created_at, read_at
        from in_app_notifications
        where user_id = ${userId} and created_at < ${cursor}
        order by created_at desc
        limit ${limit}
      `;
    },

    async markRead(userId: string, id: string) {
      await sql`
        update in_app_notifications
        set read_at = now()
        where id = ${id} and user_id = ${userId} and read_at is null
      `;
    },

    async markAllRead(userId: string) {
      await sql`
        update in_app_notifications
        set read_at = now()
        where user_id = ${userId} and read_at is null
      `;
    },

    async insert(n: {
      id: string;
      orgId: string;
      userId: string;
      type: string;
      title: string;
      body: string;
      entityType?: string;
      entityId?: string;
      sourceEventId: string;
      correlationId: string;
    }) {
      await sql`
        insert into in_app_notifications
          (id, org_id, user_id, type, title, body, entity_type, entity_id, source_event_id, correlation_id)
        values
          (${n.id}, ${n.orgId}, ${n.userId}, ${n.type}, ${n.title}, ${n.body},
           ${n.entityType ?? null}, ${n.entityId ?? null}, ${n.sourceEventId}, ${n.correlationId})
      `;
    }
  };
}
