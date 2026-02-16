import type { Sql } from '../../db/client';

export type InAppNotificationRow = {
  id: string;
  orgId: string;
  userId: string;
  type: string;
  title: string | null;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  sourceEventId: string;
  correlationId: string;
  createdAt: Date;
  readAt: Date | null;
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
      // cursor = ISO string of last item createdAt
      if (!cursor) {
        return sql<InAppNotificationRow[]>`
          select
            id,
            org_id as "orgId",
            user_id as "userId",
            type,
            title,
            body,
            entity_type as "entityType",
            entity_id as "entityId",
            source_event_id as "sourceEventId",
            correlation_id as "correlationId",
            created_at as "createdAt",
            read_at as "readAt"
          from in_app_notifications
          where user_id = ${userId}
          order by created_at desc
          limit ${limit}
        `;
      }

      return sql<InAppNotificationRow[]>`
        select
          id,
          type,
          title,
          body,
          entity_type as "entityType",
          entity_id as "entityId",
          source_event_id as "sourceEventId",
          correlation_id as "correlationId",
          created_at as "createdAt",
          read_at as "readAt"
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
      type: 'decision.approved' | 'decision.rejected' | 'comment.mentioned' | 'comment.posted' | string;
      title: 'Decision approved' | 'Decision rejected' | 'Mentioned in comment' | 'New comment' | string;
      body: `Decision "${InAppNotificationRow['title']}" was approved' | 'Decision "Should we adopt X?" was rejected' | 'You were mentioned in a comment' | 'A new comment was posted` | string;
      entityType: string | null;
      entityId: string | null;
      sourceEventId: string;
      correlationId: string;
    }) {
      await sql`
        insert into in_app_notifications
          (id, org_id, user_id, type, title, body, entity_type, entity_id, source_event_id, correlation_id)
        values
          (${n.id}, ${n.orgId}, ${n.userId}, ${n.type}, ${n.title}, ${n.body}, ${n.entityType}, ${n.entityId}, ${n.sourceEventId}, ${n.correlationId})
      `;
    },
  };
}
