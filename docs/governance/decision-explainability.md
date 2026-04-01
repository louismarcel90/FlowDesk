# 🧠 FlowDesk — Decision Explainability

---

## 1. Purpose

This document defines how **FlowDesk ensures that every decision is explainable, auditable, and understandable**.

It answers:

- what does it mean for a decision to be explainable?
- what information must be captured?
- how is explainability enforced at system level?

---

## 2. Core Principle

A decision without explanation is useless.

```text
Decision - Explanation = Noise
```

FlowDesk enforces:

👉 **Explainability by design, not by convention**

---

## 3. What is Explainability?

A decision is explainable if it answers:

```text
WHO made this decision?
WHAT was decided?
WHY was it decided?
WHEN did it happen?
WHAT changed because of it?
```

---

## 4. Explainability Model

Each decision transition must produce an **explainability record**.

---

### Required Fields

- actor_id
- decision_id
- previous_state
- new_state
- rationale (mandatory for critical transitions)
- timestamp
- correlation_id
- related_entities (metrics, initiatives)

---

## 5. Explainability as a First-Class Object

Explainability is NOT:

- a log
- a comment
- optional metadata

It is:

👉 a **structured, queryable artifact**

---

## 6. System Design Enforcement

Explainability is enforced at multiple levels:

---

### 6.1 Command Level

- commands must include rationale
- missing rationale → rejected

---

### 6.2 Domain Level

- validation engine enforces:
  - required justification
  - valid transitions

---

### 6.3 Event Level

Each event contains:

- actor
- reason
- context

---

### 6.4 Audit Layer

Audit records ensure:

- tamper-proof trace
- compliance readiness

---

## 7. Explainability Flow

```text
User Action
   ↓
Command (with rationale)
   ↓
Validation Engine
   ↓
Domain Event (with context)
   ↓
Event Store
   ↓
Audit Record
   ↓
Projection → Timeline UI
```

---

## 8. UI Representation

Explainability is surfaced as:

---

### 8.1 Decision Timeline

```text
[Decision Proposed]
by Alice
Reason: Improve conversion rate

↓

[Decision Approved]
by Bob
Reason: Validated by metrics

↓

[Decision Activated]
Linked to Initiative X
```

---

### 8.2 Impact View

```text
Decision → Initiative → Metrics
```

Shows:

- what changed
- what improved
- what degraded

---

## 9. Explainability vs Logging

---

### Logging

- technical
- unstructured
- system-focused

---

### Explainability

- business-focused
- structured
- decision-focused

---

```text
Logs = "what happened in the system"
Explainability = "why the system exists in this state"
```

---

## 10. Guarantees

FlowDesk guarantees:

---

### 10.1 No Silent Decisions

- every decision has a rationale

---

### 10.2 No Hidden Transitions

- all changes are events

---

### 10.3 Full Traceability

- full lifecycle visible

---

### 10.4 Audit-Ready History

- compliance-ready evidence

---

## 11. Failure Modes

---

### 11.1 Missing Rationale Attempt

→ rejected at command level

---

### 11.2 Corrupted Event Metadata

→ breaks explainability

Mitigation:

- strict event schema
- validation

---

### 11.3 Partial Context

→ incomplete explanation

Mitigation:

- required fields enforcement

---

## 12. Advanced Concepts

---

### 12.1 Explainability Depth

Levels of explanation:

1. basic (who/what/when)
2. contextual (why)
3. causal (impact on metrics)

---

### 12.2 Causal Chains

```text
Decision A → Initiative B → Metric C ↑
```

Allows answering:

👉 _“Why did this metric change?”_

---

### 12.3 Explainability Score (Optional)

A decision can be scored based on:

- completeness
- clarity
- traceability

---

## 13. Staff-Level Insight

Most systems answer:

```text
"What is happening?"
```

FlowDesk answers:

```text
"Why is this happening?"
```

This is the difference between:

- observability
- **understandability**

---

## 14. Anti-Patterns Avoided

---

### ❌ Free-text explanations only

→ not queryable
→ not enforceable

---

### ❌ Optional rationale

→ inconsistent system

---

### ❌ UI-only explanations

→ not reliable
→ not auditable

---

## 15. Summary

FlowDesk explainability model:

```text
Command → Rationale → Event → Audit → Timeline → Insight
```

This ensures:

- decisions are understandable
- systems are auditable
- outcomes are explainable

---

## 16. Related Documents

- `decision-lifecycle.md`
- `decision-audit.md`
- `domain-model.md`

---
