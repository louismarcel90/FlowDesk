import Fastify from 'fastify';
import { env } from '../env';
import { buildRequestContext } from '../core/request-context';
import { AppError } from '../core/errors';
import { createSql } from '../db/client';
import Redis from 'ioredis';
import { registerHealthRoutes } from '../modules/health/health.routes';

import { buildAuthRepo } from '../modules/auth/auth.repo';
import { registerAuthRoutes } from '../modules/auth/auth.routes';
import { registerMeRoutes } from '../modules/auth/me.routes';
import { buildAuditRepo } from '../modules/audit/audit.repo';
import { buildAuditService } from '../modules/audit/audit.service';
import { buildPolicyEvalRepo } from '../modules/policy/policyEvaluation.repo';

import { buildDecisionsRepo } from '../modules/decisions/decisions.repo';
import { registerDecisionRoutes } from '../modules/decisions/decisions.routes';
import { registerImpactRoutes } from '../modules/impact/impact.routes';
import { buildImpactRepo } from '../modules/impact/impact.repo';

import cors from '@fastify/cors';

type AuthRoutesDeps = Parameters<typeof registerAuthRoutes>[1];
type MeRoutesDeps = Parameters<typeof registerMeRoutes>[1];

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
  const policyEvalRepo = buildPolicyEvalRepo(
    sql,
  ) as unknown as MeRoutesDeps['policyEvalRepo'];

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

  const decisionsRepo = buildDecisionsRepo(sql);

  await app.register(async (a) =>
    registerDecisionRoutes(a, {
      impactRepo,
      decisionsRepo,
      authRepo,
      policyEvalRepo,
      audit,     
    }),
  );

  await app.register(async (a) =>
    registerImpactRoutes(a, {
      impactRepo,
      authRepo,
      policyEvalRepo,
      audit,
    }),
  );
 

 

  // --- request context + correlation
  app.addHook('onRequest', async (req, reply) => {
    const ctx = buildRequestContext(req.headers);
    req.ctx = ctx;

    reply.header('x-correlation-id', ctx.correlationId);

    req.log = req.log.child({
      requestId: ctx.requestId,
      correlationId: ctx.correlationId,
    });
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
  registerHealthRoutes(app, { sql, redis });
  app.register(async (a) => registerAuthRoutes(a, { authRepo, audit }));

  app.register(async (a) =>
    registerMeRoutes(a, {
      getRole: (orgId, userId) => authRepoBase.getMembership(orgId, userId),
      policyEvalRepo,
    }),
  );

  // --- shutdown
  app.addHook('onClose', async () => {
    await redis.quit().catch(() => undefined);
    await sql.end({ timeout: 5 });
  });

  return app;
}
