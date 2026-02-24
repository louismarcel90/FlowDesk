import { randomUUID } from 'node:crypto';
import { AppError } from '../../core/errors';
import type { RequestContext } from '../../core/request-context';
import { evaluate } from './opa.client';
import type { PolicyEvalRepo } from './policyEvaluation.types'; 

export async function authorize(params: {
  ctx: RequestContext;
  principal: { userId: string; orgId: string; role: string };
  action: string;
  resource: { type: string; id: string; orgId?: string };
  policyEvalRepo: PolicyEvalRepo;
}) {
  const input = {
    principal: params.principal,
    action: params.action,
    resource: params.resource,
  };

  let decision: { allow: boolean; reason?: string; rule?: string };
  try {
    decision = await evaluate(input);
  } catch {
    throw new AppError(
      'DEPENDENCY_UNAVAILABLE',
      'Policy engine unavailable',
      503,
    );
  }

  await params.policyEvalRepo.insert({
    id: randomUUID(),
    occurredAt: new Date(),
    userId: params.principal.userId ?? null,
    orgId: params.principal.orgId ?? null,
    action: params.action,
    resourceType: params.resource.type,
    resourceId: params.resource.id,
    allow: decision.allow,
    reason: decision.reason ?? null,
    rule: decision.rule ?? null,
    correlationId: params.ctx.correlationId,
    input,
    result: decision,
  });

  if (!decision.allow) {
    throw new AppError('FORBIDDEN', 'Access denied', 403, {
      reason: decision.reason,
      rule: decision.rule,
    });
  }
}
