import { randomUUID } from 'node:crypto';

export type RequestContext = {
  requestId: string;
  correlationId: string;
};

export function buildRequestContext(
  headers: Record<string, unknown>,
): RequestContext {
  const raw = headers['x-correlation-id'];
  const correlationId =
    typeof raw === 'string' && raw.length > 0 ? raw : randomUUID();
  return { requestId: randomUUID(), correlationId };
}
