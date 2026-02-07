import { randomUUID } from 'node:crypto';
import type { RequestContext } from '../../core/request-context';
import type { AuditEvent } from './audit.repo';
import { buildAuditRepo } from './audit.repo';

// Type du repo = type de retour de buildAuditRepo
type AuditRepo = ReturnType<typeof buildAuditRepo>;

export function buildAuditService(
  auditRepo: AuditRepo,
  now = () => new Date()
) {
  return {
    async log(
      ctx: RequestContext,
      event: Omit<AuditEvent, 'id' | 'occurredAt' | 'correlationId'>
    ) {
      await auditRepo.append({
        id: randomUUID(),
        occurredAt: now(),
        correlationId: ctx.correlationId,
        ...event,
      });
    },
  };
}
