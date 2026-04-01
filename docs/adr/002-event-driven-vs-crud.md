# 🧠 ADR 002 — Communication Model (Event-Driven vs Synchronous APIs)

---

## Status

Accepted

---

## Context

FlowDesk is a **Decision Intelligence System** built around:

- decision lifecycle
- event sourcing
- explainability
- auditability

The system must support:

- user-driven actions (create / approve decisions)
- propagation of state changes across services
- real-time UI updates
- integration with external systems (metrics, events)

---

A key architectural question:

```text id="l3q9q2"
How should components communicate?
```

---

## Decision

We adopt a **hybrid communication model**:

---

### 1. Synchronous APIs (HTTP / GraphQL)

Used for:

- user requests
- command execution
- immediate queries

---

### 2. Event-Driven Communication (Async)

Used for:

- state propagation
- projections
- notifications
- audit pipelines

---

```text id="c2r0zt"
Command → Sync (API)
State Change → Async (Events)
```

---

## Architecture Overview

```text id="v1w0cl"
Frontend
   ↓ (HTTP)
API Gateway
   ↓
Command Handler
   ↓
Event Emitted
   ↓ (Async)
Event Store / Bus
   ↓
Projection / Notification / Audit
```

---

## Alternatives Considered

---

### Option 1 — Fully Synchronous (REST-only)

---

**Description:**

- services call each other directly via HTTP
- no event bus

---

**Pros:**

- simple
- easy debugging
- immediate consistency

---

**Cons:**

- tight coupling
- cascading failures
- poor scalability
- no natural history propagation
- hard to extend

---

**Conclusion:**

❌ Rejected — not suitable for distributed, evolving systems

---

### Option 2 — Fully Event-Driven (Async-only)

---

**Description:**

- all communication via events
- no direct service calls

---

**Pros:**

- decoupled
- scalable
- extensible

---

**Cons:**

- complex debugging
- no immediate response
- poor UX for user actions
- harder error handling

---

**Conclusion:**

❌ Rejected — poor fit for user-driven interactions

---

### Option 3 — Hybrid Model (Chosen)

---

**Description:**

- synchronous for commands
- asynchronous for propagation

---

**Pros:**

- clear separation of concerns
- responsive UX
- decoupled services
- scalable architecture
- aligns with event sourcing

---

**Cons:**

- dual mental model
- requires careful consistency handling

---

**Conclusion:**

✅ Selected — best trade-off for FlowDesk

---

## Communication Patterns

---

### 1. Command Flow (Synchronous)

```text id="f4dp4m"
Frontend → API → Command Handler → Response
```

Used for:

- create decision
- approve decision
- query data

---

### 2. Event Flow (Asynchronous)

```text id="8a2kdf"
Event → Event Bus → Consumers
```

Used for:

- updating projections
- triggering notifications
- writing audit records

---

### 3. Real-Time Updates

```text id="1i63fq"
Event → WebSocket / SSE → Frontend
```

---

## Key Design Principles

---

### 1. Commands vs Events Separation

- commands = intent
- events = facts

---

```text id="y3uxxt"
Command: "ApproveDecision"
Event:   "DecisionApproved"
```

---

### 2. No Business Logic in Event Consumers

- consumers react
- they do not decide

---

### 3. Idempotent Consumers

- events may be replayed
- handlers must be safe

---

### 4. Event Ordering (Per Aggregate)

- strict ordering per decision
- eventual ordering globally

---

## Consequences

---

### Positive

---

#### 1. Decoupling

- services evolve independently

---

#### 2. Scalability

- async workloads scale separately

---

#### 3. Extensibility

- new consumers can be added easily

---

#### 4. Natural Fit with Event Sourcing

- events are first-class

---

---

### Negative

---

#### 1. Eventual Consistency

- UI may lag behind writes

---

#### 2. Debugging Complexity

- harder than direct calls

---

#### 3. Dual Paradigm

- developers must understand both sync and async

---

## Mitigations

---

### Consistency

- clear UX messaging
- projection lag monitoring

---

### Debugging

- correlation IDs
- tracing (OpenTelemetry)

---

### Reliability

- retry mechanisms
- dead-letter queues

---

## Failure Modes

---

### 1. Event Not Processed

- projection not updated

Mitigation:

- retries
- DLQ

---

### 2. Duplicate Event

- double processing

Mitigation:

- idempotent handlers

---

### 3. Out-of-Order Events

- inconsistent state

Mitigation:

- version checks
- sequence numbers

---

## Operational Considerations

---

### Observability

- event lag metrics
- processing latency

---

### Monitoring

- failed consumers
- queue depth

---

### Replay

- events can be replayed to rebuild state

---

## Staff-Level Insight

Synchronous systems optimize for:

```text id="3h1rx2"
Control
```

Event-driven systems optimize for:

```text id="q4s8ht"
Evolution
```

FlowDesk needs both.

---

## Final Decision

```text id="1w0f3c"
We adopt a hybrid model:
Sync for intent (commands)
Async for truth propagation (events)
```

---

## Related Documents

- `001-main-storage-decision.md`
- `data-flow.md`
- `decision-lifecycle.md`

---
