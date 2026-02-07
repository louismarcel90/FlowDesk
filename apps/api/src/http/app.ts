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


export async function buildApp() {

  const app = Fastify({
    logger:
      env.NODE_ENV === 'development'
        ? {
            level: env.LOG_LEVEL,
            transport: { target: 'pino-pretty', options: { colorize: true } }
          }
        : { level: env.LOG_LEVEL }
  });

  // --- deps (DI minimal)
  const sql = createSql();
  const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2 });
  const authRepo = buildAuthRepo(sql);
  const auditRepo = buildAuditRepo(sql);
  const audit = buildAuditService(auditRepo);


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
    const e = err instanceof AppError ? err : new AppError('INTERNAL', 'Internal error', 500);
    req.log.error({ err, code: e.code }, 'request failed');
    reply.status(e.status).send({
      error: { code: e.code, message: e.message, meta: e.meta ?? null }
    });
  });

  // --- routes
  registerHealthRoutes(app, { sql, redis });
  app.register(async (a) => registerAuthRoutes(a, { authRepo, audit }));
  app.register(async (a) =>
  registerMeRoutes(a, { getRole: (orgId, userId) => authRepo.getMembership(orgId, userId) })
);


  // --- shutdown
  app.addHook('onClose', async () => {
    await redis.quit().catch(() => undefined);
    await sql.end({ timeout: 5 });
  });

  return app;
}
