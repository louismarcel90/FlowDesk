# 🧠 ADR 004 — Runtime Boundaries (Services vs Modular Monolith)

---

## Status

Accepted

---

## Context

FlowDesk includes multiple domains:

- Decision
- Initiative
- Metrics
- Audit
- Governance

We must decide:

```text
Should these domains run as independent services or as a single deployable unit?
```

---

## Decision

We adopt a **modular monolith architecture with clear domain boundaries**, with the ability to evolve toward microservices if needed.

---

## Selected Model

```text
One deployable application
Multiple well-defined modules (domains)
Strict internal boundaries
```

---

## Why This Model

FlowDesk requires:

- strong domain consistency (Decision ↔ Initiative ↔ Metrics)
- fast iteration
- low operational overhead

A modular monolith provides:

- clear separation of concerns
- simpler deployment
- easier debugging
- strong internal consistency

---

## Alternatives Considered

---

### Option 1 — Microservices (Fully Distributed)

---

**Pros:**

- independent scaling
- strong isolation
- team autonomy

---

**Cons:**

- network complexity
- distributed failures
- higher latency
- heavy operational cost
- premature for early-stage system

---

**Conclusion:**

❌ Rejected for now — too complex too early

---

### Option 2 — Monolith (Unstructured)

---

**Pros:**

- simple
- fast to start

---

**Cons:**

- no boundaries
- high coupling
- hard to scale teams
- technical debt risk

---

**Conclusion:**

❌ Rejected — not acceptable at Staff level

---

### Option 3 — Modular Monolith (Chosen)

---

**Pros:**

- strong domain separation
- no network overhead
- easier evolution
- testable boundaries

---

**Cons:**

- requires discipline
- boundaries can erode over time

---

**Conclusion:**

✅ Selected

---

## Boundary Definition

Each domain is implemented as a module:

```text
modules/
  decision/
  initiative/
  metrics/
  audit/
  governance/
```

---

## Rules

---

### 1. No Direct Cross-Domain Access

- modules communicate via:
  - interfaces
  - events

---

### 2. Domain Ownership

- each module owns:
  - its models
  - its logic
  - its invariants

---

### 3. Internal APIs

- modules expose explicit APIs
- no shared mutable state

---

## Evolution Strategy

FlowDesk can evolve to microservices when:

- team size grows
- scaling requirements increase
- domain independence becomes critical

---

## Staff-Level Insight

Premature microservices create:

```text
Distributed complexity without distributed value
```

A modular monolith allows:

```text
Local simplicity with future optional distribution
```

---

## Final Decision

```text
We choose a modular monolith to maximize development speed, maintain strong domain integrity, and delay distribution complexity until it is justified.
```

---

## Related Documents

- `002-event-driven-vs-sync-communication.md`
- `c4-container.md`

---
