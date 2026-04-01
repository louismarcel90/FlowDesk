# 🧠 FlowDesk — Schema

---

## 1. Core Entities

---

### Decision

- id
- tenant_id
- title
- status
- owner_id

---

### Event

- id
- aggregate_id
- type
- payload
- timestamp

---

### Audit

- id
- event_id
- actor_id
- action
- timestamp

---

## 2. Relationships

```text
Decision → Events → Audit
```

---
