# 🧠 FlowDesk — Logging

---

## 1. Purpose

Defines how FlowDesk logs system activity for debugging and operational visibility.

---

## 2. Core Principle

Logs must be:

- structured
- searchable
- contextual

---

## 3. Log Structure

Each log includes:

- timestamp
- level (info, warn, error)
- service
- message
- trace_id
- tenant_id

---

## 4. Log Types

---

### Application Logs

- business events
- command execution

---

### Error Logs

- exceptions
- failures

---

### Security Logs

- auth failures
- unauthorized access

---

## 5. Anti-Patterns

- unstructured logs
- missing context
- excessive noise

---

## 6. Staff-Level Insight

Logs are for:

```text
Debugging systems, not explaining decisions
```

---
