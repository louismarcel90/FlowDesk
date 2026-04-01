# 🧠 FlowDesk — Data Recovery

---

## 1. Purpose

Defines how FlowDesk recovers from:

- data loss
- corruption
- system failure

---

## 2. Core Principle

Event store = source of truth

---

## 3. Recovery Strategy

---

### 3.1 Event Store Recovery

- restore from backup
- verify integrity

---

### 3.2 Projection Recovery

- delete projections
- replay events

---

### 3.3 Audit Recovery

- verify hash chain
- restore missing records

---

## 4. Backup Strategy

- periodic snapshots
- incremental backups

---

## 5. Recovery Flow

```text
Restore Event Store
   ↓
Verify Integrity
   ↓
Replay Events
   ↓
Rebuild Projections
   ↓
Restore System
```

---

## 6. Staff-Level Insight

If you lose projections → rebuild
If you lose events → you lose truth

---
