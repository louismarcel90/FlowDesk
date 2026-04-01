# 🧠 FlowDesk — Data Flow

---

## 1. Purpose

This document describes how **data flows through FlowDesk**, from user actions to system state and back to the UI.

It answers:

- how data moves across components
- how events propagate
- how state is built and read

---

## 2. Core Principle

FlowDesk follows:

```text
Write → Event → Store → Project → Read
```

---

## 3. High-Level Flow

```text
User Action
   ↓
API Gateway
   ↓
Command Handler
   ↓
Domain Validation
   ↓
Event Emission
   ↓
Event Store
   ↓
Projection
   ↓
Read Model
   ↓
Frontend
```

---

## 4. Write Flow (Command Path)

---

### Example: Create Decision

```text
User → API → Command Handler → Domain Engine → Event
```

---

### Steps

1. user submits request
2. API validates shape
3. command handler orchestrates
4. domain engine validates rules
5. event is created
6. event is persisted

---

### Important Property

👉 No direct database mutation

---

## 5. Event Flow (Core)

---

```text
Event → Stored → Published → Consumed
```

---

### Characteristics

- append-only
- ordered per aggregate
- versioned

---

### Example Events

- DecisionCreated
- DecisionApproved
- MetricLinked

---

## 6. Projection Flow (Read Path)

---

```text
Event → Projection Handler → Read Model
```

---

### Responsibilities

- transform events
- build UI-ready state
- denormalize data

---

### Example Projections

- decision detail view
- decision timeline
- governance dashboard

---

## 7. Read Flow (Query Path)

---

```text
Frontend → API → Read Model → Response
```

---

### Important Property

👉 Read models are optimized, not canonical

---

## 8. Real-Time Flow

---

```text
Event → WebSocket / SSE → Frontend Update
```

---

### Handles

- live updates
- timeline changes
- metric changes

---

## 9. External Data Flow

---

### Metrics Ingestion

```text
External Systems → Metrics Service → Event / Storage
```

---

### Event Ingestion

```text
External Events → Event Pipeline → FlowDesk Context
```

---

## 10. Consistency Model

FlowDesk uses:

👉 **Eventual Consistency**

---

### Implications

- write is immediate
- read may lag

---

### Example

- decision approved
- UI updates slightly later

---

## 11. Failure Handling

---

### 11.1 Projection Lag

- UI stale
- resolved via retry

---

### 11.2 Event Loss Risk

- mitigated via durable store
- retry mechanisms

---

### 11.3 Partial Updates

- handled via idempotent projections

---

## 12. Idempotency

All operations must be:

👉 idempotent

---

### Why

- retries
- network failures
- duplicate events

---

## 13. Ordering Guarantees

---

### Per Decision

- strict ordering

---

### Global

- eventual ordering

---

## 14. Staff-Level Insight

FlowDesk does NOT store:

```text
Current Truth
```

It stores:

```text
History of Truth Changes
```

---

## 15. Summary

FlowDesk data flow is:

```text
Command → Event → Store → Project → Query
```

This ensures:

- traceability
- replayability
- scalability
- explainability

---
