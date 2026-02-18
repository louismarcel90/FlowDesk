# Deployment Guide — FlowDesk

## Architecture Overview

Components:
- API (Fastify)
- Workers:
  - Outbox Publisher
  - Orchestrator
  - Email Delivery
- PostgreSQL
- Redis
- Kafka (Redpanda)
- OPA
- Prometheus + Grafana

---

# 1️⃣ Environments

## Local
Docker compose:
pnpm infra:up

## Staging
- Same infra as production
- Lower scale
- Smoke tests enabled

## Production
- Managed PostgreSQL
- Managed Kafka
- Horizontal API scaling
- Horizontal worker scaling

---

# 2️⃣ Build

pnpm build

Docker build (recommended):
docker build -t flowdesk-api .
docker build -t flowdesk-workers .

---

# 3️⃣ Deployment Steps

1. Deploy new API image
2. Run DB migrations
3. Deploy workers
4. Verify:
   - /healthz
   - /metrics
   - Notifications end-to-end
   - DLQ empty

---

# 4️⃣ Rollback Strategy

If release fails:

1. Stop workers
2. Roll back API container
3. Restart workers
4. Monitor metrics
5. Inspect audit logs

Note:
- Migrations are additive
- Avoid destructive changes

---

# 5️⃣ Scaling Strategy

API:
- Stateless
- Horizontal scaling

Workers:
- Scale based on Kafka consumer lag

Database:
- Read replicas for analytics

---

# 6️⃣ Backup Strategy

Production:
- Daily DB snapshot
- Retention: 14 days
- Restore tested quarterly
