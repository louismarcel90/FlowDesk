import type { FastifyInstance } from 'fastify';
import type { RequestContext } from '../../core/request-context';
import { authenticate } from '../auth/auth.middleware';
import { authorize } from '../policy/authorize';
import { z } from 'zod';
import { AppError } from '../../core/errors';
import { NotificationDlqRow } from './dlq.repo';
import { Role } from '../auth/auth.types';


export type OpsDeps = {
  authRepo: {
    getMembership(orgId: string, userId: string): Promise<Role | null>;
  };
  policyEvalRepo: {
    insert(row: unknown): Promise<void>;
  };
  dlqRepo: {
    list(limit: number): Promise<NotificationDlqRow[]>;
    getById(id: string): Promise<NotificationDlqRow | null>;
    requeueJob(jobId: string): Promise<void>;
    markReprocessed(id: string): Promise<void>;
  };
  audit: {
    log(ctx: RequestContext, e: unknown): Promise<void>;
  };
};

const ListQuery = z.object({ limit: z.coerce.number().min(1).max(200).default(50) });

export async function registerOpsRoutes(
  app: FastifyInstance,
  deps: {
    authRepo: { getMembership(orgId: string, userId: string): Promise<Role | null> };
    policyEvalRepo: { insert: (row: unknown) => Promise<void> };
    dlqRepo: {
      list(limit: number): Promise<NotificationDlqRow[]>;
      getById(id: string): Promise<NotificationDlqRow | null>;
      requeueJob(jobId: string): Promise<void>;
      markReprocessed(id: string): Promise<void>;
    };
    audit: { log: (ctx: RequestContext, e: unknown) => Promise<void> };
  }
) {
 const auth = authenticate({
  getRole: async (orgId, userId) => {
    const role = await deps.authRepo.getMembership(orgId, userId);
    if (!role) throw new AppError('UNAUTHORIZED', 'No membership', 401)
    return role;
  },
});

  // GET /admin/notifications/dlq
  app.get('/admin/notifications/dlq', { preHandler: [auth] }, async (req) => {
    const ctx = (req).ctx as RequestContext;
    const principal = (req).principal;

    await authorize({
      ctx,
      principal,
      action: 'admin.ops.read',
      resource: { type: 'ops', id: 'notifications.dlq', orgId: principal.orgId },
      policyEvalRepo: deps.policyEvalRepo
    });

    const q = ListQuery.parse(req.query);
    return deps.dlqRepo.list(q.limit);
  });

  // POST /admin/notifications/dlq/:id/reprocess
  app.post<{Params:{id: string}}>('/admin/notifications/dlq/:id/reprocess', { preHandler: [auth] }, async (req) => {
    const ctx = (req).ctx as RequestContext;
    const principal = (req).principal;
    const id = req.params.id;

    await authorize({
      ctx,
      principal,
      action: 'admin.ops.write',
      resource: { type: 'ops', id: `notifications.dlq:${id}`, orgId: principal.orgId },
      policyEvalRepo: deps.policyEvalRepo
    });

    const row = await deps.dlqRepo.getById(id);
    if (!row) throw new AppError('NOT_FOUND', 'DLQ item not found', 404);

    await deps.dlqRepo.requeueJob(row.job_id);
    await deps.dlqRepo.markReprocessed(id);

    await deps.audit.log(ctx, {
      actorUserId: principal.userId,
      action: 'DLQ_REPROCESSED',
      entityType: 'notification_dlq',
      entityId: id,
      payload: { jobId: row.job_id }
    });

    return { ok: true };
  });
}
