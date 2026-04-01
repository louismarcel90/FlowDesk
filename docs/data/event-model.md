# 🧠 FlowDesk — Event Model

---

## 1. Purpose

Defines event structure and lifecycle.

---

## 2. Event Structure

- event_id
- type
- aggregate_id
- tenant_id
- payload
- timestamp

---

## 3. Event Types

- DecisionCreated
- DecisionProposed
- DecisionApproved
- DecisionDeprecated

---

## 4. Staff-Level Insight

Events represent:

```text
Facts, not commands
```

---
