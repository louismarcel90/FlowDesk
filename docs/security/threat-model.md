# 🧠 FlowDesk — Threat Model

---

## 1. Purpose

This document defines the primary **security threats, trust boundaries, and mitigations** for FlowDesk.

It answers:

- what can go wrong?
- where are the attack surfaces?
- how do we reduce risk?

---

## 2. Core Principle

FlowDesk manages:

- decisions
- governance context
- audit evidence
- cross-entity relationships

This means it must protect not only system availability, but also:

- integrity
- traceability
- tenant isolation
- decision authenticity

---

## 3. Security Objectives

FlowDesk must guarantee:

- confidentiality of tenant data
- integrity of decisions and audit history
- availability of critical workflows
- accountability of user actions

---

## 4. Trust Boundaries

```text
User Browser
   ↓
Frontend Boundary
   ↓
API Boundary
   ↓
Application / Domain Boundary
   ↓
Persistence Boundary
   ↓
External Systems Boundary
```

Each boundary introduces risk and must be explicitly defended.

---

## 5. Primary Assets

Critical assets include:

- decisions
- decision events
- audit records
- tenant membership data
- roles / permissions
- metrics linkage
- explainability metadata

---

## 6. Threat Categories

---

### 6.1 Unauthorized Access

Examples:

- user accesses another tenant’s decision
- user performs approval without sufficient privileges

Mitigations:

- server-side authorization
- tenant-scoped access checks
- RBAC / ABAC enforcement

---

### 6.2 Cross-Tenant Data Leakage

Examples:

- missing `tenant_id` filter
- incorrect projection scoping

Mitigations:

- mandatory tenant context
- repository scoping
- tenant-aware projections
- automated cross-tenant tests

---

### 6.3 Audit Tampering

Examples:

- audit records modified after the fact
- missing audit for critical action

Mitigations:

- append-only audit store
- hash chaining
- integrity verification jobs
- blocking writes for critical audit paths

---

### 6.4 Decision Integrity Violation

Examples:

- direct DB mutation bypasses lifecycle rules
- invalid state transitions

Mitigations:

- no direct mutable write path
- aggregate invariants
- validation engine
- append-only event model

---

### 6.5 Replay / Duplicate Command Attacks

Examples:

- repeated approval command
- duplicated requests due to retry abuse

Mitigations:

- idempotency keys
- optimistic concurrency
- version checks
- command deduplication

---

### 6.6 Injection Attacks

Examples:

- SQL injection
- malicious filter parameters
- log injection via untrusted input

Mitigations:

- parameterized queries
- schema validation
- safe serialization
- structured logging

---

### 6.7 Denial of Service

Examples:

- API flooding
- event consumer overload
- expensive query abuse

Mitigations:

- rate limiting
- pagination
- query guards
- queue backpressure
- autoscaling where applicable

---

### 6.8 Session / Identity Abuse

Examples:

- stolen session token
- tenant switch abuse
- privilege escalation through stale membership

Mitigations:

- short-lived tokens
- secure session handling
- sensitive action revalidation
- explicit active-tenant checks

---

## 7. Attack Surfaces

Main attack surfaces include:

- public API
- authentication/session layer
- command handlers
- query endpoints
- background consumers
- projection pipelines
- audit export endpoints

---

## 8. High-Risk Security Properties

The highest-risk failures in FlowDesk are:

```text
1. Cross-tenant access
2. Missing or altered audit evidence
3. Invalid decision lifecycle mutation
4. Privilege escalation
```

These are considered priority-1 security defects.

---

## 9. Security Design Principles

---

### 9.1 Deny by Default

If access is not explicitly allowed, it is rejected.

---

### 9.2 Tenant Boundary as Hard Boundary

Tenant separation is a security concern, not a UI concern.

---

### 9.3 Immutable History

Critical records must not be rewritten silently.

---

### 9.4 Server-Side Enforcement

The frontend may assist the UX, but never enforces trust.

---

### 9.5 Defense in Depth

Security is enforced across:

- authentication
- authorization
- domain validation
- persistence rules
- audit verification

---

## 10. Abuse Cases

Examples of abuse cases to defend against:

- employee from tenant A querying tenant B data
- non-reviewer approving a decision
- attacker generating decisions without rationale
- internal admin bypassing audit trail
- consumer writing projection into wrong tenant scope

---

## 11. Operational Mitigations

- security logs for auth failures
- audit verification jobs
- anomaly alerts for suspicious access patterns
- incident response runbooks
- permission review workflows

---

## 12. Staff-Level Insight

A weak threat model asks:

```text
How can the app be hacked?
```

A strong threat model asks:

```text
What system truths must never become false?
```

For FlowDesk, those truths are:

- tenant isolation
- audit integrity
- lifecycle integrity
- accountability

---

## 13. Summary

FlowDesk threat model prioritizes protection of:

```text
Identity → Boundaries → Decisions → Audit → Trust
```

Security exists to ensure the system remains:

- trustworthy
- explainable
- provable

---
