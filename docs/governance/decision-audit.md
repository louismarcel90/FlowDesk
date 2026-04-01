# 🧠 FlowDesk — Decision Audit

---

## 1. Purpose

This document defines how FlowDesk ensures that **every decision is auditable, provable, and tamper-resistant**.

It answers:

- how decisions are tracked for compliance
- how evidence is stored and verified
- how audit differs from logging and events

---

## 2. Core Principle

A decision that cannot be proven never truly existed.

```text id="g7zjv8"
Decision - Evidence = Trust Gap
```

FlowDesk enforces:

👉 **Provability by design**

---

## 3. What is Audit in FlowDesk?

Audit is:

- a **structured, immutable record of actions**
- designed for:
  - compliance
  - accountability
  - forensic analysis

---

### Audit is NOT:

- logs
- debug traces
- optional metadata

---

## 4. Audit vs Event vs Log

---

### Event

- represents a domain change
- part of system state

---

### Audit Record

- represents **evidence of an action**
- enriched with context
- designed for external verification

---

### Log

- technical information
- used for debugging

---

```text id="k0gb0m"
Event = "what changed"
Audit = "who did it and why"
Log   = "what happened internally"
```

---

## 5. Audit Record Structure

Each audit record must include:

---

### Core Fields

- audit_id
- entity_type (Decision, Initiative, etc.)
- entity_id
- action (approved, updated, archived, etc.)
- actor_id
- timestamp

---

### Context Fields

- rationale
- previous_state
- new_state
- related_entities
- correlation_id

---

### Integrity Fields (CRITICAL)

- event_id reference
- hash
- previous_hash (chain)

---

## 6. Audit Flow

```text id="3y7m4c"
Command Executed
      ↓
Domain Event Created
      ↓
Event Stored (append-only)
      ↓
Audit Record Generated
      ↓
Hash Computed
      ↓
Stored in Audit Store
      ↓
Available for Query / Export
```

---

## 7. Tamper Resistance Model

FlowDesk ensures audit integrity via:

---

### 7.1 Append-Only Storage

- no update
- no delete

---

### 7.2 Hash Chaining

```text id="h9xxhz"
Audit₁ → hash₁
Audit₂ → hash₂(previous_hash = hash₁)
Audit₃ → hash₃(previous_hash = hash₂)
```

👉 Any modification breaks the chain

---

### 7.3 External Verification (Optional)

- export audit snapshots
- verify hashes externally

---

## 8. Audit Timeline Example

```text id="1g8k7b"
[Decision Created]
by Alice
hash: abc123

↓

[Decision Approved]
by Bob
hash: def456
prev_hash: abc123

↓

[Decision Activated]
by System
hash: ghi789
prev_hash: def456
```

---

## 9. Querying Audit Data

Audit must support:

---

### 9.1 By Decision

- full lifecycle
- all actions

---

### 9.2 By Actor

- all actions by a user

---

### 9.3 By Time Range

- historical analysis

---

### 9.4 By Action Type

- approvals
- rejections
- changes

---

## 10. Audit Guarantees

FlowDesk guarantees:

---

### 10.1 Immutability

- records cannot be altered

---

### 10.2 Completeness

- no action is missing

---

### 10.3 Traceability

- full chain of actions

---

### 10.4 Verifiability

- integrity can be checked

---

## 11. Failure Modes

---

### 11.1 Missing Audit Record

Cause:

- failure in audit writer

Mitigation:

- retry mechanism
- audit write must be blocking for critical actions

---

### 11.2 Broken Hash Chain

Cause:

- corruption or tampering

Mitigation:

- periodic verification jobs
- alerting

---

### 11.3 Inconsistent Event ↔ Audit Mapping

Cause:

- mismatch between event and audit

Mitigation:

- strict coupling
- shared correlation_id

---

## 12. Compliance Considerations

FlowDesk audit model supports:

- SOC2
- ISO 27001
- internal governance audits

---

### Key Features

- immutable history
- actor accountability
- decision traceability

---

## 13. Staff-Level Insight

Most systems implement:

```text id="1sz8qf"
"we log what happened"
```

FlowDesk implements:

```text id="91wbv8"
"we can prove what happened"
```

This is the difference between:

- observability
- **accountability**

---

## 14. Anti-Patterns Avoided

---

### ❌ Mutable audit logs

→ breaks trust

---

### ❌ Missing actor context

→ no accountability

---

### ❌ No integrity verification

→ audit becomes unverifiable

---

## 15. Summary

FlowDesk audit model:

```text id="0vhp8t"
Event → Audit Record → Hash → Chain → Verification
```

This ensures:

- trust
- compliance
- provability
- system credibility

---

## 16. Related Documents

- `decision-explainability.md`
- `decision-lifecycle.md`
- `audit-log-integrity.md`
- `event-model.md`

---
