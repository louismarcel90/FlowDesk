# 🧠 ADR 003 — Multi-Tenancy Strategy

---

## Status

Accepted

---

## Context

FlowDesk is designed as a **multi-tenant Decision Intelligence System**.

Its core requirements include:

- tenant isolation
- secure access boundaries
- auditable governance per tenant
- scalable SaaS operations
- support for future enterprise customers

Each tenant must be able to:

- manage its own decisions
- link its own initiatives and metrics
- enforce its own governance workflows
- access only its own data

---

A key architectural question:

```text
What tenancy model should FlowDesk adopt?
```

---

## Decision

We adopt a **shared application, shared database, tenant-scoped data model** strategy for the MVP and early production stages.

Each tenant’s data is isolated logically via:

- `tenant_id` on all tenant-owned records
- tenant-aware authorization checks
- tenant-scoped queries and projections
- auditability of tenant context on every critical action

---

## Selected Model

```text
One application
One primary database
Many tenants
Strict row-level tenant isolation
```

---

## Why This Model

This model provides the best early trade-off between:

- delivery speed
- operational simplicity
- acceptable isolation for a serious SaaS MVP
- future evolution path toward stronger isolation

It allows FlowDesk to:

- move fast without premature infrastructure fragmentation
- keep operational overhead low
- maintain a strong governance model
- evolve later toward per-tenant database or hybrid isolation if needed

---

## Alternatives Considered

---

### Option 1 — Database per Tenant

---

**Description:**

- each tenant gets its own dedicated database

---

**Pros:**

- strongest isolation
- easier enterprise compliance story
- simpler tenant-level backup / restore
- reduced blast radius across tenants

---

**Cons:**

- operationally expensive
- harder migrations at scale
- more infra complexity
- inefficient for small tenants
- heavy burden for early-stage product velocity

---

**Conclusion:**

❌ Rejected for current stage — too expensive and complex for MVP / early production

---

### Option 2 — Schema per Tenant

---

**Description:**

- one database, separate schema for each tenant

---

**Pros:**

- stronger isolation than shared tables
- easier per-tenant reasoning than row isolation
- some operational separation

---

**Cons:**

- migration complexity grows with tenant count
- operational tooling becomes harder
- less flexible for analytics / shared infrastructure
- still more complex than needed initially

---

**Conclusion:**

❌ Rejected — better than shared rows in some cases, but too operationally awkward for FlowDesk’s expected evolution

---

### Option 3 — Shared Database, Shared Schema, Tenant ID (Chosen)

---

**Description:**

- all tenant-owned rows include `tenant_id`
- all access is tenant-scoped
- authorization enforces tenant boundaries

---

**Pros:**

- simplest operations
- fastest product iteration
- efficient resource usage
- good fit for MVP / early growth
- compatible with strong app-layer governance

---

**Cons:**

- weaker isolation than dedicated DBs
- higher risk if tenant filters are implemented poorly
- requires discipline in query and auth design
- stronger testing requirements

---

**Conclusion:**

✅ Selected — best trade-off for current stage

---

## Data Ownership Model

Every tenant-owned entity includes tenant context.

Examples:

- decisions
- initiatives
- metrics
- projections
- audit records
- notifications
- governance settings

---

### Example

```text
Decision
- id
- tenant_id
- title
- status
- owner_id
- rationale
```

---

## Enforcement Model

Tenant isolation is enforced at multiple layers.

---

### 1. Authentication Layer

Identity includes tenant context:

- active tenant
- user membership
- role(s) within tenant

---

### 2. Authorization Layer

Every access check validates:

- user belongs to tenant
- action is allowed within tenant
- entity belongs to same tenant

---

### 3. Query Layer

All reads must be tenant-scoped.

---

### 4. Domain Layer

Commands cannot link cross-tenant entities.

Example:

- tenant A decision cannot link to tenant B metric

---

### 5. Audit Layer

Every critical record includes:

- tenant_id
- actor_id
- action
- correlation_id

---

## Boundary Rule

A tenant boundary is a **hard security boundary**.

This means:

```text
Cross-tenant data access is always a security defect, never a product feature.
```

---

## Operational Consequences

---

### Positive

---

#### 1. Simpler Operations

- one DB cluster
- one migration path
- simpler backups

---

#### 2. Faster Delivery

- fewer infrastructure decisions early
- easier local development

---

#### 3. Better Product Agility

- easier to evolve schemas
- easier to ship new capabilities

---

### Negative

---

#### 1. Strong Dependence on Correct Query Scoping

- a missing tenant filter can leak data

---

#### 2. Higher Blast Radius

- DB-level incident can affect multiple tenants

---

#### 3. More Security Testing Required

- every access path must be validated

---

## Mitigations

---

### 1. Tenant-Scoped Repository Pattern

Repositories never expose unscoped access for tenant-owned entities.

Example shape:

```text
findDecisionById(tenantId, decisionId)
```

Not:

```text
findDecisionById(decisionId)
```

---

### 2. Authorization Before Data Return

Never rely only on frontend filtering.

Tenant validation happens server-side before returning data.

---

### 3. Defense in Depth

Use multiple protections:

- app-layer authorization
- DB constraints where possible
- projection validation
- audit verification

---

### 4. Automated Tests

Must include:

- cross-tenant access tests
- tenant switching tests
- projection isolation tests
- audit isolation tests

---

### 5. Safe Defaults

If tenant context is missing:

- reject the request
- do not infer silently

---

## Read / Projection Model

Projections must also be tenant-aware.

Examples:

- decision timeline per tenant
- governance dashboards per tenant
- audit exports per tenant

A projection that omits tenant scoping is considered corrupted.

---

## Event Model Implications

All tenant-owned events must include tenant context.

Example event metadata:

- event_id
- tenant_id
- aggregate_id
- actor_id
- timestamp
- correlation_id

This ensures:

- replay remains tenant-safe
- projections rebuild correctly
- audit remains isolated

---

## Migration Strategy for Future Enterprise Isolation

The chosen model is not the final ceiling.

FlowDesk may later support stronger isolation tiers:

---

### Tier 1 — Shared DB / Shared Schema

Default SaaS model

---

### Tier 2 — Shared App / Dedicated Database

For regulated or high-value tenants

---

### Tier 3 — Dedicated Deployment

For highly sensitive enterprise environments

---

This keeps the current architecture pragmatic while preserving a credible enterprise path.

---

## Failure Modes

---

### 1. Missing Tenant Filter

Result:

- cross-tenant data leak

Mitigation:

- repository design
- mandatory tenant context
- test coverage
- security review

---

### 2. Cross-Tenant Linking Bug

Result:

- invalid governance graph
- broken isolation

Mitigation:

- domain invariant checks
- foreign reference validation

---

### 3. Tenant Context Drift in Async Consumers

Result:

- projection corruption
- audit contamination

Mitigation:

- tenant_id mandatory in event metadata
- idempotent consumers
- validation on projection writes

---

### 4. Incorrect Tenant Switching in Session Context

Result:

- access under wrong tenant scope

Mitigation:

- explicit active-tenant selection
- revalidation on sensitive commands
- audit all tenant-switch events

---

## Security Considerations

Multi-tenancy is not just a storage concern.

It affects:

- authentication
- authorization
- projection design
- audit integrity
- export boundaries
- notification routing

This is why tenant isolation must be treated as a full-system concern, not a database concern only.

---

## Staff-Level Insight

Early systems often ask:

```text
How do we support many customers?
```

Serious systems ask:

```text
How do we guarantee that one customer can never observe another customer's reality?
```

FlowDesk must answer the second.

---

## Final Decision

```text
We choose shared application + shared database + strict tenant-scoped data isolation
because it gives FlowDesk the best current trade-off between speed, simplicity, and SaaS credibility.
```

---

## Related Documents

- `tenant-isolation.md`
- `rbac-abac-model.md`
- `decision-audit.md`
- `001-main-storage-decision.md`

---
