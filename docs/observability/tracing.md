# 🧠 FlowDesk — Tracing

---

## 1. Purpose

This document defines how FlowDesk uses **distributed tracing** to follow requests and events across the system.

---

## 2. Core Principle

A single request spans multiple components.

Tracing reconstructs the full path.

---

## 3. Trace Flow

```text
User Request
   ↓
API Gateway
   ↓
Command Handler
   ↓
Event Store
   ↓
Projection
   ↓
Frontend Update
```

---

## 4. Trace Context

Each trace includes:

- trace_id
- span_id
- parent_span_id
- correlation_id
- tenant_id

---

## 5. Instrumentation

Using:

- OpenTelemetry

---

## 6. What We Trace

- API requests
- command execution
- event processing
- projection updates

---

## 7. Example Use Case

👉 Debug slow decision approval:

- identify slow span
- trace event propagation
- detect bottleneck

---

## 8. Staff-Level Insight

Logs tell you **what happened**.
Tracing tells you **where it broke**.

---
