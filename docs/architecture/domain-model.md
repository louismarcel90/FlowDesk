# 🧠 FlowDesk — Domain Model

---

## 1. Purpose

This document defines the **core domain entities, relationships, and invariants** of FlowDesk.

It answers:

- what are the main business objects?
- how are they connected?
- what rules govern them?

---

## 2. Core Philosophy

FlowDesk models **governance, not data**.

```text
Data → Decisions → Outcomes → Understanding
```

The domain is centered around:

👉 **Decision as the primary entity**

---

## 3. Domain Entities

---

### 3.1 Decision (Aggregate Root)

Represents a **governed choice** made within the system.

---

**Attributes:**

- id
- title
- description
- status (draft, proposed, approved, etc.)
- owner_id
- rationale
- version
- created_at
- updated_at

---

**Relationships:**

- linked to → Initiatives
- linked to → Metrics
- supersedes → Decision
- superseded_by → Decision

---

**Invariants:**

- must always have an owner (after draft)
- must have rationale before approval
- cannot skip lifecycle states
- cannot be modified after archival

---

### 3.2 Initiative

Represents **execution of a decision**.

---

**Attributes:**

- id
- name
- status
- start_date
- end_date

---

**Relationships:**

- belongs to → Decision
- affects → Metrics

---

**Invariants:**

- must be linked to at least one decision
- cannot be active without an approved decision

---

### 3.3 Metric

Represents **observable system state**.

---

**Attributes:**

- id
- name
- value
- timestamp
- source

---

**Relationships:**

- linked to → Decision
- influenced by → Initiative

---

**Invariants:**

- must have a source
- must be time-series consistent

---

### 3.4 Decision Event

Represents a **change in decision lifecycle**.

---

**Attributes:**

- event_id
- decision_id
- event_type
- actor_id
- timestamp
- payload
- rationale

---

**Invariants:**

- immutable
- append-only
- fully reconstructable

---

### 3.5 Audit Record

Represents **evidence of an action**.

---

**Attributes:**

- audit_id
- entity_type
- entity_id
- action
- actor_id
- timestamp
- metadata

---

**Important:**

Audit ≠ Event

- Event → domain change
- Audit → evidence trail

---

## 4. Relationships Overview

```text
Decision ───────▶ Initiative ───────▶ Metric
     │                                 ▲
     │                                 │
     └──────────────▶ Metric ──────────┘

Decision ───────▶ Decision (supersession)
Decision ───────▶ Decision Event
Decision ───────▶ Audit Record
```

---

## 5. Aggregate Boundaries

---

### Decision Aggregate

Includes:

- decision state
- lifecycle
- linked entities references
- versioning

---

**Why:**

- ensures consistency
- centralizes invariants
- prevents partial updates

---

## 6. Value Objects

---

### DecisionStatus

- enum-like object
- enforces valid transitions

---

### Rationale

- structured explanation
- cannot be empty for critical transitions

---

### Ownership

- defines responsibility
- required for governance

---

## 7. Domain Rules Summary

---

### Rule 1 — No Orphan Decisions

Every decision must:

- have an owner
- have a purpose

---

### Rule 2 — No Silent Changes

Every change must:

- emit an event
- include rationale

---

### Rule 3 — No Broken Links

- metrics must exist
- initiatives must be valid

---

### Rule 4 — Time Matters

- decisions evolve
- history is preserved

---

## 8. Anti-Patterns Avoided

---

### ❌ Flat Data Model

```text
decision_table
initiative_table
metric_table
```

→ no meaning
→ no causality

---

### ❌ Implicit Relationships

→ hidden coupling
→ broken traceability

---

### ❌ Mutable History

→ no audit
→ no replay

---

## 9. Staff-Level Insight

FlowDesk is not modeling:

```text
Entities
```

It is modeling:

```text
Decisions + Their Impact Over Time
```

---

## 10. Summary

The FlowDesk domain is structured around:

```text
Decision (core)
   ↓
Initiative (execution)
   ↓
Metric (outcome)
```

With:

- events for history
- audit for evidence
- invariants for governance

---
