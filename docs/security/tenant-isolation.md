# 🧠 FlowDesk — Tenant Isolation

---

## 1. Purpose

This document defines how FlowDesk enforces strict separation between tenants.

It ensures that one tenant cannot access, influence, or observe another tenant’s data or decision reality.

---

## 2. Core Principle

Tenant isolation is a hard security boundary.

```text
Cross-tenant access = security defect
```

It is never treated as a harmless bug or a UI issue.

---

## 3. Isolation Goals

FlowDesk must guarantee:

- tenant-scoped reads
- tenant-scoped writes
- tenant-scoped projections
- tenant-scoped audit records
- tenant-scoped notifications and exports

---

## 4. Isolation Layers

---

### 4.1 Identity Layer

Every authenticated actor is resolved within tenant context.

Session or token context includes:

- actor_id
- tenant memberships
- active tenant
- role mapping

---

### 4.2 Authorization Layer

Every access decision validates:

- actor belongs to tenant
- resource belongs to tenant
- action is allowed inside that tenant boundary

---

### 4.3 Data Layer

All tenant-owned entities include `tenant_id`.

Examples:

- decisions
- initiatives
- metrics
- events
- audit records
- projections

---

### 4.4 Query Layer

Repositories must require tenant context for tenant-owned resources.

Preferred shape:

```text
getDecision(tenantId, decisionId)
```

Not:

```text
getDecision(decisionId)
```

---

### 4.5 Projection Layer

Projected read models must preserve tenant scoping.

A projection missing tenant context is considered corrupted.

---

### 4.6 Async/Event Layer

Tenant-owned events include:

- tenant_id
- actor_id
- correlation_id
- aggregate_id

This ensures tenant-safe replay and projection rebuilds.

---

## 5. Isolation Rules

---

### Rule 1 — No Cross-Tenant Linking

A tenant A decision cannot link to:

- tenant B metric
- tenant B initiative
- tenant B audit artifact

---

### Rule 2 — No Unscoped Reads

All tenant-owned reads must be scoped explicitly.

---

### Rule 3 — No Implicit Tenant Inference for Sensitive Actions

If tenant context is unclear, reject the action.

---

### Rule 4 — Exports Stay Within Boundary

Exports and reports must only contain data for the selected tenant scope.

---

## 6. Failure Modes

### Missing tenant filter

Can leak data across tenants.

Mitigation:

- repository patterns
- mandatory tenant args
- test coverage

### Wrong active-tenant context

Can authorize action in wrong scope.

Mitigation:

- explicit tenant switching
- revalidation on sensitive commands
- audit tenant-switch actions

### Async consumer writes to wrong tenant projection

Can corrupt isolation.

Mitigation:

- mandatory tenant metadata
- validation before projection writes
- reconciliation checks

### Cross-tenant analytics join

Can expose unauthorized insight.

Mitigation:

- scoped analytics queries
- isolated exports
- review of reporting paths

---

## 7. Testing Strategy

Isolation must be tested explicitly with:

- cross-tenant access tests
- tenant switch tests
- projection isolation tests
- export isolation tests
- async replay isolation tests

---

## 8. Operational Practices

- security review for new query paths
- production alerts for suspicious cross-tenant anomalies
- restricted access to raw data tooling
- audit trail for tenant context changes

---

## 9. Staff-Level Insight

Basic SaaS systems ask:

```text
How do we tag data by customer?
```

Serious SaaS systems ask:

```text
How do we guarantee that customer A can never observe customer B’s truth, directly or indirectly?
```

FlowDesk must implement the second.

---

## 10. Summary

Tenant isolation in FlowDesk is enforced through:

```text
Identity
→ Authorization
→ Tenant-scoped data
→ Tenant-safe projections
→ Tenant-safe events
→ Tenant-safe exports
```

This protects:

- confidentiality
- correctness
- trust
- enterprise credibility

---
