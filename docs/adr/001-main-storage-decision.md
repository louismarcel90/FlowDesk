# 🧠 ADR 001 — Main Storage Strategy (Event Sourcing vs CRUD)

---

## Status

Accepted

---

## Context

FlowDesk is a **Decision Intelligence System**.

Its core requirements include:

- full decision lifecycle tracking
- explainability (why decisions exist)
- auditability (who did what and when)
- traceability over time
- ability to reconstruct past states

---

Traditional CRUD-based systems store only the **current state**:

```text
UPDATE decision SET status = 'approved'
```

This approach loses:

- history
- causality
- reasoning
- intermediate states

---

FlowDesk requires:

```text
State → Traceable → Explainable → Replayable
```

---

## Decision

We adopt an **event sourcing model** with:

- append-only event store
- projections for read models
- aggregate reconstruction from events

---

## Architecture Overview

```text
Command → Domain Validation → Event → Event Store → Projection → Read Model
```

---

## Alternatives Considered

---

### Option 1 — CRUD (Relational DB)

---

**Description:**

- store current state in tables
- update rows directly

---

**Pros:**

- simple
- well-known
- easy to query

---

**Cons:**

- no history
- no causality
- weak audit
- cannot replay decisions
- difficult explainability

---

**Conclusion:**

❌ Rejected — incompatible with FlowDesk core requirements

---

### Option 2 — CRUD + Audit Logs

---

**Description:**

- store current state
- log changes separately

---

**Pros:**

- simple extension of CRUD
- partial history

---

**Cons:**

- audit not first-class
- duplication between state and logs
- risk of inconsistency
- difficult to reconstruct full state
- explainability remains weak

---

**Conclusion:**

❌ Rejected — insufficient for governance-level traceability

---

### Option 3 — Event Sourcing (Chosen)

---

**Description:**

- store all changes as events
- rebuild state from event stream
- maintain projections for fast reads

---

**Pros:**

- full history
- complete traceability
- replayability
- natural auditability
- supports explainability
- aligns with decision lifecycle

---

**Cons:**

- increased complexity
- requires projection management
- eventual consistency
- harder debugging for newcomers

---

**Conclusion:**

✅ Selected — aligns with product and system requirements

---

## Decision Details

---

### Event Store

- append-only
- versioned events
- ordered per aggregate

---

### Aggregates

- reconstructed from events
- enforce domain invariants

---

### Projections

- denormalized read models
- optimized for UI queries

---

### Write Path

```text
Command → Validate → Event → Store
```

---

### Read Path

```text
Query → Read Model → Response
```

---

## Consequences

---

### Positive

---

#### 1. Full Traceability

- every decision is reconstructable

---

#### 2. Explainability by Design

- rationale attached to events

---

#### 3. Strong Auditability

- event history = source of truth

---

#### 4. Temporal Modeling

- system naturally models time

---

---

### Negative

---

#### 1. Increased Complexity

- requires understanding of:
  - events
  - projections
  - aggregates

---

#### 2. Eventual Consistency

- read models may lag

---

#### 3. Migration Complexity

- schema evolution must be handled carefully

---

## Mitigations

---

### Complexity

- strong documentation
- clear module boundaries

---

### Eventual Consistency

- projection lag monitoring
- UI messaging

---

### Event Evolution

- versioned event schemas
- backward compatibility

---

## Operational Considerations

---

### Replay

- system can rebuild state from events

---

### Debugging

- inspect event stream
- reconstruct decision timeline

---

### Data Recovery

- event store is source of truth
- projections can be rebuilt

---

## Staff-Level Insight

CRUD systems answer:

```text
"What is the current state?"
```

Event-sourced systems answer:

```text
"How did we get here?"
```

FlowDesk requires the second.

---

## Final Decision

```text
We choose event sourcing because FlowDesk is a system of decisions, not a system of records.
```

---

## Related Documents

- `decision-lifecycle.md`
- `decision-explainability.md`
- `decision-audit.md`
- `event-model.md`

---
