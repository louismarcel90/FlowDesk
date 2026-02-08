import type { FastifyInstance } from 'fastify'
import { authorize } from '../policy/authorize'
import { authenticate } from './auth.middleware'
import type { RequestContext } from '../../core/request-context'

type AuthorizeOpts = Parameters<typeof authorize>[0]
type AuthenticateOpts = Parameters<typeof authenticate>[0]

type Deps = {
    getRole: AuthenticateOpts['getRole']
    policyEvalRepo: AuthorizeOpts['policyEvalRepo']
  }


export async function registerMeRoutes(app: FastifyInstance, deps: Deps) {
  app.get(
    '/me',
    { preHandler: [authenticate({ getRole: deps.getRole })] },
    async (req) => {
      const ctx = (req).ctx as RequestContext
      const principal = (req).principal

      await authorize({
        ctx,
        principal,
        action: 'me.read',
        resource: { type: 'me', id: principal.userId, orgId: principal.orgId },
        policyEvalRepo: deps.policyEvalRepo,
      })

      return { ok: true, ctx, principal }
    }
  )
}
