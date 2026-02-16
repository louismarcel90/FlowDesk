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

export type inAppNotification = {
  id?: string;
  type: string;
  title: string | null;
  body: string | null;
  entityType?: string | null;
  entityId?: string | null;
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
    const rows = await deps.inAppRepo.listInbox(principal.userId, q.limit, q.cursor);
     const items = rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title ?? null,
      body: r.body ?? null,
      entityType: r.entityType ?? null,
      entityId: r.entityId ?? null,
      createdAt: r.createdAt ?? new Date().toISOString(),
      readAt: r.readAt ? r.readAt.toISOString() : null,
  }));
    const lastCreated = rows[rows.length - 1]?.createdAt;
    const nextCursor = lastCreated ? new Date(lastCreated).toISOString() : null;
    
    return { items, nextCursor };
  });

  // POST /notifications/:id/read
  app.post<{ Params: { id: string } }>('/notifications/:id/read', { preHandler: [auth] }, async (req, reply) => {
  try {
    const ctx = (req).ctx as RequestContext;
    const principal = req.principal;

    await authorize({
      ctx,
      principal,
      action: 'notifications.read',
      resource: { type: 'notification', id:req.params.id, orgId: principal.orgId },
      policyEvalRepo: deps.policyEvalRepo,
    });

    await deps.inAppRepo.markRead(principal.userId, req.params.id);
    const count = await deps.inAppRepo.unreadCount(principal.userId);

    deps.sseHub.publish(principal.userId, { type: 'unread_count_updated', unreadCount: count });

    return { ok: true, unreadCount: count };
  } catch (err) {
    req.log.error({ err }, 'POST /notifications/:id/read failed');
    return reply.code(500).send({ error: { message: err instanceof Error ? err.message : String (err)} });
  }
});


  // POST /notifications/read-all
app.post('/notifications/read-all', { preHandler: [auth] }, async (req, reply) => {
  try {
    const ctx = req.ctx as RequestContext;
    const principal = req.principal;

    await authorize({
      ctx,
      principal,
      action: 'notifications.read',
      resource: { type: 'notification', id: '*', orgId: principal.orgId },
      policyEvalRepo: deps.policyEvalRepo,
    });

    await deps.inAppRepo.markAllRead(principal.userId);

    deps.sseHub.publish(principal.userId, {
      type: 'unread_count_updated',
      unreadCount: 0,
    });

    return { ok: true, unreadCount: 0 };
  } catch (err) {
    req.log.error({ err }, 'POST /notifications/read-all failed');
    const message = err instanceof Error ? err.message : String(err);
    const statusCode = message.toLowerCase().includes('forbidden') ? 403 : 500;
    return reply.code(statusCode).send({ error: { message } });
  }
});



  app.get(
  '/notifications/stream',
  { preHandler: [auth] },
  async (req, reply) => {
    const principal = req.principal;

    if (!principal?.userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const userId = String(principal.userId); // MUST = u.id

    // -------------------------------
    // HEADERS SSE ENTERPRISE
    // -------------------------------
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // nginx safe
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': req.headers.origin ?? 'http://localhost:3000',
      'Vary': 'Origin'
    });

    // Disable timeout
    req.raw.setTimeout(0);

    // Flush headers immediately
    reply.raw.flushHeaders?.();

    // -------------------------------
    // SAFE WRITER
    // -------------------------------
    const write = (event: string, payload: unknown) => {
      try {
        reply.raw.write(`event: ${event}\n`);
        reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (err) {
        console.error('SSE write error', err);
      }
    };

    // -------------------------------
    // INITIAL CONNECT EVENT
    // -------------------------------
    write('connected', { ok: true });

    // -------------------------------
    // INITIAL UNREAD COUNT
    // -------------------------------
    const unreadCount = await deps.inAppRepo.unreadCount(userId);

    write('unread_count_updated', {
      unreadCount
    });

    // -------------------------------
    // REGISTER CLIENT IN HUB
    // -------------------------------
    const unsubscribe = deps.sseHub.subscribe(userId, (payload) => {
      write('notification', payload);
    });

    // -------------------------------
    // HEARTBEAT (keep connection alive)
    // -------------------------------
    const heartbeat = setInterval(() => {
      write('ping', {});
    }, 15000);

    // -------------------------------
    // CLEANUP
    // -------------------------------
    req.raw.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });
}
