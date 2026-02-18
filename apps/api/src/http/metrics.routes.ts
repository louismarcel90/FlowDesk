import type { FastifyInstance } from 'fastify';
import client from 'prom-client';

type MetricsState = {
  register: client.Registry;
  httpRequestDuration: client.Histogram<'method' | 'route' | 'status'>;
};

const g = globalThis as unknown as { __flowdesk_metrics__?: MetricsState };

if (!g.__flowdesk_metrics__) {
  const register = new client.Registry();

  // métriques par défaut (CPU, memory, event loop, etc.)
  client.collectDefaultMetrics({ register });

  const httpRequestDuration = new client.Histogram({
    name: 'flowdesk_http_request_duration_ms',
    help: 'HTTP request duration in ms',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  });

  register.registerMetric(httpRequestDuration);

  g.__flowdesk_metrics__ = { register, httpRequestDuration };
}

export const { register, httpRequestDuration } = g.__flowdesk_metrics__!;

export async function registerMetricsRoutes(app: FastifyInstance) {
  app.get('/metrics', async (_req, reply) => {
    reply.header('content-type', register.contentType);
    return register.metrics();
  });
}
