# SLO, SLI, and Scalability Model — FlowDesk

## Purpose

This document defines the service-level objectives, service-level indicators, and practical scalability assumptions for FlowDesk.

It exists to answer four critical questions:

1. What level of reliability is FlowDesk designed to provide?
2. How is reliability measured?
3. What are the operational thresholds for degradation?
4. What scaling assumptions and bottlenecks define the current architecture?

This document is intentionally practical and tied to the current implementation stage of FlowDesk.

---

# 1. Reliability Philosophy

FlowDesk is not optimized for raw throughput above all else.

Its primary priorities are:

- decision integrity
- auditability
- policy enforcement
- predictable asynchronous processing
- operator-visible recovery

This means the system intentionally favors:

- durable writes over ultra-low-latency shortcuts
- eventual consistency for notifications over synchronous coupling
- deterministic recovery paths over hidden retries

---

# 2. Service Tiers

FlowDesk has three logical service layers:

## 2.1 Core API Tier

Responsible for:

- decision CRUD
- initiative and metric management
- policy enforcement
- audit generation
- inbox reads

Reliability expectation:

- highest priority
- user-facing
- must remain responsive even if downstream notification systems are degraded

## 2.2 Async Processing Tier

Responsible for:

- outbox publishing
- notification orchestration
- delivery job execution
- retries
- DLQ handling

Reliability expectation:

- eventual completion
- bounded delay acceptable
- transparent failure tracking required

## 2.3 Observability / Ops Tier

Responsible for:

- metrics
- health/readiness
- DLQ visibility
- reprocessing controls

Reliability expectation:

- should remain available during degraded conditions
- critical for incident response

---

# 3. SLI Definitions

## 3.1 API Availability SLI

Definition:
Percentage of API requests that return a non-5xx response for valid traffic.

Formula:
successful_requests / total_valid_requests

Notes:

- 4xx responses caused by invalid client behavior are not counted as availability failures
- 5xx responses and dependency failures are counted as failures

## 3.2 API Latency SLI

Definition:
p95 request latency for user-facing routes.

Measured separately for:

- reads
- writes
- admin/ops endpoints

Notes:

- latency is measured at HTTP response boundary
- asynchronous work after response is excluded from synchronous API latency

## 3.3 Notification Completion SLI

Definition:
Percentage of notification jobs that reach terminal state `done` within the target delivery window.

Formula:
notifications_done_within_window / notifications_created

Notes:

- excludes jobs intentionally deferred by quiet hours until their valid window begins
- includes retries as long as terminal completion occurs within acceptable bounds

## 3.4 Notification Error SLI

Definition:
Percentage of notification jobs entering DLQ out of total created jobs.

Formula:
dlq_jobs / total_jobs

## 3.5 Inbox Freshness SLI

Definition:
Delay between a source domain event becoming publishable and the corresponding in-app notification becoming visible in the user inbox.

Formula:
in_app_created_at - outbox_event_occurred_at

## 3.6 Policy Availability SLI

Definition:
Percentage of authorization checks that complete successfully against OPA without dependency failure.

Formula:
successful_policy_evaluations / total_policy_evaluations

Important:

- a policy deny is not a failure
- an OPA outage or evaluation transport error is a failure

---

# 4. SLO Targets

## 4.1 Core API Availability

Target:
**99.9% monthly availability**

Applies to:

- decision routes
- initiative routes
- metric routes
- inbox routes
- auth routes

Interpretation:

- the platform should remain broadly usable for core workflows
- asynchronous subsystems may degrade without immediately violating this target if the core write/read path remains healthy

## 4.2 Core API Latency

Targets:

- **p95 read latency < 250ms**
- **p95 write latency < 400ms**
- **p99 latency < 1000ms**

Applies to:

- `/decisions`
- `/initiatives`
- `/metrics`
- `/notifications/inbox`
- related detail/read endpoints

Notes:

- local development may be slower
- these targets represent production expectations under normal operating load

## 4.3 Notification Orchestration Latency

Target:
**95% of notification jobs created within 30 seconds of source event publication**

This covers:

- outbox publisher
- Kafka transport
- orchestration worker processing
- job creation in DB

## 4.4 Email Delivery Completion

Target:
**95% of email notifications delivered within 5 minutes**
**99% delivered within 30 minutes**

Notes:

- quiet hours deferrals are excluded from breach calculations until eligible delivery window begins
- SMTP outages may temporarily cause breaches but should be visible and bounded by DLQ thresholds

## 4.5 In-App Notification Freshness

Target:
**95% of in-app notifications visible within 10 seconds of source event publication**

This target is stricter than email because:

- no external SMTP dependency exists
- in-app visibility is an internal product capability

## 4.6 Policy Evaluation Reliability

Target:
**99.95% successful policy evaluation dependency availability**

Because:

- fail-closed authorization is correct behavior
- but repeated policy engine unavailability is operationally unacceptable

---

# 5. Error Budget Model

## 5.1 Core API Availability Error Budget

At 99.9% monthly availability, the allowed downtime budget is approximately:

- ~43 minutes/month

Interpretation:

- repeated small dependency failures can consume budget quickly
- this budget is intended mainly for severe incidents, deployment regressions, or dependency outages

## 5.2 Notification Budget

Notifications are asynchronous and recoverable.

This means:

- temporary degradation is acceptable if jobs remain durable, visible, and recoverable
- silent loss is not acceptable

Therefore, the primary budget concern is not transient delay, but:

- DLQ growth
- backlog age
- permanent delivery failure rate

---

# 6. Scalability Assumptions

## 6.1 Current Architecture Shape

FlowDesk is currently designed for:

- low-to-moderate request volume
- high-value decision workflows
- strong governance and audit requirements
- multi-team organizations
- long-lived historical data

It is not currently designed for:

- consumer-scale social traffic
- massive fan-out push at millions of notifications per minute
- cross-region active-active deployment

## 6.2 Expected Practical Scale (Current Stage)

The current architecture should comfortably support:

- **100 to 500 daily active users**
- **10k to 50k decisions total**
- **100k+ audit rows**
- **tens of thousands of notification jobs**
- **burst traffic in the tens of requests per second**
- **notification spikes in the hundreds to low thousands per hour**

This is a realistic “strong internal platform / B2B SaaS early growth” scale target.

## 6.3 Primary Bottlenecks

Current expected bottlenecks include:

### Database

- inbox unread count queries
- list endpoints without pagination hardening
- audit/event table growth
- notification job scanning

### Workers

- single-process publisher throughput
- single-process orchestrator throughput
- email delivery concurrency limits
- template rendering under burst load

### API

- policy evaluation round-trips to OPA
- auth-heavy request paths
- large decision detail payloads with versions/comments/links combined

---

# 7. Throughput Estimates

These estimates are directional, not benchmark-certified.

## 7.1 API Throughput

On a modest production instance:

- **20–50 requests/sec sustained** should be realistic
- burst tolerance above that depends on DB and OPA latency

This is sufficient for:

- enterprise internal tooling
- governance workflows
- admin-heavy B2B traffic patterns

## 7.2 Notification Throughput

With the current worker model:

- **tens of notifications/sec** should be achievable
- higher burst fan-out is possible but would require:
  - more worker concurrency
  - more explicit Kafka partitioning strategy
  - stronger delivery batching and queue visibility

## 7.3 Inbox Throughput

In-app notifications are DB-backed and should scale comfortably for current expected volume.

The main performance concern is:

- unread count hot paths
- inbox pagination over growing datasets

This is why `user_id + read_at` and `user_id + created_at` indexes matter.

---

# 8. Capacity Thresholds and Alerts

## 8.1 API Latency Alerts

Trigger warning when:

- p95 read latency > 400ms for 10 minutes
- p95 write latency > 700ms for 10 minutes

Trigger critical when:

- p95 read latency > 800ms for 5 minutes
- p95 write latency > 1200ms for 5 minutes

## 8.2 API Error Rate Alerts

Trigger warning when:

- 5xx rate > 1% for 5 minutes

Trigger critical when:

- 5xx rate > 3% for 5 minutes

## 8.3 Notification Backlog Alerts

Trigger warning when:

- pending notification jobs > 200
- oldest pending job age > 5 minutes

Trigger critical when:

- pending notification jobs > 1000
- oldest pending job age > 30 minutes

## 8.4 DLQ Alerts

Trigger warning when:

- DLQ count increases by > 10 in 15 minutes

Trigger critical when:

- DLQ count increases by > 50 in 15 minutes
- or any single notification type shows repeated clustered failure

## 8.5 Publisher / Outbox Alerts

Trigger warning when:

- unpublished outbox rows > 100
- oldest unpublished outbox row age > 2 minutes

Trigger critical when:

- unpublished outbox rows > 1000
- oldest unpublished outbox row age > 15 minutes

## 8.6 Policy Engine Alerts

Trigger warning when:

- OPA dependency failures > 0.5% for 10 minutes

Trigger critical when:

- OPA dependency failures > 2% for 5 minutes

---

# 9. Scalability Evolution Path

## 9.1 Near-Term Hardening

Recommended next steps:

- pagination everywhere
- background cleanup / archival strategy
- worker concurrency controls
- dashboarding for queue age and DLQ growth
- per-route latency dashboards
- more granular metrics per worker type

## 9.2 Mid-Term Scaling

When usage grows:

- horizontally scale API instances
- run multiple worker replicas with consumer groups
- separate publisher/orchestrator/delivery processes explicitly
- optimize unread count caching
- add DB partitioning or archival for audit/outbox/notification tables

## 9.3 Long-Term Scaling

If FlowDesk becomes high-scale multi-tenant SaaS:

- move toward stronger queue visibility metrics
- formalize partition keys and consumer concurrency guarantees
- isolate analytical reads from OLTP writes
- introduce read replicas
- add stronger benchmarking and load-test baselines

---

# 10. Load-Sensitive Workflows

The following workflows are most sensitive to scale pressure:

## 10.1 Decision Detail View

Because it may aggregate:

- decision
- versions
- comments
- links
- policy checks

Risk:

- large payload growth over time

## 10.2 Notification Fan-Out

A single decision approval may create multiple notifications across:

- many users
- multiple channels
- deferred delivery schedules

Risk:

- burst job creation
- delivery backlog

## 10.3 Unread Count

This appears trivial but is high-frequency and user-visible.

Risk:

- many repeated count queries
- DB hot path under multi-user concurrency

Future optimization:

- cached unread counts with event-based invalidation

---

# 11. Monitoring Recommendations

At minimum, dashboards should include:

## API

- request volume
- 5xx rate
- p50 / p95 / p99 latency
- route-level latency

## Notifications

- outbox unpublished count
- notification jobs pending
- oldest pending age
- successful deliveries
- retries per minute
- DLQ growth rate

## Policy

- evaluation volume
- dependency error rate
- deny ratio
- latency per evaluation

## Inbox

- unread count query latency
- inbox fetch latency
- in-app creation lag

---

# 12. Explicit Non-Claims

FlowDesk does **not** currently claim:

- benchmark-certified throughput
- guaranteed multi-region failover
- formally proven queue latency under extreme load
- zero-DLQ operation
- hard real-time notification delivery

All scale numbers in this document are architectural estimates based on the current implementation model.

They are meant to define:

- expectations
- operational thresholds
- engineering direction

not to overstate performance.

---

# 13. Summary

FlowDesk is designed to provide:

- **99.9% monthly core API availability**
- **sub-second p95 user-facing latency under normal load**
- **durable asynchronous notification processing**
- **bounded retries with visible failure states**
- **operator-controlled recovery through DLQ workflows**
- **practical early-stage B2B scalability**

It is intentionally optimized for:

- clarity
- governance
- auditability
- reliability under real operational conditions

rather than raw unbounded throughput.
