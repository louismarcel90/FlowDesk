import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    ctx: ReturnType<typeof import('../core/request-context').createContext>;
  }
}
