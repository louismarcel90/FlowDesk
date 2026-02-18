# Incident Response Runbook — FlowDesk

## Purpose

This document defines the standard operating procedure for identifying, classifying, mitigating, and resolving production incidents in FlowDesk.

It ensures:
- Fast mitigation
- Clear ownership
- Traceability
- Structured postmortems
- Continuous improvement

---

# 1️⃣ Incident Severity Levels

## SEV-1 (Critical)
- Platform unavailable
- Data loss
- Security breach
- Notification system completely down
- Database unavailable

**Target mitigation time:** < 30 minutes

---

## SEV-2 (Major)
- Partial outage (API degraded)
- Notifications failing for majority of users
- DLQ growing rapidly
- Significant performance degradation

**Target mitigation time:** < 2 hours

---

## SEV-3 (Minor)
- Non-critical feature broken
- UI inconsistency
- Non-blocking error

**Target mitigation time:** < 24 hours

---

# 2️⃣ Incident Response Flow

## Step 1 — Detection

Detection sources:
- Grafana dashboards
- Prometheus alerts
- Error logs
- User reports
- DLQ growth
- Email delivery failures

---

## Step 2 — Triage

Answer immediately:

- Is production impacted?
- Is data at risk?
- Is it user-visible?
- Is this security-related?

Assign severity level (SEV-1/2/3).

---

## Step 3 — Containment

Examples:

### API failure
- Restart API
- Check database connectivity
- Rollback to previous release

### Notification failure
- Check delivery worker logs
- Inspect `notification_jobs`
- Inspect `notification_dlq`
- Restart worker if stuck

### Kafka issue
- Check Redpanda container
- Verify topic health
- Restart publisher/orchestrator

---

## Step 4 — Communication

For SEV-1 and SEV-2:

- Create incident channel
- Document:
  - Time detected
  - Impact
  - Mitigation steps
  - Owner

Update every 15 minutes (SEV-1).

---

## Step 5 — Resolution

Mark incident as resolved when:

- System stable
- Monitoring green
- Error rate normal
- DLQ stable
- No data inconsistency

---

# 3️⃣ Notification System Incident Guide

## A) Emails not sending

Check:

1. Mailpit (dev) → http://localhost:8025
2. Delivery worker running?
3. SMTP configuration in `.env`
4. `notification_jobs` status

SQL:

```sql
select * from notification_jobs where status != 'done';
