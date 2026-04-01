# 🧠 FlowDesk — Metrics

---

## 1. Purpose

This document defines the **metrics used to monitor FlowDesk’s health, performance, and governance quality**.

---

## 2. Core Principle

If you can’t measure it, you can’t operate it.

```text
System → Signals → Metrics → Decisions
```

---

## 3. Metric Categories

---

### 3.1 System Metrics

Measure infrastructure health.

- request rate (RPS)
- error rate (%)
- latency (p50 / p95 / p99)
- CPU / memory usage

---

### 3.2 Event Pipeline Metrics

- event ingestion rate
- event processing latency
- projection lag
- DLQ size

---

### 3.3 Decision Metrics (Product-Level)

- number of decisions created
- decisions by lifecycle state
- approval rate
- rejection rate

---

### 3.4 Governance Metrics

- decisions with missing rationale (should be 0)
- decision drift rate
- re-evaluation frequency
- audit completeness

---

## 4. Golden Signals

FlowDesk tracks:

- latency
- traffic
- errors
- saturation

---

## 5. SLO Examples

---

### API Latency

- p95 < 200ms

---

### Projection Lag

- < 2 seconds

---

### Error Rate

- < 1%

---

## 6. Dashboards

- system health
- decision lifecycle distribution
- event pipeline
- governance quality

---

## 7. Staff-Level Insight

Metrics are not just for uptime.

They are for:

```text
Understanding if decisions are working
```

---
