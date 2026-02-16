import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import type { RequestContext } from '../../core/request-context';
import { AppError } from '../../core/errors';
import { authenticate } from '../auth/auth.middleware';
import { authorize } from '../policy/authorize';
import { Role } from '../auth/auth.types';
import { OutboxRepo } from '../outbox/outbox.repo';


import {
  CreateDecisionSchema,
  NewVersionSchema,
  AddCommentSchema,
  DecisionStatus,
} from './decisions.schemas';

import type {
  DecisionListItem,
  DecisionVersion,
  DecisionComment,
} from './decisions.repo';


export type Decision = {
  id: string;
  orgId: string;
  title: string;
  status: DecisionStatus;
  createdBy: string;
  createdAt: Date;
  approvedBy: string | null;
  approvedAt: Date | null;
};


type Principal = {
  orgId: string;
  userId: string;
  role: string;
};

type DecisionsRepo = {
  listDecisions(orgId: string): Promise<DecisionListItem[]>;
  getDecision(id: string, orgId: string): Promise<Decision | null>;
  getVersions(decisionId: string): Promise<DecisionVersion[]>;
  getComments(decisionId: string): Promise<DecisionComment[]>;

  createDecision(input: {
    id: string;
    orgId: string;
    title: string;
    createdBy: string;
  }): Promise<void>;

  approveDecision(input: {
    decisionId: string;
    approvedBy: string;
    orgId: string;
  }): Promise<void>;

  createVersion(input: {
    id: string;
    decisionId: string;
    version: number;
    createdBy: string;
    payload: DecisionVersion['payload'];
  }): Promise<void>;

  nextVersionNumber(decisionId: string): Promise<number>;

  addComment(input: {
    id: string;
    decisionId: string;
    createdBy: string;
    body: string;
  }): Promise<void>;
};

export type ImpactRepo = {
  listLinksForDecision(decisionId: string): Promise<unknown[]>; 
};

export type AuthRepo = {
  getMembership(orgId: string, userId: string): Promise<Role | null>;
};

export type PolicyEvalRepo = {
  insert(row: unknown): Promise<void>; 
};

export type Audit = {
  log(ctx: RequestContext, e: unknown): Promise<void>;
};

type Deps = {
  decisionsRepo: DecisionsRepo;
  authRepo: AuthRepo;
  policyEvalRepo: PolicyEvalRepo;
  audit: Audit;
  impactRepo: ImpactRepo;
  outboxRepo: OutboxRepo;
};

function getCtx(req: unknown): RequestContext {
  return (req as { ctx: RequestContext }).ctx;
}
function getPrincipal(req: unknown): Principal {
  return (req as { principal: Principal }).principal;
}
function getIdParam(req: unknown): string {
  return (req as { params: { id: string } }).params.id;
}
function getBody(req: unknown): unknown {
  return (req as { body: unknown }).body;
}

export async function registerDecisionRoutes(app: FastifyInstance, deps: Deps) {
  // LIST
  app.get(
    '/decisions',
    {
      preHandler: [
        authenticate({
          getRole: async (
            orgId: string,
            userId: string,
          ): Promise<Role | null> => {
            return (await deps.authRepo.getMembership(
              orgId,
              userId,
            )) as Role | null;
          },
        }),
      ],
    },
    async (req, reply) => {
      const ctx = getCtx(req);
      const principal = req.principal as Principal | null;

      if (!principal) {
        reply.code(401).send({ error: 'Unauthorized' });
        return;
      }

      await authorize({
        ctx,
        principal,
        action: 'decision.read',
        resource: { type: 'decision', id: '*', orgId: principal.orgId },
        policyEvalRepo: deps.policyEvalRepo,
      });

      return deps.decisionsRepo.listDecisions(principal.orgId);
    },
  );

  // CREATE (draft + version 1)
  app.post(
    '/decisions',
    {
      preHandler: [
        authenticate({
          getRole: async (
            orgId: string,
            userId: string,
          ): Promise<Role | null> => {
            return (await deps.authRepo.getMembership(
              orgId,
              userId,
            )) as Role | null;
          },
        }),
      ],
    },
    async (req) => {
      const ctx = getCtx(req);
      const principal = getPrincipal(req);
      const body = CreateDecisionSchema.parse(getBody(req));

      await authorize({
        ctx,
        principal,
        action: 'decision.create',
        resource: { type: 'decision', id: '*', orgId: principal.orgId },
        policyEvalRepo: deps.policyEvalRepo,
      });

      const decisionId = randomUUID();
      const versionId = randomUUID();

      await deps.decisionsRepo.createDecision({
        id: decisionId,
        orgId: principal.orgId,
        title: body.title,
        createdBy: principal.userId,
      });

      await deps.decisionsRepo.createVersion({
        id: versionId,
        decisionId,
        version: 1,
        createdBy: principal.userId,
        payload: body.initial,
      });

      await deps.audit.log(ctx, {
        actorUserId: principal.userId,
        action: 'DECISION_CREATED',
        entityType: 'decision',
        entityId: decisionId,
        payload: { title: body.title },
      });

      return { id: decisionId };
    },
  );

  // DETAIL
  app.get(
    '/decisions/:id',
    {
      preHandler: [
        authenticate({
          getRole: async (
            orgId: string,
            userId: string,
          ): Promise<Role | null> => {
            return (await deps.authRepo.getMembership(
              orgId,
              userId,
            )) as Role | null;
          },
        }),
      ],
    },
    async (req) => {
      const ctx = getCtx(req);
      const principal = getPrincipal(req);
      const id = getIdParam(req);

      await authorize({
        ctx,
        principal,
        action: 'decision.read',
        resource: { type: 'decision', id, orgId: principal.orgId },
        policyEvalRepo: deps.policyEvalRepo,
      });

      const decision = await deps.decisionsRepo.getDecision(
        id,
        principal.orgId,
      );
      if (!decision) throw new AppError('NOT_FOUND', 'Decision not found', 404);

      const versions = await deps.decisionsRepo.getVersions(id);
      const comments = await deps.decisionsRepo.getComments(id);
      const links = await deps.impactRepo.listLinksForDecision(id);


      return { decision, versions, comments, links };
    },
  );

  // NEW VERSION
  app.post(
    '/decisions/:id/versions',
    {
      preHandler: [
        authenticate({
          getRole: async (
            orgId: string,
            userId: string,
          ): Promise<Role | null> => {
            return (await deps.authRepo.getMembership(
              orgId,
              userId,
            )) as Role | null;
          },
        }),
      ],
    },
    async (req) => {
      const ctx = getCtx(req);
      const principal = getPrincipal(req);
      const id = getIdParam(req);
      const body = NewVersionSchema.parse(getBody(req));

      await authorize({
        ctx,
        principal,
        action: 'decision.update',
        resource: { type: 'decision', id, orgId: principal.orgId },
        policyEvalRepo: deps.policyEvalRepo,
      });

      const decision = await deps.decisionsRepo.getDecision(
        id,
        principal.orgId,
      );
      if (!decision) throw new AppError('NOT_FOUND', 'Decision not found', 404);
      if (decision.status !== 'draft') {
        throw new AppError('CONFLICT', 'Decision is not editable', 409);
      }

      const version = await deps.decisionsRepo.nextVersionNumber(id);

      await deps.decisionsRepo.createVersion({
        id: randomUUID(),
        decisionId: id,
        version,
        createdBy: principal.userId,
        payload: body.payload,
      });

      await deps.audit.log(ctx, {
        actorUserId: principal.userId,
        action: 'DECISION_VERSIONED',
        entityType: 'decision',
        entityId: id,
        payload: { version },
      });

      return { ok: true, version };
    },
  );

  // APPROVE
  app.post(
    '/decisions/:id/approve',
    {
      preHandler: [
        authenticate({
          getRole: async (
            orgId: string,
            userId: string,
          ): Promise<Role | null> => {
            return (await deps.authRepo.getMembership(
              orgId,
              userId,
            )) as Role | null;
          },
        }),
      ],
    },
    async (req) => {
      const ctx = getCtx(req);
      const principal = getPrincipal(req);
      const id = getIdParam(req);

      await authorize({
        ctx,
        principal,
        action: 'decision.approve',
        resource: { type: 'decision', id, orgId: principal.orgId },
        policyEvalRepo: deps.policyEvalRepo,
      });

      const decision = await deps.decisionsRepo.getDecision(
        id,
        principal.orgId,
      );
      if (!decision) throw new AppError('NOT_FOUND', 'Decision not found', 404);

      await deps.decisionsRepo.approveDecision({
        decisionId: id,
        approvedBy: principal.userId,
        orgId: principal.orgId,
      });

      await deps.outboxRepo.enqueue({
        id: randomUUID(),
        aggregateType: 'decision',
        aggregateId: id,
        eventType: 'decision.approved',
        correlationId: ctx.correlationId,
        payload: {
        decisionId: id,
        orgId: principal.orgId,
        approvedBy: principal.userId
    }
});


      await deps.audit.log(ctx, {
        actorUserId: principal.userId,
        action: 'DECISION_APPROVED',
        entityType: 'decision',
        entityId: id,
        payload: {},
      });

      return { ok: true };
    },
  );

  // COMMENT
  app.post(
    '/decisions/:id/comments',
    {
      preHandler: [
        authenticate({
          getRole: async (
            orgId: string,
            userId: string,
          ): Promise<Role | null> => {
            return (await deps.authRepo.getMembership(
              orgId,
              userId,
            )) as Role | null;
          },
        }),
      ],
    },
    async (req) => {
      const ctx = getCtx(req);
      const principal = getPrincipal(req);
      const id = getIdParam(req);
      const body = AddCommentSchema.parse(getBody(req));

      await authorize({
        ctx,
        principal,
        action: 'decision.comment',
        resource: { type: 'decision', id, orgId: principal.orgId },
        policyEvalRepo: deps.policyEvalRepo,
      });

      await deps.decisionsRepo.addComment({
        id: randomUUID(),
        decisionId: id,
        createdBy: principal.userId,
        body: body.body,
      });

      await deps.audit.log(ctx, {
        actorUserId: principal.userId,
        action: 'DECISION_COMMENTED',
        entityType: 'decision',
        entityId: id,
        payload: {},
      });

      return { ok: true };
    },
  );
}
