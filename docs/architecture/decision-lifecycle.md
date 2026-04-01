# 🧠 FlowDesk — Decision Lifecycle

---

## 1. Purpose

This document defines how **decisions are created, evolve, and are governed over time** in FlowDesk.

It answers:

- What is a decision lifecycle?
- What states can a decision go through?
- What rules govern transitions?
- How is explainability preserved?

---

## 2. Core Principle

A decision is not a static object.

It is a **temporal entity**.

```text
Decision = State + History + Intent
```

FlowDesk models decisions as:

👉 **a sequence of governed transitions over time**

---

## 3. Lifecycle Overview

```text
        ┌──────────┐
        │  DRAFT   │
        └────┬─────┘
             │
             ▼
        ┌──────────┐
        │ PROPOSED │
        └────┬─────┘
             │
     ┌───────┴────────┐
     ▼                ▼
┌──────────┐    ┌──────────┐
│ APPROVED │    │ REJECTED │
└────┬─────┘    └────┬─────┘
     │                │
     ▼                ▼
┌──────────┐    ┌──────────┐
│ ACTIVE   │    │ ARCHIVED │
└────┬─────┘    └──────────┘
     │
     ▼
┌──────────┐
│ DEPRECATED│
└──────────┘
```

---

## 4. Lifecycle States

---

### 4.1 Draft

- initial state
- not visible to others
- incomplete reasoning allowed

---

### 4.2 Proposed

- ready for review
- requires:
  - rationale
  - owner
  - linked context (optional)

---

### 4.3 Approved

- validated by reviewer(s)
- decision is accepted

---

### 4.4 Rejected

- explicitly declined
- must include justification

---

### 4.5 Active

- decision is in effect
- linked to initiatives and metrics

---

### 4.6 Deprecated

- no longer valid
- replaced or obsolete

---

### 4.7 Archived

- final state
- no further changes allowed

---

## 5. Transition Rules (CRITICAL)

Transitions are NOT free.

They are governed by **policies + invariants**.

---

### Example Rules

---

#### Draft → Proposed

Requires:

- title present
- rationale present
- owner assigned

---

#### Proposed → Approved

Requires:

- reviewer approval
- no blocking issues
- valid metric linkage (if required)

---

#### Approved → Active

Requires:

- linked initiative
- execution context

---

#### Active → Deprecated

Requires:

- reason for deprecation
- optionally link to replacement decision

---

#### Any → Archived

Requires:

- finalization intent
- no pending dependencies

---

## 6. Lifecycle as Event Stream

Each transition emits an event.

```text
DecisionCreated
DecisionProposed
DecisionApproved
DecisionActivated
DecisionDeprecated
DecisionArchived
```

👉 The lifecycle is **not stored as a field**
👉 It is reconstructed from events

---

## 7. Explainability Model

Every transition must answer:

```text
WHO did this?
WHY was it done?
WHAT changed?
WHEN did it happen?
```

Each event includes:

- actor_id
- timestamp
- rationale
- previous_state
- new_state
- correlation_id

---

## 8. Temporal Integrity

FlowDesk guarantees:

### 8.1 No State Mutation

- state is derived
- not overwritten

---

### 8.2 Full Replayability

- decisions can be reconstructed
- lifecycle can be replayed

---

### 8.3 Version Awareness

- decisions can evolve
- but history is preserved

---

## 9. Decision Timeline (UI Concept)

```text
[Draft Created]
     ↓
[Proposed by Alice]
     ↓
[Approved by Bob]
     ↓
[Activated with Initiative X]
     ↓
[Deprecated due to Metric Drift]
```

This timeline is:

👉 auto-generated from events
👉 not manually curated

---

## 10. Anti-Patterns Avoided

---

### ❌ Direct State Mutation

```text
UPDATE decision SET status = 'approved'
```

→ breaks history
→ removes causality

---

### ❌ Missing Rationale

→ decision becomes meaningless
→ no audit value

---

### ❌ UI-driven transitions

→ business logic leaks
→ inconsistency risk

---

## 11. Failure Modes

---

### 11.1 Invalid Transition Attempt

Example:

- Draft → Active

Mitigation:

- validation engine rejects

---

### 11.2 Missing Context

Example:

- Approved without rationale

Mitigation:

- strict policy enforcement

---

### 11.3 Conflicting Updates

Example:

- two approvals simultaneously

Mitigation:

- optimistic concurrency
- version checks

---

## 12. Advanced Concepts (Staff-Level)

---

### 12.1 Decision Supersession

A decision can replace another:

```text
Decision B supersedes Decision A
```

Maintains lineage and traceability.

---

### 12.2 Decision Drift

A decision becomes invalid due to:

- metric degradation
- environment change

FlowDesk detects:

👉 **“Decision is no longer justified”**

---

### 12.3 Conditional Decisions

Decisions can include conditions:

```text
IF metric X > threshold
THEN decision remains valid
```

---

### 12.4 Re-evaluation Triggers

Events that trigger reassessment:

- metric anomaly
- initiative failure
- time-based expiry

---

## 13. Why This Matters

Without lifecycle:

```text
Decision = Static Record
```

With FlowDesk:

```text
Decision = Living Entity with Causality
```

---

## 14. Summary

FlowDesk models decisions as:

```text
Event Stream → Lifecycle → Explainability → Governance
```

This ensures:

- traceable reasoning
- controlled evolution
- audit-ready history
- meaningful system understanding

---

## 15. Next Documents

- `domain-model.md`
- `decision-explainability.md`
- `decision-audit.md`
- `001-main-storage-decision.md`

---
