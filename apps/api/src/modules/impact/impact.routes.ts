import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import type { RequestContext } from '../../core/request-context';
import { authenticate } from '../auth/auth.middleware';
import { authorize } from '../policy/authorize';
import { AppError } from '../../core/errors';
import { buildImpactRepo } from './impact.repo';
import { buildAuditService } from '../audit/audit.service';
import {
  CreateInitiativeSchema,
  CreateMetricSchema,
  CreateMetricSnapshotSchema,
  LinkDecisionSchema
} from './impact.schemas';
import { registerMeRoutes } from '../auth/me.routes';
import { registerAuthRoutes } from '../auth/auth.routes';
import { Role } from '../auth/auth.types';


type AuthRoutesDeps = Parameters<typeof registerAuthRoutes>[1];
type MeRoutesDeps = Parameters<typeof registerMeRoutes>[1];


type Deps = {
  impactRepo: ReturnType<typeof buildImpactRepo>;
  authRepo: AuthRoutesDeps['authRepo'];
  policyEvalRepo: MeRoutesDeps['policyEvalRepo'];
  audit: ReturnType<typeof buildAuditService>;
};

export async function registerImpactRoutes(app: FastifyInstance, deps: Deps) {
  const auth = authenticate({
  getRole: async (o, u) => {
    const membershipOrRole = await deps.authRepo.getMembership(o, u);

    if (!membershipOrRole) return null;

    if (typeof membershipOrRole === 'object' && 'role' in membershipOrRole) {
      const r = (membershipOrRole as { role?: Role | null }).role ?? null;
      return r;
    }

    return membershipOrRole as Role;
  },
});

// INITIATIVES
  app.get('/initiatives', { preHandler: [auth] }, async (req) => {
    const ctx = req.ctx as RequestContext;
    const principal = req.principal!;

    if(!principal) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    await authorize({
      ctx, principal,
      action: 'initiative.read',
      resource: { type: 'initiative', id: '*', orgId: principal?.orgId },
      policyEvalRepo: deps.policyEvalRepo
    });

    return deps.impactRepo.listInitiatives(principal.orgId);
  });

  app.post('/initiatives', { preHandler: [auth] }, async (req) => {
    const ctx = req.ctx as RequestContext;
    const principal = req.principal!;
    const body = CreateInitiativeSchema.parse(req.body);

    if(!principal) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    await authorize({
      ctx, principal,
      action: 'initiative.create',
      resource: { type: 'initiative', id: '*', orgId: principal.orgId },
      policyEvalRepo: deps.policyEvalRepo
    });

    const id = randomUUID();
    await deps.impactRepo.createInitiative({
      id,
      orgId: principal.orgId,
      name: body.name,
      description: body.description,
      status: body.status,
      createdBy: principal.userId
    });

    await deps.audit.log(ctx, {
      actorUserId: principal.userId,
      action: 'INITIATIVE_CREATED',
      entityType: 'initiative',
      entityId: id,
      payload: { name: body.name }
    });

    return { id };
  });

  app.get<{ Params: { id: string } }>('/initiatives/:id', { preHandler: [auth] }, async (req) => {
    const ctx = req.ctx as RequestContext;
    const principal = req.principal!;
    const {id} = req.params;

    if(!principal) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    await authorize({
      ctx, principal,
      action: 'initiative.read',
      resource: { type: 'initiative', id, orgId: principal.orgId },
      policyEvalRepo: deps.policyEvalRepo
    });

    const initiative = await deps.impactRepo.getInitiative(principal.orgId, id);
    if (!initiative) throw new AppError('NOT_FOUND', 'Initiative not found', 404);

    const decisions = await deps.impactRepo.listDecisionsForInitiative(id);
    const metrics = await deps.impactRepo.listMetricsByInitiative(id);

    return { initiative, decisions, metrics };
  });

  // METRICS
  app.get('/metrics', { preHandler: [auth] }, async (req) => {
    const ctx = req.ctx as RequestContext;
    const principal = req.principal!;

    if(!principal) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    await authorize({
      ctx, principal,
      action: 'metric.read',
      resource: { type: 'metric', id: '*', orgId: principal.orgId },
      policyEvalRepo: deps.policyEvalRepo
    });

    return deps.impactRepo.listMetrics(principal.orgId);
  });

  app.post('/metrics', { preHandler: [auth] }, async (req) => {
    const ctx = req.ctx as RequestContext;
    const principal = req.principal!;
    const body = CreateMetricSchema.parse(req.body);

    if(!principal) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    await authorize({
      ctx, principal,
      action: 'metric.create',
      resource: { type: 'metric', id: '*', orgId: principal.orgId },
      policyEvalRepo: deps.policyEvalRepo
    });

    const id = randomUUID();
    await deps.impactRepo.createMetric({
      id,
      orgId: principal.orgId, 
      initiativeId: body.initiativeId,
      name: body.name,
      unit: body.unit,
      direction: body.direction,
      createdBy: principal.userId
    });

    await deps.audit.log(ctx, {
      actorUserId: principal.userId,
      action: 'METRIC_CREATED',
      entityType: 'metric',
      entityId: id,
      payload: { name: body.name, initiativeId: body.initiativeId ?? null }
    });

    return { id };
  });


  app.post<{ Params: { id: string }}>('/metrics/:id/snapshots', { preHandler: [auth] }, async (req) => {
    const ctx = req.ctx as RequestContext;
    const principal = req.principal!;
    const {id} = req.params;
    const body = CreateMetricSnapshotSchema.parse(req.body);

    if(!principal) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    await authorize({
      ctx, principal,
      action: 'metric.snapshot.create',
      resource: { type: 'metric', id, orgId: principal.orgId },
      policyEvalRepo: deps.policyEvalRepo
    });

    await deps.impactRepo.createSnapshot({
      id: randomUUID(),
      metricId: id,
      occurredAt: new Date(body.occurredAt),
      value: body.value,
      source: body.source,
      createdBy: principal.userId
    });

    await deps.audit.log(ctx, {
      actorUserId: principal.userId,
      action: 'METRIC_SNAPSHOT_CREATED',
      entityType: 'metric',
      entityId: id,
      payload: { value: body.value, occurredAt: body.occurredAt, source: body.source }
    });

    return { ok: true };
  });

  // link decision -> initiative
  app.post<{ Params: { id: string }}>('/decisions/:id/links', { preHandler: [auth] }, async (req) => {
    const ctx = req.ctx as RequestContext;
    const principal = req.principal!;
    const {id:decisionId} = req.params;
    const body = LinkDecisionSchema.parse(req.body);

    if(!principal) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    await authorize({
      ctx, principal,
      action: 'decision.link',
      resource: { type: 'decision', id: decisionId, orgId: principal.orgId },
      policyEvalRepo: deps.policyEvalRepo
    });

    await deps.impactRepo.linkDecision({
      id: randomUUID(),
      orgId: principal.orgId,
      decisionId,
      initiativeId: body.initiativeId,
      createdBy: principal.userId
    });

    await deps.audit.log(ctx, {
      actorUserId: principal.userId,
      action: 'DECISION_LINKED',
      entityType: 'decision',
      entityId: decisionId,
      payload: { initiativeId: body.initiativeId }
    });

    return { ok: true };
  });
}
