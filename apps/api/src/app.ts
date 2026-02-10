import Fastify from 'fastify';
import type { FastifyRequest } from 'fastify';
import { env } from './config/env';
import { buildRequestContext } from './core/request-context';
import { AppError } from './core/errors';
import cors from '@fastify/cors';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
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

  app.addHook('onRequest', async (req: FastifyRequest) => {
    req.ctx = buildRequestContext(req.headers);
  });

  app.setErrorHandler((err, req, reply) => {
    const e =
      err instanceof AppError
        ? err
        : new AppError('INTERNAL', 'Internal error', 500);
    req.log.error({ err, code: e.code }, 'request failed');
    reply
      .status(e.status)
      .send({ error: { code: e.code, message: e.message, meta: e.meta } });
  });

  app.get('/health', async () => ({ ok: true, service: 'api' }));

  return app;
}
