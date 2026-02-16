import type { FastifyInstance } from 'fastify';

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get('/healthz', async () => ({ ok: true }));
  app.get('/readyz', async () => ({ ok: true })); // ToDo: Later check DB/redis/kafka connectivity
}
