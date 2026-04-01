# 🧠 FlowDesk — C4 Model — Level 1 (System Context)

---

## 1. Purpose

This diagram shows how **FlowDesk interacts with external systems, users, and environments**.

It answers:

- Who uses FlowDesk?
- What systems does it depend on?
- What data flows in and out?

---

## 2. System Context Diagram

```text
                   ┌──────────────────────────────┐
                   │        End Users             │
                   │ (Product, Ops, Leadership)   │
                   └──────────────┬───────────────┘
                                  │
                                  ▼
                        ┌────────────────────┐
                        │     FlowDesk       │
                        │ Decision System    │
                        └─────────┬──────────┘
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      ▼                           ▼                           ▼
┌──────────────┐        ┌────────────────┐        ┌────────────────┐
│ Auth System  │        │ Metrics Source │        │ Event Sources  │
│ (Auth.js /   │        │ (Databases,    │        │ (Services,     │
│  OAuth2)     │        │  Data Wareh.)  │        │  Kafka, etc.)  │
└──────────────┘        └────────────────┘        └────────────────┘

      ▼                           ▼                           ▼
┌──────────────┐        ┌────────────────┐        ┌────────────────┐
│ Notification │        │ BI / Analytics │        │ Audit Systems  │
│ Systems      │        │ Tools          │        │ (External)     │
│ (Email, Slack)│       │ (Looker, etc.) │        │                │
└──────────────┘        └────────────────┘        └────────────────┘
```

---

## 3. Actors

### 3.1 Product Managers

- Define decisions
- Link decisions to initiatives
- Analyze impact

---

### 3.2 Operations / Analysts

- Monitor metrics
- Investigate anomalies
- Trace decisions

---

### 3.3 Leadership

- Validate strategic alignment
- Ensure accountability
- Audit decisions

---

## 4. External Systems

---

### 4.1 Authentication System

**Examples:**

- Auth.js
- OAuth2 provider
- Keycloak

**Role:**

- user identity
- access control

---

### 4.2 Metrics Sources

**Examples:**

- PostgreSQL
- ClickHouse
- Data warehouses

**Role:**

- provide observable system state
- feed decision validation

---

### 4.3 Event Sources

**Examples:**

- Kafka / Redpanda
- backend services

**Role:**

- emit real-world changes
- drive system context

---

### 4.4 Notification Systems

**Examples:**

- Slack
- Email

**Role:**

- notify decision updates
- alert anomalies

---

### 4.5 BI / Analytics Tools

**Examples:**

- Looker
- Tableau

**Role:**

- consume FlowDesk insights
- visualize decision impact

---

### 4.6 External Audit Systems

**Role:**

- receive audit logs
- validate compliance

---

## 5. Data Flow (High-Level)

```text
External Systems → FlowDesk → Users
        ↑              ↓
   Events/Metrics   Insights/Decisions
```

---

## 6. Key Insight (Staff-Level)

FlowDesk sits between:

```text
Reality (events, metrics)
        ↓
FlowDesk (decisions, reasoning)
        ↓
Humans (understanding, governance)
```

---

## 7. System Responsibility

FlowDesk is responsible for:

- structuring decisions
- linking decisions to outcomes
- making causality observable
- enabling auditability

---

## 8. What FlowDesk DOES NOT Do

- does not generate metrics
- does not execute business logic
- does not replace data warehouses

---

## 9. Boundary Definition

FlowDesk is a:

👉 **Decision Intelligence Boundary**

It translates:

```text
Raw Data → Structured Decisions → Explainable Outcomes
```

---

## 10. Risks at This Level

- dependency on external data quality
- delayed or missing events
- inconsistent metric definitions

---

## 11. Summary

FlowDesk is positioned as:

```text
The missing layer between data and understanding
```

It transforms:

```text
Data → Insight → Decision → Traceability
```

---
