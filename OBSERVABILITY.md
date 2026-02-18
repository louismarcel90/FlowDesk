# Observability Architecture — FlowDesk

## Goals

- Detect issues early
- Diagnose quickly
- Ensure system reliability
- Provide operational transparency

---

# 1️⃣ Metrics

Exposed endpoint:
- GET /metrics (Prometheus format)

Tracked:
- flowdesk_http_request_duration_ms
- Notification retry counts
- DLQ growth
- Job processing time

---

# 2️⃣ Health Endpoints

- /healthz → liveness
- /readyz → readiness

Used by:
- Load balancers
- Container orchestrators
- CI smoke tests

---

# 3️⃣ Logging

All logs:
- Structured JSON
- Include correlation_id
- Include notification_id when relevant
- Include job_id when relevant

Workers log:
- Publish events
- Orchestration events
- Delivery attempts
- Retry scheduling
- DLQ insertions

---

# 4️⃣ Dashboards

Prometheus → http://localhost:9090  
Grafana → http://localhost:3005  

Dashboards should track:
- HTTP latency p95
- Error rate
- Job retry rate
- DLQ growth over time
- Notification delivery success %

---

# 5️⃣ Alerting Strategy (Future)

Critical alerts:
- DLQ count > threshold
- Delivery error rate > 5%
- API latency p95 > 1s
- Kafka consumer lag

---

# 6️⃣ Correlation & Tracing

Each request generates:
- correlation_id

Propagated to:
- Outbox event
- Kafka event
- Notification
- Email headers

Allows:
- End-to-end traceability
