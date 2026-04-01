# 🧠 ADR 005 — Explainability Model

---

## Status

Accepted

---

## Context

FlowDesk is a **Decision Intelligence System**.

Its core value proposition is:

- understanding decisions
- tracing reasoning
- linking decisions to outcomes

---

Most systems treat explanation as:

- optional
- unstructured
- non-enforced

---

FlowDesk must guarantee:

```text
Every decision is explainable by design
```

---

## Decision

We adopt a **structured, enforced explainability model embedded in commands, events, and audit records**.

---

## Model Overview

Explainability is captured at three levels:

---

### 1. Command Level

- user must provide rationale
- missing explanation → rejected

---

### 2. Event Level

- every event contains:
  - actor
  - reason
  - context

---

### 3. Audit Level

- evidence includes:
  - rationale
  - state transition
  - metadata

---

## Why This Model

FlowDesk needs:

- consistent explanations
- queryable reasoning
- audit-ready data
- enforceable structure

---

## Alternatives Considered

---

### Option 1 — Free Text Explanation

---

**Pros:**

- flexible
- easy to implement

---

**Cons:**

- inconsistent
- not queryable
- not enforceable
- low value for analytics

---

**Conclusion:**

❌ Rejected

---

### Option 2 — Optional Metadata

---

**Pros:**

- lightweight
- backward compatible

---

**Cons:**

- incomplete data
- unreliable system
- weak governance

---

**Conclusion:**

❌ Rejected

---

### Option 3 — Enforced Structured Model (Chosen)

---

**Pros:**

- consistent
- auditable
- queryable
- supports analytics

---

**Cons:**

- stricter UX
- higher initial friction

---

**Conclusion:**

✅ Selected

---

## Consequences

---

### Positive

---

#### 1. High-Quality Decisions

- enforced reasoning

---

#### 2. Strong Governance

- decisions are explainable

---

#### 3. Better Analytics

- reasoning can be analyzed

---

---

### Negative

---

#### 1. User Friction

- more fields required

---

#### 2. Schema Evolution Complexity

- changes must be backward compatible

---

## Mitigations

---

### UX

- templates
- guided inputs

---

### Schema

- versioned explainability model

---

## Staff-Level Insight

Most systems capture:

```text
What happened
```

FlowDesk captures:

```text
Why it happened
```

---

## Final Decision

```text
We enforce explainability as a first-class, structured, and mandatory component of every decision.
```

---

## Related Documents

- `decision-explainability.md`
- `decision-audit.md`

---
