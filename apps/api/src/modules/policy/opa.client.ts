import { env } from '../../config/env';

export type OpaInput = {
  principal: { userId: string; orgId: string; role: string };
  action: string;
  resource: { type: string; id: string; orgId?: string };
};

export type OpaDecision = { allow: boolean; reason?: string; rule?: string };

export async function evaluate(input: OpaInput): Promise<OpaDecision> {
  const res = await fetch(`${env.OPA_URL}/v1/data/flowdesk/authz`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ input }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OPA evaluate failed: ${res.status} ${t}`);
  }

  const json = await res.json();
  // OPA data response shape: { result: {...} } depending on rego
  const r = json?.result ?? json; // defensive
  const allow = Boolean(r?.allow);
  const reason = typeof r?.reason === 'string' ? r.reason : undefined;
  const rule = typeof r?.rule === 'string' ? r.rule : undefined;
  return { allow, reason, rule };
}
