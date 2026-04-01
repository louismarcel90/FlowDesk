# 🧠 FlowDesk — Architecture Overview

## 1. System Vision

FlowDesk is not a dashboard.

It is a **Decision Intelligence System** designed to:

- track decisions over time
- explain why they were made
- connect decisions to outcomes (metrics, initiatives)
- make governance observable and auditable

---

## 2. Core Problem

Modern systems expose:

- metrics
- dashboards
- alerts

But they fail to answer:

- _What decision caused this?_
- _Is this metric trustworthy?_
- _What changed?_
- _Who decided this and why?_

---

## 3. System Purpose

FlowDesk answers:

> “Why does this state of the system exist?”

It introduces a new primitive:

👉 **Decision as a first-class entity**

---

## 4. High-Level Architecture

```text
          ┌───────────────────────────────┐
          │         Frontend UI           │
          │ (Decision Explorer, Metrics)  │
          └──────────────┬────────────────┘
                         │
                         ▼
          ┌───────────────────────────────┐
          │         API Gateway           │
          │   (REST / GraphQL boundary)   │
          └──────────────┬────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Decision     │  │ Initiative   │  │ Metrics      │
│ Service      │  │ Service      │  │ Service      │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                  │                  │
       └──────────┬───────┴──────────┬──────┘
                  ▼                  ▼
        ┌──────────────────────────────────┐
        │        Domain Engine             │
        │ (Decision logic & validation)    │
        └──────────────────────────────────┘
                          │
                          ▼
        ┌──────────────────────────────────┐
        │        Event Store (append-only) │
        └──────────────────────────────────┘
                          │
                          ▼
        ┌──────────────────────────────────┐
        │     Read Models / Snapshots      │
        └──────────────────────────────────┘
```

---

## 5. Key Architectural Principles

### 5.1 Decisions are Immutable

- Decisions are never overwritten
- All changes are recorded as events
- History is first-class

---

### 5.2 Event-Driven Core

- All state transitions are events
- Example:
  - `DecisionCreated`
  - `DecisionUpdated`
  - `DecisionLinkedToMetric`

---

### 5.3 Separation of Write vs Read

- Write path → strict, validated, append-only
- Read path → optimized, denormalized

---

### 5.4 Explainability by Design

Every decision must answer:

- who created it
- why it exists
- what changed
- what it affects

---

### 5.5 Governance over CRUD

FlowDesk is not:

- a CRUD app
- a dashboard

It is:

👉 a **governance system with traceable causality**

---

## 6. Core Domains

### Decision Domain

- decision lifecycle
- reasoning
- ownership
- versioning

### Initiative Domain

- execution layer
- linked to decisions

### Metrics Domain

- observable outcomes
- validates decision impact

---

## 7. Data Flow (Simplified)

```text
User Action
   ↓
API Gateway
   ↓
Domain Validation
   ↓
Event Emitted
   ↓
Event Store
   ↓
Projection / Snapshot
   ↓
Frontend Updated
```

---

## 8. Why This Architecture Scales

### Organizationally

- clear domain boundaries
- independent services
- parallel team ownership

---

### Technically

- append-only = safe history
- event-driven = extensible
- read models = fast UI

---

### Product-wise

- supports audit
- supports explainability
- supports governance workflows

---

## 9. Non-Goals

FlowDesk does NOT:

- execute business logic (it tracks it)
- replace BI tools
- replace workflow engines

---

## 10. Summary

FlowDesk transforms systems from:

```text
State → Unknown Origin
```

to:

```text
State → Traceable Decision → Explainable Outcome
```

---

## 11. Next Documents

- `c4-context.md` → system in its environment
- `c4-container.md` → containers & services
- `decision-lifecycle.md` → core differentiator
- `domain-model.md` → entities & relationships

---
