import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { RequestContext } from '../../core/request-context';
import { authenticate } from '../auth/auth.middleware';
import { authorize } from '../policy/authorize';
import { Role } from '../auth/auth.types';
import { PolicyEvalRepo } from '../policy/policyEvaluation.types';

const InboxQuery = z.object({
  limit: z.coerce.number().min(1).max(100).default(30),
  cursor: z.string().optional()
});

type inAppNotification = {
  id: string;
  type: string;
  createdAt: string;
  readAt: Date | null;
};

export async function registerInAppNotificationRoutes(
  app: FastifyInstance,
  deps: {
    authRepo: { getMembership(orgId: string, userId: string): Promise<Role | null> };
    policyEvalRepo: PolicyEvalRepo;
    inAppRepo: {
      unreadCount(userId: string): Promise<number>;
      listInbox(userId: string, limit: number, cursor?: string): Promise<inAppNotification[]>;
      markRead(userId: string, id: string): Promise<void>;
      markAllRead(userId: string): Promise<void>;
    };
    sseHub: {
      publish(userId: string, event: { type: string; unreadCount?: number }): void;
      subscribe(userId: string, write: (data: string) => void): () => void;
    };
  }
) {
  const auth = authenticate({ getRole: (o, u) => deps.authRepo.getMembership(o, u) });

  // GET /notifications/unread-count
  app.get('/notifications/unread-count', { preHandler: [auth] }, async (req) => {
    const ctx = (req).ctx as RequestContext;
    const principal = (req).principal;

    await authorize({
      ctx,
      principal,
      action: 'notifications.read',
      resource: { type: 'notification', id: '*', orgId: principal.orgId },
      policyEvalRepo: deps.policyEvalRepo
    });

    const count = await deps.inAppRepo.unreadCount(principal.userId);
    return { unreadCount: count };
  });

  // GET /notifications/inbox
  app.get('/notifications/inbox', { preHandler: [auth] }, async (req) => {
    const ctx = (req).ctx as RequestContext;
    const principal = (req).principal;

    await authorize({
      ctx,
      principal,
      action: 'notifications.read',
      resource: { type: 'notification', id: '*', orgId: principal.orgId },
      policyEvalRepo: deps.policyEvalRepo
    });

    const q = InboxQuery.parse(req.query);
    const items = await deps.inAppRepo.listInbox(principal.userId, q.limit, q.cursor);
    const nextCursor = items.length ? new Date(items[items.length - 1].createdAt).toISOString() : null;

    return { items, nextCursor };
  });

  // POST /notifications/:id/read
  app.post<{Params:{id: string}}>('/notifications/:id/read', { preHandler: [auth] }, async (req) => {
    const ctx = (req).ctx as RequestContext;
    const principal = (req).principal;
    const id = req.params.id;

    await authorize({
      ctx,
      principal,
      action: 'notifications.manage',
      resource: { type: 'notification', id, orgId: principal.orgId },
      policyEvalRepo: deps.policyEvalRepo
    });

    await deps.inAppRepo.markRead(principal.userId, id);
    const count = await deps.inAppRepo.unreadCount(principal.userId);

    deps.sseHub.publish(principal.userId, { type: 'unread_count_updated', unreadCount: count });

    return { ok: true, unreadCount: count };
  });

  // POST /notifications/read-all
  app.post('/notifications/read-all', { preHandler: [auth] }, async (req) => {
    const ctx = (req).ctx as RequestContext;
    const principal = (req).principal;

    await authorize({
      ctx,
      principal,
      action: 'notifications.manage',
      resource: { type: 'notification', id: '*', orgId: principal.orgId },
      policyEvalRepo: deps.policyEvalRepo
    });

    await deps.inAppRepo.markAllRead(principal.userId);

    deps.sseHub.publish(principal.userId, { type: 'unread_count_updated', unreadCount: 0 });

    return { ok: true, unreadCount: 0 };
  });

  /**
   * GET /notifications/stream (SSE)
   * Auth: Bearer token (compatible via fetch streaming)
   */
  app.get('/notifications/stream', { preHandler: [auth] }, async (req, reply) => {
    const principal = (req).principal;

    reply.raw.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive'
    });

    const write = (data: string) => {
      reply.raw.write(`data: ${data}\n\n`);
    };

    // initial push
    const count = await deps.inAppRepo.unreadCount(principal.userId);
    write(JSON.stringify({ type: 'unread_count_updated', unreadCount: count }));

    const unsubscribe = deps.sseHub.subscribe(principal.userId, write);

    req.raw.on('close', () => {
      unsubscribe();
    });
  });
}
