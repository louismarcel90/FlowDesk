# Security Overview — FlowDesk

## Philosophy

FlowDesk is designed with security-by-default principles:

- Zero-trust API boundaries
- Policy-as-Code (OPA)
- Role-based access control (RBAC)
- Audit-first architecture
- Deterministic idempotency
- Explicit ownership of resources

---

# 1️⃣ Authentication

- JWT access tokens (short-lived)
- Refresh tokens (rotated)
- Organization-scoped authorization
- Bearer token required for all protected routes

Future hardening:
- HTTP-only cookies
- CSRF protection
- Token rotation enforcement
- Key rotation strategy

---

# 2️⃣ Authorization (OPA Policy-as-Code)

All protected endpoints require:
- Authentication
- Policy evaluation through Open Policy Agent (OPA)

Policies define:
- Action (e.g. decision.approve)
- Resource
- Role rank requirements

Security benefits:
- Centralized authorization logic
- Auditability of policy decisions
- Deterministic access control

---

# 3️⃣ Data Protection

- PostgreSQL with foreign key constraints
- Unique idempotency keys for notification deliveries
- Schema validation via Zod
- Strict input validation

Sensitive fields:
- JWT secrets (env only)
- SMTP credentials
- Database credentials

---

# 4️⃣ Audit Logging

Every critical action logs:
- actor_user_id
- action
- entity_type
- entity_id
- correlation_id
- payload
- timestamp

Examples:
- DECISION_APPROVED
- METRIC_CREATED
- DLQ_REPROCESSED

Audit logs are immutable.

---

# 5️⃣ Notification Safety

- Deterministic retry backoff
- Idempotency key enforced at DB level
- Dead Letter Queue (DLQ)
- Manual reprocessing requires admin role

---

# 6️⃣ Abuse & Rate Limiting (Planned)

- API rate limiting middleware
- Brute-force login protection
- Notification spam protection
- Audit anomaly detection

---

# 7️⃣ Secret Management

Production strategy:
- Use environment-based secret injection
- No secrets in repository
- Encrypted secret storage (e.g., AWS Secrets Manager / Vault)

---

# 8️⃣ Security Incident Response

See: RUNBOOKS/incidents.md

Key immediate actions:
- Rotate secrets
- Invalidate tokens
- Freeze notification jobs
- Review audit_events
