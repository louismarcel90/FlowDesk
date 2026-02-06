import { randomUUID } from 'node:crypto';

export type RequestContext = {
  requestId: string;
  correlationId: string;
  userId?: string;
};

export function createContext(
  headers: Record<string, unknown>,
): RequestContext {
  const h = (k: string) => String(headers[k] ?? '');
  return {
    requestId: randomUUID(),
    correlationId: h('x-correlation-id') || randomUUID(),
  };
}
