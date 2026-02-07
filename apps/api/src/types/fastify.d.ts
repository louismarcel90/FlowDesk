import 'fastify';
import type { AuthPrincipal } from './modules/auth/auth.types';


declare module 'fastify' {
  interface FastifyRequest {
    ctx: ReturnType<typeof import('../core/request-context').createContext>;
    principal?: AuthPrincipal;
  }
}
