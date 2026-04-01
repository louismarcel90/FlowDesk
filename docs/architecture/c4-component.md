# 🧠 FlowDesk — C4 Model — Level 3 (Component Diagram)

---

## 1. Purpose

This document describes the **internal component structure of the FlowDesk Decision Service**.

It answers:

- where business logic lives
- how commands are validated
- how events are produced
- how read models are updated

---

## 2. Why Focus on the Decision Service

In FlowDesk, the **Decision Service** is the core of the system.

It is responsible for:

- creating decisions
- changing decision state
- linking decisions to initiatives and metrics
- preserving explainability
- emitting an auditable history

This is not a CRUD module.

It is a **governance engine for decision lifecycle management**.

---

## 3. Component Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                     Decision Service                        │
│                                                             │
│  ┌──────────────────┐      ┌─────────────────────────────┐  │
│  │ API Controller   │─────▶│ Command Handlers            │  │
│  │ / Resolver       │      │ - CreateDecision            │  │
│  │                  │      │ - UpdateDecision            │  │
│  └──────────────────┘      │ - ApproveDecision           │  │
│                            │ - LinkMetric                │  │
│                            └──────────────┬──────────────┘  │
│                                           │                 │
│                                           ▼                 │
│                            ┌─────────────────────────────┐  │
│                            │ Validation / Policy Engine  │  │
│                            │ - lifecycle rules           │  │
│                            │ - required justification    │  │
│                            │ - ownership checks          │  │
│                            │ - integrity constraints     │  │
│                            └──────────────┬──────────────┘  │
│                                           │                 │
│                                           ▼                 │
│                            ┌─────────────────────────────┐  │
│                            │ Decision Aggregate          │  │
│                            │ - current state            │  │
│                            │ - transitions              │  │
│                            │ - domain invariants        │  │
│                            └──────────────┬──────────────┘  │
│                                           │                 │
│                                           ▼                 │
│                            ┌─────────────────────────────┐  │
│                            │ Event Builder / Factory     │  │
│                            │ - DecisionCreated           │  │
│                            │ - DecisionUpdated           │  │
│                            │ - DecisionApproved          │  │
│                            │ - MetricLinked             │  │
│                            └──────────────┬──────────────┘  │
│                                           │                 │
│                                           ▼                 │
│                            ┌─────────────────────────────┐  │
│                            │ Event Repository            │  │
│                            │ / Event Store Adapter       │  │
│                            └──────────────┬──────────────┘  │
│                                           │                 │
│                         ┌─────────────────┴────────────────┐ │
│                         ▼                                  ▼ │
│              ┌──────────────────────┐         ┌──────────────────────┐
│              │ Projection Handlers  │         │ Audit / Trace Writer │
│              │ - detail view        │         │ - evidence trail     │
│              │ - timeline view      │         │ - who/when/why       │
│              │ - impact summary     │         └──────────────────────┘
│              └──────────────────────┘                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Component Responsibilities

---

### 4.1 API Controller / Resolver

**Responsibilities:**

- receive HTTP / GraphQL requests
- validate request shape
- authenticate caller context
- dispatch commands

**Important:**

- no business logic
- no persistence logic

This is only the **entry boundary**.

---

### 4.2 Command Handlers

**Responsibilities:**

- orchestrate a use case
- load current aggregate state
- invoke validation
- apply domain behavior
- emit resulting events

**Examples:**

- `CreateDecisionHandler`
- `UpdateDecisionHandler`
- `ApproveDecisionHandler`
- `ArchiveDecisionHandler`
- `LinkDecisionToMetricHandler`

These handlers implement **application flow**, not domain rules.

---

### 4.3 Validation / Policy Engine

**Responsibilities:**

- verify allowed transitions
- check required justification
- enforce ownership or reviewer constraints
- reject structurally valid but governance-invalid actions

**Examples of rules:**

- a decision cannot move from `draft` directly to `archived`
- an approval requires a non-empty rationale
- a metric link must reference an existing metric
- a deprecated decision cannot be edited without versioning

This is one of the most important components in FlowDesk.

It protects the system from becoming:

```text
Valid JSON, invalid governance
```

---

### 4.4 Decision Aggregate

**Responsibilities:**

- represent the authoritative domain state of one decision
- apply domain events
- enforce invariants
- compute next valid transitions

**Contains:**

- decision identity
- title / description
- status
- owner
- rationale
- linked initiatives
- linked metrics
- version metadata

This is the **domain core**.

---

### 4.5 Event Builder / Factory

**Responsibilities:**

- create strongly typed domain events
- standardize metadata
- attach actor / timestamp / reason / correlation id

**Why it matters:**
Without a dedicated event factory, teams often emit inconsistent events.

That breaks:

- auditability
- replayability
- observability

---

### 4.6 Event Repository / Event Store Adapter

**Responsibilities:**

- persist append-only events
- load decision history
- rebuild aggregate state from event stream
- enforce optimistic concurrency

**Important properties:**

- append-only writes
- version-aware persistence
- deterministic rehydration

---

### 4.7 Projection Handlers

**Responsibilities:**

- build read models from emitted events
- update:
  - decision detail views
  - decision timeline views
  - governance dashboards
  - impact summaries

These handlers power the UI.

They exist so the frontend never reconstructs meaning from raw events.

---

### 4.8 Audit / Trace Writer

**Responsibilities:**

- persist evidence trail
- record:
  - actor
  - action
  - reason
  - affected entity
  - correlation metadata

This component exists because audit is not a side effect.

In FlowDesk, audit is a **product capability**.

---

## 5. Request Lifecycle Example

### Example: Approve a decision

```text
User clicks "Approve"
      ↓
API Controller receives request
      ↓
ApproveDecisionHandler invoked
      ↓
Current decision stream loaded
      ↓
Aggregate rebuilt
      ↓
Validation engine checks:
  - state transition allowed?
  - reviewer authorized?
  - rationale present?
      ↓
DecisionAggregate applies approval
      ↓
DecisionApproved event created
      ↓
Event stored append-only
      ↓
Projection handlers update timeline + summary
      ↓
Audit writer records approval evidence
      ↓
Frontend reads updated projection
```

---

## 6. Internal Separation of Concerns

FlowDesk separates four things clearly:

### 6.1 Transport Layer

- controllers
- resolvers
- DTO parsing

### 6.2 Application Layer

- command handlers
- use case orchestration

### 6.3 Domain Layer

- aggregate
- invariants
- transitions
- policies

### 6.4 Infrastructure Layer

- event store adapter
- projection persistence
- audit persistence

This separation is what keeps the system scalable for:

- codebase growth
- multi-team ownership
- future product expansion

---

## 7. Why This Is Better Than CRUD

A CRUD design would do:

```text
request → update row → return response
```

That fails for FlowDesk because it loses:

- causality
- transition semantics
- historical intent
- explainability
- audit trail fidelity

FlowDesk instead does:

```text
request → validate governance → apply aggregate rule
       → emit domain event → project read model → preserve evidence
```

That is the correct shape for a decision intelligence system.

---

## 8. Failure Modes at Component Level

### 8.1 Command accepted but projection delayed

Result:

- write is successful
- UI appears stale temporarily

Mitigation:

- projection lag metrics
- projection retry logic
- eventual consistency messaging in UI

---

### 8.2 Invalid transition bypass attempt

Result:

- structurally valid request
- domain-invalid action

Mitigation:

- central validation engine
- aggregate invariant checks
- no direct repository mutation

---

### 8.3 Event schema drift

Result:

- projections break
- replay becomes unreliable

Mitigation:

- versioned event contracts
- event schema tests
- backward compatibility rules

---

### 8.4 Duplicate command submission

Result:

- accidental repeated action

Mitigation:

- idempotency keys
- command deduplication
- optimistic concurrency version checks

---

## 9. Staff-Level Design Insights

### 9.1 Intelligence belongs in the domain, not the UI

The frontend may visualize decisions, but it must never decide whether a transition is valid.

---

### 9.2 Audit is not logging

Logs are for operators.
Audit is for governance and evidence.

These are different concerns and must be modeled separately.

---

### 9.3 Read models are disposable, event history is not

If a projection becomes corrupted, it can be rebuilt.

The append-only event history remains the source of truth.

---

### 9.4 Decision lifecycle is the product

The value of FlowDesk is not “saving records”.

The value is preserving:

- why a decision existed
- how it changed
- what it influenced
- whether it remained justified over time

---

## 10. Suggested Component Boundaries in Code

```text
apps/api/src/modules/decision/
  controllers/
    decision.controller.ts
  application/
    commands/
      create-decision.command.ts
      update-decision.command.ts
      approve-decision.command.ts
    handlers/
      create-decision.handler.ts
      update-decision.handler.ts
      approve-decision.handler.ts
  domain/
    aggregates/
      decision.aggregate.ts
    events/
      decision-created.event.ts
      decision-updated.event.ts
      decision-approved.event.ts
    policies/
      decision-lifecycle.policy.ts
      decision-ownership.policy.ts
    value-objects/
      decision-status.vo.ts
      decision-rationale.vo.ts
  infrastructure/
    repositories/
      event-store.repository.ts
      decision-projection.repository.ts
    projections/
      decision-detail.projector.ts
      decision-timeline.projector.ts
    audit/
      decision-audit.writer.ts
```

---

## 11. Summary

The FlowDesk Decision Service is built around this model:

```text
Controller
  → Command Handler
    → Validation / Policy Engine
      → Decision Aggregate
        → Domain Event
          → Event Store
            → Projection + Audit
```

This gives FlowDesk:

- deterministic behavior
- strong governance integrity
- explainable lifecycle
- replayable history
- scalable architecture

---

## 12. Next Related Documents

- `domain-model.md`
- `decision-lifecycle.md`
- `001-main-storage-decision.md`
- `decision-explainability.md`

---
