import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import type { RequestContext } from "../../core/request-context";
import { authenticate } from "../auth/auth.middleware";
import { authorize } from "../policy/authorize";
import type { Role } from "../auth/auth.types";
import type { PolicyEvalRepo } from "../policy/policyEvaluation.types";
import type { SSEHub, SSEPayload } from "./sseHub";

const InboxQuery = z.object({
  limit: z.coerce.number().min(1).max(100).default(30),
  cursor: z.string().optional(),
});

export type InAppNotification = {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: string; 
  readAt: string | null; 
};

type Principal = {
  orgId: string;
  userId: string;
  role: string;
  displayName?: string | null;
};

export async function registerInAppNotificationRoutes(
  app: FastifyInstance,
  deps: {
    authRepo: { getMembership(orgId: string, userId: string): Promise<Role | null> };
    policyEvalRepo: PolicyEvalRepo;
    inAppRepo: {
      unreadCount(userId: string): Promise<number>;
      listInbox(userId: string, limit: number, cursor?: string): Promise<InAppNotification[]>;
      markRead(userId: string, id: string): Promise<void>;
      markAllRead(userId: string): Promise<void>;
    };
    sseHub: SSEHub;
  }
) {
  const auth = authenticate({
    getRole: (o, u) => deps.authRepo.getMembership(o, u),
  });

  // GET /notifications/unread-count
  app.get("/notifications/unread-count", { preHandler: [auth] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = req.ctx as RequestContext;
    const principal = req.principal as Principal | undefined;

    if (!principal) return reply.code(401).send({ error: "Unauthorized" });

    await authorize({
      ctx,
      principal,
      action: "notifications.read",
      resource: { type: "notification", id: "*", orgId: principal.orgId },
      policyEvalRepo: deps.policyEvalRepo,
    });

    const count = await deps.inAppRepo.unreadCount(principal.userId);
    return { unreadCount: count };
  });

  // GET /notifications/inbox
  app.get("/notifications/inbox", { preHandler: [auth] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = req.ctx as RequestContext;
    const principal = req.principal as Principal | undefined;

    if (!principal) return reply.code(401).send({ error: "Unauthorized" });

    await authorize({
      ctx,
      principal,
      action: "notifications.read",
      resource: { type: "notification", id: "*", orgId: principal.orgId },
      policyEvalRepo: deps.policyEvalRepo,
    });

    const q = InboxQuery.parse(req.query);
    const items = await deps.inAppRepo.listInbox(principal.userId, q.limit, q.cursor);

    // nextCursor: basé sur createdAt du dernier item
    const last = items[items.length - 1]?.createdAt ?? null;

    return {
      items,
      nextCursor: last,
    };
  });

  // POST /notifications/:id/read
  app.post<{ Params: { id: string } }>(
    "/notifications/:id/read",
    { preHandler: [auth] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const ctx = req.ctx as RequestContext;
        const principal = req.principal as Principal | undefined;

        if (!principal) return reply.code(401).send({ error: "Unauthorized" });

        await authorize({
          ctx,
          principal,
          action: "notifications.read",
          resource: { type: "notification", id: req.params.id, orgId: principal.orgId },
          policyEvalRepo: deps.policyEvalRepo,
        });

        await deps.inAppRepo.markRead(principal.userId, req.params.id);
        const count = await deps.inAppRepo.unreadCount(principal.userId);

        deps.sseHub.publish(principal.userId, {
          type: "unread_count_updated",
          unreadCount: count,
        });

        return { ok: true, unreadCount: count };
      } catch (err) {
        req.log.error({ err }, "POST /notifications/:id/read failed");
        return reply.code(500).send({ error: { message: err instanceof Error ? err.message : String(err) } });
      }
    }
  );

  // POST /notifications/read-all
  app.post("/notifications/read-all", { preHandler: [auth] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const ctx = req.ctx as RequestContext;
      const principal = req.principal as Principal | undefined;

      if (!principal) return reply.code(401).send({ error: "Unauthorized" });

      await authorize({
        ctx,
        principal,
        action: "notifications.read",
        resource: { type: "notification", id: "*", orgId: principal.orgId },
        policyEvalRepo: deps.policyEvalRepo,
      });

      await deps.inAppRepo.markAllRead(principal.userId);

      deps.sseHub.publish(principal.userId, {
        type: "unread_count_updated",
        unreadCount: 0,
      });

      return { ok: true, unreadCount: 0 };
    } catch (err) {
      req.log.error({ err }, "POST /notifications/read-all failed");
      const message = err instanceof Error ? err.message : String(err);
      const statusCode = message.toLowerCase().includes("forbidden") ? 403 : 500;
      return reply.code(statusCode).send({ error: { message } });
    }
  });

  // GET /notifications/stream  (SSE)
  app.get("/notifications/stream", { preHandler: [auth] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const principal = req.principal as Principal | undefined;
    if (!principal) return reply.code(401).send({ error: "Unauthorized" });

    const userId = String(principal.userId);

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Origin": req.headers.origin ?? "http://localhost:3000",
      Vary: "Origin",
    });

    // keep open forever
    req.raw.setTimeout(0);
    reply.raw.flushHeaders?.();

    const write = (event: string, payload: unknown) => {
      reply.raw.write(`event: ${event}\n`);
      reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    // initial ping + count
    write("connected", { ok: true });

    const unreadCount = await deps.inAppRepo.unreadCount(userId);
    write("unread_count_updated", { unreadCount });

    // subscribe hub -> forward as SSE
    const unsubscribe = deps.sseHub.subscribe(userId, (payload: SSEPayload) => {
      // on route l'event SSE par payload.type
      write(payload.type ?? "notification", payload);
    });

    const heartbeat = setInterval(() => write("ping", {}), 15000);

    req.raw.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });
}
