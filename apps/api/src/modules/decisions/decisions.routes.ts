import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import type { RequestContext } from "../../core/request-context";
import { AppError } from "../../core/errors";

import { authenticate } from "../auth/auth.middleware";
import { authorize } from "../policy/authorize";
import type { Role } from "../auth/auth.types";

import type { OutboxRepo } from "../outbox/outbox.repo";

import { CreateDecisionSchema, NewVersionSchema, AddCommentSchema } from "./decisions.schemas";
import type { DecisionsRepo, DecisionStatus } from "./decisions.types";
import { SSEHub } from "../notifications/sseHub";

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

export type InAppRepo = {
  insert(row: {
    id: string;
    orgId: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    entityType: "decision";
    entityId: string;
    sourceEventId: string;
    correlationId: string;
    createdAt?: Date;
  }): Promise<void>;

  unreadCount(userId: string): Promise<number>;
};

type Deps = {
  decisionsRepo: DecisionsRepo;
  authRepo: AuthRepo;
  policyEvalRepo: PolicyEvalRepo;
  audit: Audit;
  inAppRepo : InAppRepo;
  impactRepo: ImpactRepo;
  outboxRepo: OutboxRepo;
  sseHub: SSEHub;
};

type Principal = {
  orgId: string;
  userId: string;
  role: Role;
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

function authPreHandler(deps: Deps) {
  return authenticate({
    getRole: async (orgId: string, userId: string) =>
      (await deps.authRepo.getMembership(orgId, userId)) as Role | null,
  });
}

const UpdateDecisionStatusSchema = z.object({
  status: z.enum(["draft", "proposed", "approved", "rejected", "superseded", "archived"]),
});

export async function registerDecisionRoutes(app: FastifyInstance, deps: Deps) {
  // LIST
  app.get(
    "/decisions",
    { preHandler: [authPreHandler(deps)] },
    async (req, reply) => {
      const ctx = getCtx(req);
      const principal = getPrincipal(req);

      if (!principal) {
        reply.code(401).send({ error: "Unauthorized" });
        return;
      }

      await authorize({
        ctx,
        principal,
        action: "decision.read",
        resource: { type: "decision", id: "*", orgId: principal.orgId },
        policyEvalRepo: deps.policyEvalRepo,
      });

      return deps.decisionsRepo.listDecisions(principal.orgId);
    }
  );

  // CREATE (draft + version 1)
  app.post(
    "/decisions",
    { preHandler: [authPreHandler(deps)] },
    async (req) => {
      const ctx = getCtx(req);
      const principal = getPrincipal(req);
      const body = CreateDecisionSchema.parse(getBody(req));

      await authorize({
        ctx,
        principal,
        action: "decision.create",
        resource: { type: "decision", id: "*", orgId: principal.orgId },
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
        action: "DECISION_CREATED",
        entityType: "decision",
        entityId: decisionId,
        payload: { title: body.title },
      });

      return { id: decisionId };
    }
  );

  // DETAIL
  app.get(
    "/decisions/:id",
    { preHandler: [authPreHandler(deps)] },
    async (req) => {
      const ctx = getCtx(req);
      const principal = getPrincipal(req);
      const id = getIdParam(req);

      await authorize({
        ctx,
        principal,
        action: "decision.read",
        resource: { type: "decision", id, orgId: principal.orgId },
        policyEvalRepo: deps.policyEvalRepo,
      });

      const decision = await deps.decisionsRepo.getDecision(id, principal.orgId);
      if (!decision) throw new AppError("NOT_FOUND", "Decision not found", 404);

      const versions = await deps.decisionsRepo.getVersions(id);
      const comments = await deps.decisionsRepo.getComments(id);
      const links = await deps.impactRepo.listLinksForDecision(id);

      return { decision, versions, comments, links };
    }
  );

  // CHANGE STATUS (for UI)
app.patch(
  "/decisions/:id/status",
  { preHandler: [authPreHandler(deps)] },
  async (req, reply) => {
    const ctx = getCtx(req);
    const principal = getPrincipal(req);

    if (!principal) {
      reply.code(401).send({ error: "Unauthorized" });
      return;
    }

    const id = getIdParam(req);
    const body = UpdateDecisionStatusSchema.parse(getBody(req));

    await authorize({
      ctx,
      principal,
      action: "decision.update",
      resource: { type: "decision", id, orgId: principal.orgId },
      policyEvalRepo: deps.policyEvalRepo,
    });

    // charger la décision pour titre + existence
    const decision = await deps.decisionsRepo.getDecision(id, principal.orgId);
    if (!decision) throw new AppError("NOT_FOUND", "Decision not found", 404);

    await deps.decisionsRepo.updateDecisionStatus({
      decisionId: id,
      orgId: principal.orgId,
      status: body.status as DecisionStatus,
      changedBy: principal.userId,
    });

    // notif in-app
    await deps.inAppRepo.insert({
      id: randomUUID(),
      orgId: principal.orgId,
      userId: principal.userId,
      type:
        body.status === "approved"
          ? "decision.approved"
          : body.status === "rejected"
            ? "decision.rejected"
            : "decision.status_changed",
      title:
        body.status === "approved"
          ? "Decision approved"
          : body.status === "rejected"
            ? "Decision rejected"
            : "Decision status updated",
      body: `Decision "${decision.title}" moved to ${body.status}`,
      entityType: "decision",
      entityId: id,
      sourceEventId: randomUUID(),
      correlationId: ctx.correlationId,
    });

    // push instantané côté UI : unreadCount
    const unreadCount = await deps.inAppRepo.unreadCount(principal.userId);
    deps.sseHub.publish(principal.userId, {
      type: "notifications.unreadCount",
      unreadCount: Number(unreadCount),
    });

    // outbox + audit inchangés
    await deps.outboxRepo.enqueue({
      id: randomUUID(),
      aggregateType: "decision",
      aggregateId: id,
      eventType: "decision.status_changed",
      correlationId: ctx.correlationId,
      payload: {
        decisionId: id,
        orgId: principal.orgId,
        status: body.status,
        changedBy: principal.userId,
      },
    });

    await deps.audit.log(ctx, {
      actorUserId: principal.userId,
      action: "DECISION_STATUS_CHANGED",
      entityType: "decision",
      entityId: id,
      payload: { status: body.status },
    });

    return { ok: true };
  }
);

  // NEW VERSION (only if draft)
  app.post(
    "/decisions/:id/versions",
    { preHandler: [authPreHandler(deps)] },
    async (req) => {
      const ctx = getCtx(req);
      const principal = getPrincipal(req);
      const id = getIdParam(req);
      const body = NewVersionSchema.parse(getBody(req));

      await authorize({
        ctx,
        principal,
        action: "decision.update",
        resource: { type: "decision", id, orgId: principal.orgId },
        policyEvalRepo: deps.policyEvalRepo,
      });

      const decision = await deps.decisionsRepo.getDecision(id, principal.orgId);
      if (!decision) throw new AppError("NOT_FOUND", "Decision not found", 404);

      if (decision.status !== "draft") {
        throw new AppError("CONFLICT", "Decision is not editable", 409);
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
        action: "DECISION_VERSIONED",
        entityType: "decision",
        entityId: id,
        payload: { version },
      });

      return { ok: true, version };
    }
  );

  // APPROVE
  app.post(
    "/decisions/:id/approve",
    { preHandler: [authPreHandler(deps)] },
    async (req) => {
      const ctx = getCtx(req);
      const principal = getPrincipal(req);
      const id = getIdParam(req);

      await authorize({
        ctx,
        principal,
        action: "decision.approve",
        resource: { type: "decision", id, orgId: principal.orgId },
        policyEvalRepo: deps.policyEvalRepo,
      });

      const decision = await deps.decisionsRepo.getDecision(id, principal.orgId);
      if (!decision) throw new AppError("NOT_FOUND", "Decision not found", 404);

      await deps.decisionsRepo.approveDecision({
        decisionId: id,
        approvedBy: principal.userId,
        orgId: principal.orgId,
      });

      await deps.outboxRepo.enqueue({
        id: randomUUID(),
        aggregateType: "decision",
        aggregateId: id,
        eventType: "decision.approved",
        correlationId: ctx.correlationId,
        payload: {
          decisionId: id,
          orgId: principal.orgId,
          approvedBy: principal.userId,
        },
      });

      await deps.audit.log(ctx, {
        actorUserId: principal.userId,
        action: "DECISION_APPROVED",
        entityType: "decision",
        entityId: id,
        payload: {},
      });

      return { ok: true };
    }
  );

  // COMMENT
  app.post(
    "/decisions/:id/comments",
    { preHandler: [authPreHandler(deps)] },
    async (req) => {
      const ctx = getCtx(req);
      const principal = getPrincipal(req);
      const id = getIdParam(req);
      const body = AddCommentSchema.parse(getBody(req));

      await authorize({
        ctx,
        principal,
        action: "decision.comment",
        resource: { type: "decision", id, orgId: principal.orgId },
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
        action: "DECISION_COMMENTED",
        entityType: "decision",
        entityId: id,
        payload: {},
      });

      return { ok: true };
    }
  );
}