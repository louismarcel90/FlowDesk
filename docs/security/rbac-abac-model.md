# 🧠 FlowDesk — RBAC / ABAC Model

---

## 1. Purpose

This document defines the authorization model used by FlowDesk.

It explains how access is controlled using:

- RBAC (Role-Based Access Control)
- ABAC (Attribute-Based Access Control)

---

## 2. Core Principle

FlowDesk cannot rely on simple binary roles alone.

A user may be allowed to act depending on:

- their role
- their tenant
- the decision state
- ownership
- contextual attributes

This requires a hybrid model:

```text
RBAC for broad permissions
ABAC for contextual decisions
```

---

## 3. Why Hybrid Authorization

RBAC alone is insufficient because FlowDesk contains contextual actions such as:

- approve only if user is a reviewer
- edit only if decision is still draft
- archive only if no active dependencies exist
- view only within same tenant

ABAC complements RBAC by evaluating attributes around the action.

---

## 4. RBAC Layer

Example roles:

- TenantAdmin
- GovernanceLead
- Reviewer
- Contributor
- Viewer

---

### Example role responsibilities

#### TenantAdmin

- manage tenant settings
- manage memberships
- full visibility within tenant

#### GovernanceLead

- approve and deprecate decisions
- review governance quality
- access audit views

#### Reviewer

- review proposals
- approve or reject within allowed scope

#### Contributor

- create draft decisions
- update owned draft decisions

#### Viewer

- read approved / active content
- no mutation rights

---

## 5. ABAC Layer

Authorization also evaluates attributes such as:

- `tenant_id`
- `actor_id`
- `decision.owner_id`
- `decision.status`
- `decision.type`
- `request.time`
- `resource.sensitivity`
- `actor.review_scope`

---

## 6. Example Policies

---

### Policy 1 — Edit Draft Decision

Allow if:

- actor belongs to same tenant
- actor is owner OR has elevated role
- decision status is `draft`

---

### Policy 2 — Approve Decision

Allow if:

- actor belongs to same tenant
- actor has Reviewer or GovernanceLead role
- actor is not forbidden by separation-of-duties rule
- decision status is `proposed`

---

### Policy 3 — View Audit Trail

Allow if:

- actor belongs to same tenant
- actor role is GovernanceLead or TenantAdmin

---

### Policy 4 — Archive Decision

Allow if:

- actor belongs to same tenant
- actor has sufficient role
- decision has no blocking dependencies
- decision is in a terminal-compatible state

---

## 7. Separation of Duties

FlowDesk may enforce separation-of-duties rules such as:

- creator cannot be sole approver
- reviewer cannot approve outside assigned scope
- tenant admin cannot silently bypass audit requirements

These rules reduce governance abuse.

---

## 8. Authorization Evaluation Flow

```text
Request
  ↓
Authenticate actor
  ↓
Resolve tenant context
  ↓
Load relevant resource attributes
  ↓
Evaluate RBAC
  ↓
Evaluate ABAC
  ↓
Allow / Deny
```

---

## 9. Enforcement Points

Authorization is enforced at:

- API boundary
- command handler boundary
- query boundary
- export boundary
- async consumer validation where applicable

---

## 10. Safe Defaults

- missing tenant context → deny
- missing role mapping → deny
- missing resource attributes for sensitive decision → deny

---

## 11. Anti-Patterns Avoided

### ❌ Admin bypass everywhere

Leads to invisible risk and poor auditability.

### ❌ Frontend-only authorization

Not trustworthy.

### ❌ Role-only authorization for contextual workflows

Too coarse for governance systems.

### ❌ Cross-tenant “super queries”

Violates isolation guarantees.

---

## 12. Staff-Level Insight

Simple apps ask:

```text
Who is the user?
```

FlowDesk must ask:

```text
Who is the user, in which tenant, acting on which decision, in what state, under which conditions?
```

That is the difference between basic auth and governance-grade auth.

---

## 13. Summary

FlowDesk authorization model:

```text
RBAC → coarse capability
ABAC → contextual safety
```

This ensures:

- flexible authorization
- strong governance controls
- tenant-safe enforcement

---
