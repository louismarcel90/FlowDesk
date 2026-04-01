# 🧠 FlowDesk — Rollback Strategy

---

## 1. Purpose

Defines how FlowDesk safely rolls back:

- deployments
- features
- data projections

---

## 2. Core Principle

Rollback must be:

- fast
- safe
- predictable

---

## 3. Deployment Rollback

---

### Strategy

- blue/green or canary deployments
- revert to previous version

---

### Requirement

- backward-compatible schema
- versioned APIs

---

## 4. Event-Based Rollback

FlowDesk does NOT delete events.

Instead:

```text
Correction = New Event
```

---

### Example

```text
DecisionApproved (wrong)
→ DecisionReverted
```

---

## 5. Projection Rollback

---

### Strategy

- drop projection
- rebuild from event store

---

## 6. Feature Rollback

- feature flags
- gradual disable

---

## 7. Risks

- schema incompatibility
- partial rollback
- inconsistent projections

---

## 8. Staff-Level Insight

You don’t undo history.

You append correction.

---
