import Fastify from 'fastify';
import { env } from '../env';
import { buildRequestContext } from '../core/request-context';
import { AppError } from '../core/errors';
import { createSql } from '../db/client';
import Redis from 'ioredis';
import { buildAuditService } from '../modules/audit/audit.service';
import { SSEHub } from '../modules/notifications/sseHub';
import cors from '@fastify/cors';


import { registerAuthRoutes } from '../modules/auth/auth.routes';
import { registerMeRoutes } from '../modules/auth/me.routes';
import { registerDecisionRoutes } from '../modules/decisions/decisions.routes';
import { registerImpactRoutes } from '../modules/impact/impact.routes';
import { registerHealthRoutes } from '../modules/health/health.routes';
import { httpRequestDuration } from './metrics.routes';
import { registerMetricsRoutes } from './metrics.routes';
import { registerInAppNotificationRoutes } from '../modules/notifications/inapp.routes';
import { registerOpsRoutes } from '../modules/ops/ops.routes';
import { OpsDeps } from '../modules/ops/ops.routes';


import { buildImpactRepo } from '../modules/impact/impact.repo';
import { buildOutboxRepo } from '../modules/outbox/outbox.repo';
import { buildDecisionsRepo } from '../modules/decisions/decisions.repo';
import { buildAuditRepo } from '../modules/audit/audit.repo';
import { buildAuthRepo } from '../modules/auth/auth.repo';
import { buildPolicyEvalRepo } from '../modules/policy/policyEvaluation.repo';
import { buildInAppRepo, InAppNotificationRow } from '../modules/notifications/inapp.repo';
import { buildDlqRepo } from '../modules/ops/dlq.repo';

declare module 'fastify' {
  interface FastifyRequest {
    _startAt?: bigint;  
  }
}


type AuthRoutesDeps = Parameters<typeof registerAuthRoutes>[1];
type MeRoutesDeps = Parameters<typeof registerMeRoutes>[1];
type InAppRoutesDeps = Parameters<typeof registerInAppNotificationRoutes>[1];
type InAppRoutesRepo = InAppRoutesDeps["inAppRepo"];
type DecisionDeps = Parameters<typeof registerDecisionRoutes>[1];



export async function buildApp() {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'development'
        ? {
            level: env.LOG_LEVEL,
            transport: { target: 'pino-pretty', options: { colorize: true } },
          }
        : { level: env.LOG_LEVEL },
  });
  
  app.decorateRequest('principal', undefined);
  app.decorateRequest('ctx')


  await app.register(cors, {
    origin: (origin, cb) => {
      // autorise aussi curl / server-to-server (origin undefined)
      if (!origin) return cb(null, true);

      const allowed = ['http://localhost:3000', 'http://127.0.0.1:3000'];

      cb(null, allowed.includes(origin));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // --- deps (DI minimal)
  const sql = createSql();
  const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2 });

  const auditRepo = buildAuditRepo(sql);
  const audit = buildAuditService(auditRepo);
  const impactRepo = buildImpactRepo(sql)
  const dlqRepo = buildDlqRepo(sql);
  const inAppRepo = buildInAppRepo(sql);

  const inAppRepoForRoutes = {
  unreadCount: async (userId: string) =>
    Number(await inAppRepo.unreadCount(userId)),

  listInbox: async (userId: string, limit: number, cursor?: string) => {
    const rows = await inAppRepo.listInbox(userId, limit, cursor);
    const array = Array.from(rows) as InAppNotificationRow[];

    return array.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title ?? null,
      body: r.body ?? null,
      entityType: r.entityType ?? null,
      entityId: r.entityId ?? null,
      createdAt: (r.createdAt ?? new Date()).toISOString(),
      readAt: r.readAt ? new Date(r.readAt).toISOString() : null,
    }));
  },

  markRead: (userId: string, id: string) => inAppRepo.markRead(userId, id),
  markAllRead: (userId: string) => inAppRepo.markAllRead(userId),
} satisfies InAppRoutesRepo;

const inAppRepoForDecisions = {
  insert: (row) => inAppRepo.insert(row),
  unreadCount: (userId: string) => inAppRepo.unreadCount(userId),
} satisfies DecisionDeps["inAppRepo"];

  const sseHub = new SSEHub();

  const decisionsRepo = buildDecisionsRepo(sql);
  const outboxRepo = buildOutboxRepo(sql);
  const policyEvalRepo = buildPolicyEvalRepo(
    sql,
  ) as MeRoutesDeps['policyEvalRepo'];

  const authRepoBase = buildAuthRepo(sql);

  const authRepo: AuthRoutesDeps['authRepo'] = Object.assign({
    ...(authRepoBase as unknown as Record<string, unknown>),
    async findUserByEmail(email: string) {
      console.log('[authRepo.findUserByEmail OVERRIDE]', email);

      const rows = await sql`
      SELECT
        u.id            AS "id",
        u.email         AS "email",
        u.password_hash AS "passwordHash",
        u.display_name  AS "displayName",
        m.org_id        AS "orgId",
        m.role          AS "role"
      FROM users u
      JOIN memberships m ON m.user_id = u.id
      WHERE u.email = ${email}
      ORDER BY m.created_at DESC
      LIMIT 1
    `;

      return rows[0] ?? null;
    },

    async createUser() {
      throw new Error('createUser not implemented in buildAuthRepo');
    },
    async createOrg() {
      throw new Error('createOrg not implemented in buildAuthRepo');
    },
    async addMembership() {
      throw new Error('addMembership not implemented in buildAuthRepo');
    },
  });

  await app.register(async (a) =>
    registerDecisionRoutes(a, {
      impactRepo,
      decisionsRepo,
      authRepo,
      policyEvalRepo,
      audit,
      outboxRepo,
      inAppRepo: inAppRepoForDecisions,
      sseHub,
    }),
  );

  await app.register(async (a) =>
  registerInAppNotificationRoutes(a, {
    authRepo,
    policyEvalRepo,
    inAppRepo: inAppRepoForRoutes, 
    sseHub,
  })
);

  await app.register(async (a) =>
    registerImpactRoutes(a, {
      impactRepo,
      authRepo,
      policyEvalRepo,
      audit,
    }),
    {prefix: '/impact'}
  );

  const opsDeps: OpsDeps = {authRepo, policyEvalRepo, dlqRepo, audit };
  await app.register(async (a) => registerOpsRoutes(a, opsDeps));
 

  // --- request context + correlation
  app.addHook('onRequest', async (req, reply) => {
    const ctx = buildRequestContext(req.headers);
    req.ctx = ctx;

    reply.header('x-correlation-id', ctx.correlationId);

    req.log = req.log.child({
      requestId: ctx.requestId,
      correlationId: ctx.correlationId,
    });
    req._startAt = process.hrtime.bigint();
  });

  // --- errors
  app.setErrorHandler((err, req, reply) => {
    const e =
      err instanceof AppError
        ? err
        : new AppError('INTERNAL', 'Internal error', 500);
    req.log.error({ err, code: e.code }, 'request failed');
    reply.status(e.status).send({
      error: { code: e.code, message: e.message, meta: e.meta ?? null },
    });
  });

  // --- routes
  await app.register(async (a) => registerHealthRoutes(a, { sql, redis }));
  await app.register(async (a) => registerAuthRoutes(a, { authRepo, audit }));

  app.register(async (a) =>
    registerMeRoutes(a, {
      getRole: (orgId, userId) => authRepoBase.getMembership(orgId, userId),
      policyEvalRepo,
    }),
  );

  await app.register(registerMetricsRoutes);


app.addHook('onResponse', async (req, reply) => {
  const route = (req.routeOptions?.url ?? req.url ?? '').split('?')[0];

  const start =  req._startAt 
  if (!start) return;

  const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

  httpRequestDuration
    .labels(req.method, route, String(reply.statusCode))
    .observe(durationMs);
});

  // --- shutdown
  app.addHook('onClose', async () => {
    await redis.quit().catch(() => undefined);
    await sql.end({ timeout: 5 });
  });

  return app;
}


