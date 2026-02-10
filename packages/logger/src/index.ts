import pino from 'pino';

export type Logger = pino.Logger;

export function createLogger(opts?: { level?: string; name?: string }) {
  return pino({
    level: opts?.level ?? process.env.LOG_LEVEL ?? 'info',
    base: { service: opts?.name ?? 'flowdesk' },
  });
}
