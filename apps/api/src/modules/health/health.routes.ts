import type { FastifyInstance } from 'fastify';
import type { Sql } from 'postgres';
import type Redis from 'ioredis';
import { env } from '../../env';
import { AppError } from '../../core/errors';

type Deps = {
  sql: Sql;
  redis: Redis;
};

async function checkOPA(): Promise<boolean> {
  try {
    const res = await fetch(`${env.OPA_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function registerHealthRoutes(app: FastifyInstance, deps: Deps) {
  app.get('/health', async () => ({ ok: true, service: env.APP_NAME }));

  app.get('/ready', async () => {
    let dbok = false;
    try {
      await (deps.sql as unknown as (q: string) => Promise<unknown>)('select 1');
      dbok = true;
    } catch {
      dbok = false;
    }

    let redisok = false;
    try {
      redisok = (await deps.redis.ping()) === 'PONG';
    } catch {
      redisok = false;
    }

    const opaok = await checkOPA();

    if (!dbok || !redisok || !opaok) {
      throw new AppError('DEPENDENCY_UNAVAILABLE', 'Dependency unavailable', 503, {
        dbok,
        redisok,
        opaok,
      });
    }

    return { ok: true, dbok, redisok, opaok };
  });
}
