import type { FastifyRequest } from 'fastify';
import { AppError } from '../../core/errors';
import { verifyAccessToken } from './auth.jwt';
import type { Role } from './auth.types';
import { RoleRank } from './auth.types';

/**
 * Routes publiques (pas d'auth)
 * - /metrics : scrape Prometheus / healthchecks -> sinon boucle 401
 * - /health, /ready : endpoints ops classiques
 * - /internal/metrics : si tu l'utilises (d'après ton arbre de routes)
 */
const PUBLIC_PATHS = new Set([
  '/metrics',
  '/health',
  '/ready',
]);

export type AuthPrincipal = {
  orgId: string;
  userId: string;
  role: Role;
};

// Ajoute req.principal dans FastifyRequest (runtime: on le set dans authenticate)
declare module 'fastify' {
  interface FastifyRequest {
    principal: AuthPrincipal;
  }
}

export function getBearerToken(req: FastifyRequest) {
  // garde tes logs si tu veux debug; sinon tu peux les retirer
  console.log('AUTH HEADER RAW=', req.headers.authorization);

  const h = req.headers.authorization;
  if (!h) return null;

  const [type, token] = h.split(' ');
  if (type !== 'Bearer' || !token) return null;

  return token;
}

/**
 * Middleware d'auth à brancher en hook global (preValidation / onRequest etc.)
 * Exemple:
 *   app.addHook('preValidation', authenticate({ getRole }))
 */
export function authenticate(deps: {
  getRole: (orgId: string, userId: string) => Promise<Role | null>;
}) {
  return async function (req: FastifyRequest) {
    // ✅ Skip preflight
    if (req.method === 'OPTIONS') return;

    // ✅ Skip routes publiques
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

/**
 * Guard de rôle à utiliser au niveau des routes
 * Exemple:
 *   app.get('/admin', { preValidation: requireRole('ADMIN') }, handler)
 */
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
