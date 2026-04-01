# 🧠 FlowDesk — C4 Model — Level 2 (Container Diagram)

---

## 1. Purpose

This diagram shows the **internal containers of FlowDesk**, their responsibilities, and how they communicate.

It answers:

- What are the main building blocks?
- How do they interact?
- Where does logic live?

---

## 2. Container Diagram

```text id="k9s1fj"
                 ┌──────────────────────────────┐
                 │        Frontend App          │
                 │ (Next.js / React UI)         │
                 └──────────────┬───────────────┘
                                │ HTTP / WS
                                ▼
                 ┌──────────────────────────────┐
                 │        API Gateway           │
                 │ (REST / GraphQL)             │
                 └──────────────┬───────────────┘
                                │
     ┌──────────────────────────┼──────────────────────────┐
     ▼                          ▼                          ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│ Decision     │        │ Initiative   │        │ Metrics      │
│ Service      │        │ Service      │        │ Service      │
└──────┬───────┘        └──────┬───────┘        └──────┬───────┘
       │                       │                       │
       └──────────────┬────────┴──────────────┬────────┘
                      ▼                       ▼
            ┌──────────────────────────────┐
            │        Domain Engine         │
            │ (Validation / Rules)         │
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │        Event Store           │
            │ (Append-only DB)             │
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │    Read Models / Projections │
            │ (Optimized Queries)          │
            └──────────────────────────────┘
```

---

## 3. Containers Description

---

### 3.1 Frontend App

**Tech:**

- Next.js
- React
- WebSocket / SSE

**Responsibilities:**

- decision exploration
- metrics visualization
- traceability UI

**Important Rule:**
👉 Thin UI — no business logic

---

### 3.2 API Gateway

**Tech:**

- Node.js (NestJS / Express)

**Responsibilities:**

- request routing
- authentication enforcement
- input validation
- API contract boundary

---

### 3.3 Decision Service

**Responsibilities:**

- create/update decisions
- manage decision lifecycle
- link decisions to metrics

**Key Concept:**
👉 Decision = aggregate root

---

### 3.4 Initiative Service

**Responsibilities:**

- track execution layer
- connect decisions → actions

---

### 3.5 Metrics Service

**Responsibilities:**

- ingest metrics from external systems
- normalize data
- expose queryable metrics

---

### 3.6 Domain Engine (CRITICAL)

**Responsibilities:**

- enforce business invariants
- validate decisions
- compute derived state

**Examples:**

- invalid decision transitions
- missing justification
- broken links

👉 This is where **the intelligence lives**

---

### 3.7 Event Store

**Tech:**

- PostgreSQL (append-only)
- or event streaming (Kafka)

**Responsibilities:**

- store all events
- ensure immutability
- provide full history

---

### 3.8 Read Models / Projections

**Tech:**

- PostgreSQL / Redis / Elastic

**Responsibilities:**

- fast queries
- UI-ready data
- denormalized views

---

## 4. Communication Patterns

---

### 4.1 Synchronous (API)

```text id="x2v7gk"
Frontend → API Gateway → Services
```

Used for:

- user actions
- queries

---

### 4.2 Asynchronous (Events)

```text id="6wkt0u"
Service → Event Store → Projection → UI
```

Used for:

- state propagation
- updates
- history

---

## 5. Data Flow Example (Decision Creation)

```text id="j84a2q"
User creates decision
        ↓
API Gateway
        ↓
Decision Service
        ↓
Domain Engine validation
        ↓
Event emitted (DecisionCreated)
        ↓
Event Store
        ↓
Projection updated
        ↓
UI refreshed
```

---

## 6. Key Architectural Decisions

---

### Separation of Concerns

- UI ≠ logic
- Services ≠ validation
- Write ≠ Read

---

### Event-Driven Core

- all changes are events
- enables replay + audit

---

### Central Domain Engine

- avoids logic duplication
- enforces consistency

---

## 7. Failure Modes (Staff-Level)

---

### 7.1 Event Store Down

- cannot write new decisions
- system becomes read-only

---

### 7.2 Projection Lag

- UI shows stale data
- eventual consistency gap

---

### 7.3 Metrics Delay

- incorrect decision evaluation

---

## 8. Scaling Strategy

---

### Horizontal Scaling

- stateless API Gateway
- independent services

---

### Data Scaling

- partition event store
- cache read models

---

### Team Scaling

- domain-based ownership
- independent deploys

---

## 9. Why This Architecture is Strong

It enables:

- auditability (event store)
- explainability (domain engine)
- performance (read models)
- scalability (service separation)

---

## 10. Summary

FlowDesk architecture follows:

```text id="p6z5wh"
Write → Validate → Event → Store → Project → Read
```

This ensures:

- no hidden state
- full traceability
- deterministic behavior

---

## 11. Next Step

- `c4-component.md` → internal structure of services
- `decision-lifecycle.md` → core business differentiator

---
