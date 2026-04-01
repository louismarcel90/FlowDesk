# 🧠 FlowDesk — User Journeys

---

## 1. Purpose

Defines key user workflows in FlowDesk.

---

## 2. Journey 1 — Create Decision

---

### Steps

```text
User → Create Decision → Add Rationale → Link Metrics → Save Draft
```

---

### Outcome

- decision created in draft state

---

## 3. Journey 2 — Propose Decision

---

```text
Draft → Submit → Validation → Proposed
```

---

### Outcome

- ready for review

---

## 4. Journey 3 — Approve Decision

---

```text
Reviewer → Review → Approve → Event Emitted
```

---

### Outcome

- decision becomes active

---

## 5. Journey 4 — Track Decision Impact

---

```text
Decision → Metrics → Observed Outcome → Drift Detection
```

---

## 6. Journey 5 — Audit Decision

---

```text
User → View Decision → View Events → View Audit Trail
```

---

## 7. Staff-Level Insight

User journeys are not UI flows.

They are **system flows with business meaning**.

---
