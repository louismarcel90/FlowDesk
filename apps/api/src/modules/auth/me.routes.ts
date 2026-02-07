import type { FastifyInstance } from 'fastify';
import { authenticate } from './auth.middleware';
import type { Role } from './auth.types';

type Deps = {
  getRole: (orgId: string, userId: string) => Promise<Role | null>;
};

export async function registerMeRoutes(app: FastifyInstance, deps: Deps) {
  app.get(
    '/me',
    { preHandler: [authenticate({ getRole: deps.getRole })] },
    async (req) => {
      // req.ctx et req.principal viennent de fastify.d.ts
      const ctx = req.ctx;
      const principal = req.principal;

      return { ok: true, ctx, principal };
    }
  );
}
