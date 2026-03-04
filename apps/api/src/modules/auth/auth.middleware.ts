import type { FastifyRequest } from 'fastify';
import { AppError } from '../../core/errors';
import { verifyAccessToken } from './auth.jwt';
import type { Role } from './auth.types';
import { RoleRank } from './auth.types';

const PUBLIC_PATHS = new Set(['/metrics', '/health', '/ready']);

export type AuthPrincipal = {
  orgId: string;
  userId: string;
  role: Role;
};
declare module 'fastify' {
  interface FastifyRequest {
    principal: AuthPrincipal;
  }
}

export function getBearerToken(req: FastifyRequest) {
  // 1) Header Authorization (fetch normal)
  const h = req.headers.authorization;
  if (typeof h === "string" && h.length > 0) {
    const [type, token] = h.split(" ");
    if (type === "Bearer" && token) return token;
  }

  // 2) Query token (SSE EventSource)
  const q = (req.query ?? {}) as { access_token?: string; token?: string };

  const qt =
    (typeof q.access_token === "string" && q.access_token) ||
    (typeof q.token === "string" && q.token) ||
    null;

  return qt;
}

export function authenticate(deps: {
  getRole: (orgId: string, userId: string) => Promise<Role | null>;
}) {
  return async function (req: FastifyRequest) {
    if (req.method === 'OPTIONS') return;

    const path = (req.url ?? '').split('?')[0];
    if (PUBLIC_PATHS.has(path)) return;

    const token = getBearerToken(req);
    if (!token) throw new AppError('UNAUTHORIZED', 'Missing access token', 401);

    let parsed: { orgId: string; userId: string };
    try {
      parsed = await verifyAccessToken(token);
      console.log('PARSED TOKEN=', parsed);
    } catch {
      throw new AppError('UNAUTHORIZED', 'Invalid access token', 401);
    }

    const role = await deps.getRole(parsed.orgId, parsed.userId);
    console.log('GETROLE args', parsed.orgId, parsed.userId, '->', role);

    if (!role) throw new AppError('FORBIDDEN', 'No membership in org', 403);

    req.principal = { ...parsed, role } satisfies AuthPrincipal;
  };
}

export function requireRole(minRole: Role) {
  return async function (req: FastifyRequest) {
    const p = req.principal as AuthPrincipal | undefined;

    if (!p) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    if (RoleRank[p.role] < RoleRank[minRole]) {
      throw new AppError('FORBIDDEN', `Requires role ${minRole}`, 403, {
        have: p.role,
      });
    }
  };
}
