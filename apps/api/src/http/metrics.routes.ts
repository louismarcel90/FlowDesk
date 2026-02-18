import type { FastifyInstance } from 'fastify';
import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: 'flowdesk_http_request_duration_ms',
  help: 'HTTP request duration in ms',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
});

register.registerMetric(httpRequestDuration);

export async function registerMetricsRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => {
    reply.header('content-type', register.contentType);
    return register.metrics();
  });
}
