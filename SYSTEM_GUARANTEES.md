# System Guarantees — FlowDesk

## Purpose

This document defines the operational and consistency guarantees of FlowDesk.

It exists to make system behavior explicit under:

- normal operation
- retries
- duplicates
- partial failures
- downstream outages
- asynchronous delivery

This is especially important for:

- decision lifecycle integrity
- auditability
- notification delivery
- policy enforcement
- operator expectations

---

# 1. System Model

FlowDesk combines:

- synchronous request/response flows
- asynchronous event-driven processing
- immutable audit logging
- policy-based authorization
- background notification orchestration and delivery

The platform is intentionally designed as a modular monolith with asynchronous workers.

This means:

- strong consistency is preferred inside the primary database transaction boundary
- eventual consistency is accepted for background processing and notifications

---

# 2. Consistency Guarantees

## 2.1 Primary write model

For core domain writes (e.g. decision creation, approval, comment creation):

- the system guarantees **transactional persistence in PostgreSQL**
- if the transaction commits, the state change is durable
- if the transaction fails, no partial domain write is considered successful

## 2.2 Audit consistency

Audit events are written as part of application-controlled flows.

FlowDesk guarantees:

- critical domain actions produce audit records
- audit records are append-only
- audit records are never updated in place for semantic changes

If a request fails before the audit write occurs, the request is considered failed.

## 2.3 Notification consistency

Notification dispatch is **eventually consistent**.

FlowDesk does **not** guarantee that email or in-app delivery completes in the same request that triggered the originating domain action.

Instead, it guarantees:

- the originating domain action can succeed independently
- the corresponding event is persisted to the outbox
- background workers will attempt downstream delivery asynchronously

This avoids coupling core business writes to external systems such as SMTP or Kafka availability.

---

# 3. Delivery Guarantees

## 3.1 Outbox guarantee

When a domain action emits a notification-worthy event, FlowDesk guarantees:

- the event is written to `outbox_events`
- event publication is decoupled from request processing
- unpublished events remain durable until publisher processing succeeds

This means:

- no successful domain action should lose its corresponding event due to immediate downstream transport failure
- if Kafka or the publisher is temporarily unavailable, outbox rows remain available for later publication

## 3.2 Publisher guarantee

The outbox publisher provides **at-least-once publication** to Kafka.

This means:

- an event may be published more than once in failure scenarios
- consumers must be designed to tolerate duplicates

FlowDesk explicitly embraces this model and relies on idempotency at consumer and delivery boundaries.

## 3.3 Notification orchestration guarantee

The orchestrator provides **at-least-once job creation semantics**.

This means:

- a domain event may be observed more than once
- orchestration may attempt to create equivalent notification work more than once
- downstream delivery must remain idempotent

## 3.4 Email delivery guarantee

Email delivery is **at-least-once attempted**, but **effectively once per idempotency boundary**.

This is achieved through:

- deterministic idempotency keys
- uniqueness enforced in `notification_deliveries`
- retry state tracked in `notification_jobs`

Practical meaning:

- the system may retry the same notification multiple times internally
- users should not receive duplicate terminal email deliveries for the same notification/channel pair under normal operation

---

# 4. Retry Model

## 4.1 Philosophy

Retries are deterministic, bounded, and stateful.

FlowDesk does not rely on unbounded “best effort” retry loops.

Every retryable notification job stores:

- current attempt count
- max attempts
- next attempt timestamp
- last error
- terminal state (`done` or `dlq`)

## 4.2 Backoff schedule

Email delivery uses deterministic backoff:

- attempt 1 → 10s
- attempt 2 → 30s
- attempt 3 → 2m
- attempt 4 → 10m
- attempt 5 → 30m

This schedule is intentionally simple, inspectable, and reproducible.

## 4.3 Retry termination

A job stops retrying when:

- delivery succeeds → `done`
- max attempts reached → `dlq`

This prevents silent infinite retries and makes operational recovery explicit.

## 4.4 Reprocessing model

DLQ items are not automatically reprocessed.

They require:

- operator inspection
- root cause understanding
- explicit requeue action

This protects the system from repeated failure loops and preserves operator control.

---

# 5. Idempotency Guarantees

## 5.1 Why idempotency is required

Because FlowDesk uses:

- outbox publication
- Kafka consumption
- async workers
- retries

the platform assumes duplicates are possible.

Idempotency is therefore a design requirement, not an optimization.

## 5.2 Delivery idempotency boundary

The primary idempotency boundary for email delivery is:

`notificationId + channel`

This boundary is hashed into a deterministic `idempotency_key`.

FlowDesk guarantees:

- only one terminal `notification_deliveries` row may exist for a given idempotency key
- duplicate processing attempts resolve into the same logical delivery outcome

## 5.3 Refresh token rotation idempotency

Refresh token rotation is protected through:

- row locking
- replaced-by semantics
- revoked state tracking

This guarantees:

- a refresh token cannot be validly rotated twice
- replay of an already-used refresh token is rejected deterministically

## 5.4 Domain write idempotency

Core domain writes are primarily request-scoped and transactional.

Future hardening may introduce client-provided idempotency keys for:

- decision creation
- initiative creation
- comment submission

At the current stage, idempotency is strongest in async delivery and auth token rotation boundaries.

---

# 6. Ordering Guarantees

## 6.1 Domain event ordering

FlowDesk does not currently guarantee global ordering across all events.

It only aims for practical ordering within the processing model:

- outbox rows are read oldest-first
- Kafka messages use aggregate-related keys where appropriate

However, the system assumes:

- consumers may observe duplicates
- consumers may observe retries after later events have already been processed

## 6.2 Notification ordering

FlowDesk does not guarantee that all user-facing notifications are delivered in strict chronological order.

Reasons:

- retries
- quiet hours deferral
- asynchronous channel scheduling
- downstream provider behavior

This is acceptable because notifications are informational, not source-of-truth state.

The source of truth remains the primary database.

---

# 7. Quiet Hours and Preference Guarantees

FlowDesk guarantees that user preferences and quiet hours are evaluated during orchestration.

This means:

- delivery eligibility is decided before channel execution
- notifications may be deferred rather than dropped
- email-disabled users do not receive email jobs for those events

Important:

- quiet hours affect delivery timing
- they do not change the persisted domain event or notification record

So the system preserves traceability even when delivery is deferred.

---

# 8. Failure Modes and Expected Behavior

## 8.1 API succeeds, Kafka is temporarily unavailable

Expected behavior:

- domain write succeeds
- outbox row is persisted
- publisher retries later
- eventual publication resumes when Kafka recovers

Guarantee:

- no domain/event coupling loss at request time

## 8.2 Kafka publishes duplicate messages

Expected behavior:

- orchestrator may process duplicates
- delivery layer must prevent duplicate terminal sends through idempotency

Guarantee:

- duplicate transport does not imply duplicate user-visible delivery

## 8.3 SMTP unavailable

Expected behavior:

- delivery attempts fail
- retry schedule is applied
- after max attempts, job moves to DLQ

Guarantee:

- failure is durable and inspectable
- no silent drop

## 8.4 Worker crashes mid-processing

Expected behavior:

- unfinished work remains represented in DB state
- job status can be retried/recovered based on persisted job state
- duplicate retry attempts remain safe due to idempotency

## 8.5 OPA unavailable

Expected behavior:

- authorization checks fail closed
- protected actions return dependency/authorization failure rather than bypass policy

Guarantee:

- no permissive fallback on policy outage

## 8.6 DB unavailable

Expected behavior:

- core writes fail
- no request is considered successful without DB durability

Guarantee:

- no false-positive success

---

# 9. Explicit Non-Guarantees

FlowDesk does **not** currently guarantee:

- exactly-once global event processing
- globally ordered event delivery
- exactly-once email transport at the provider level
- multi-region consensus or failover semantics
- cross-service distributed transactions
- automatic DLQ replay without operator approval

These are intentional non-goals for the current system stage.

---

# 10. Operational Guarantees

FlowDesk provides operators with:

- health endpoints
- readiness endpoints
- metrics endpoints
- audit records
- DLQ visibility
- explicit reprocess controls
- correlation identifiers across flows

This means most failures should be:

- detectable
- diagnosable
- recoverable without guesswork

---

# 11. Security Guarantees

FlowDesk guarantees:

- authenticated routes require valid access tokens
- authorization is policy-driven
- policy failures do not fail open
- critical actions are auditable
- refresh token replay is rejected after valid rotation

FlowDesk does not yet guarantee:

- full session revocation across all devices
- hardware-backed key management
- formal tamper-evident audit chain
- end-to-end cryptographic event signing

These are future hardening opportunities.

---

# 12. Summary

FlowDesk is designed around the following practical guarantees:

- **strong transactional guarantees for core domain writes**
- **append-only auditability for critical actions**
- **eventual consistency for notifications**
- **at-least-once publication and orchestration**
- **idempotent terminal delivery boundaries**
- **bounded deterministic retry with DLQ**
- **fail-closed authorization behavior**
- **operator-visible recovery paths**

This makes the platform operationally reliable without overclaiming guarantees the system does not actually provide.
