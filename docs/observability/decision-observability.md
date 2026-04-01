# 🧠 FlowDesk — Decision Observability

---

## 1. Purpose

This document defines how FlowDesk observes **decisions as first-class system signals**.

---

## 2. Core Principle

Most systems observe infrastructure.

FlowDesk observes:

```text
Decisions → Impact → Validity
```

---

## 3. Decision Signals

---

### Lifecycle Signals

- decisions created
- decisions approved
- decisions deprecated

---

### Quality Signals

- missing rationale
- incomplete decisions

---

### Impact Signals

- metric changes after decision
- success / failure of decision

---

## 4. Decision Drift Detection

```text
Expected Outcome ≠ Observed Outcome
```

---

### Example

- expected: +10%
- actual: -3%

→ trigger alert

---

## 5. Decision Health

Each decision has a health state:

- healthy
- degraded
- invalid

---

## 6. Alerts

---

### Examples

- decision drift detected
- missing metric linkage
- stale decision

---

## 7. Dashboards

- decision lifecycle
- impact tracking
- governance quality

---

## 8. Staff-Level Insight

Traditional observability:

```text
Is the system working?
```

FlowDesk observability:

```text
Are the decisions working?
```

---
