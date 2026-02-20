import 'fastify';
import type { AuthPrincipal } from './modules/auth/auth.types';
import type { RequestContext } from '../core/request-context';


declare module 'fastify' {
  interface FastifyRequest {
    ctx: RequestContext;
    principal: AuthPrincipal;
  }
}
export{}