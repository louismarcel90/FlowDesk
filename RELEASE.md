# Release Checklist

## Before merge to main
- [ ] pnpm lint
- [ ] pnpm typecheck
- [ ] pnpm test
- [ ] pnpm build
- [ ] Infra up locally, run smoke test:
  - /healthz, /readyz, /metrics
  - notifications end-to-end approve -> inbox badge + email
- [ ] Verify OPA policies loaded and tests pass

## Deploy
- [ ] Tag release vX.Y.Z
- [ ] Deploy staging from develop
- [ ] Run DB migrations
- [ ] Start workers
- [ ] Validate dashboards

## Rollback
- [ ] Roll back app version
- [ ] Workers: stop new consumers
- [ ] DB: migrations are additive; do not rollback unless required
