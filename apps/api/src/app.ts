import Fastify from 'fastify';
import type { FastifyRequest } from 'fastify';
import { env } from './config/env';
import { createContext } from './core/request-context';
import { AppError } from './core/errors';

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  app.addHook('onRequest', async (req: FastifyRequest) => {
    req.ctx = createContext(req.headers);
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
