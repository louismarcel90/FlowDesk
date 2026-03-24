# FlowDesk — _Decision Intelligence & Governance Platform_

## 🧰 Technologies Used in Practice

<p align="left">
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/typescript/typescript-original.svg" width="40" height="40"/>
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original-wordmark.svg" width="40" height="40"/>
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nextjs/nextjs-original.svg" alt="nextjs" width="40" height="40"/>
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/tailwindcss/tailwindcss-original.svg" width="40" height="40"/>
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original-wordmark.svg" width="40" height="40"/>
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/postgresql/postgresql-original-wordmark.svg" width="40" height="40"/>
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/redis/redis-original-wordmark.svg" width="40" height="40"/>
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/docker/docker-original-wordmark.svg" width="40" height="40"/>
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/opentelemetry/opentelemetry-original.svg" width="40" height="40"/>
</p>

---

> Turning decisions into first-class citizens.

• Enterprise-grade decision system  
• Real-time governance & traceability  
• Built for clarity, not chaos

![node](https://img.shields.io/badge/node-%3E%3D18-green)
![license](https://img.shields.io/badge/license-MIT-blue)
![interface](https://img.shields.io/badge/interface-Web%20App-black)
![architecture](https://img.shields.io/badge/architecture-Event--Driven-purple)

---

## ⚡ Real World Scenario

Company X is scaling its platform.

Problems:

- Conflicting decisions
- Unclear ownership
- No traceability

FlowDesk enables:

- Decision tracking
- Impact visibility
- Alignment across teams

---

## 🧠 What is FlowDesk / Why It Exists

FlowDesk is a **decision intelligence platform** designed to bring **clarity, traceability, and governance** to complex systems.

Modern systems don’t fail because of code.  
They fail because of **unclear decisions, misalignment, and lack of visibility**.

FlowDesk solves this by making:

- Decisions **first-class objects**
- Initiatives **traceable to outcomes**
- Metrics **linked to real impact**

All powered by a **real-time system designed for clarity at scale**.

### This project is a representation of:

- Decision systems
- Governance platforms
- Real-time system thinking
- Enterprise architecture patterns

---

## 🧱 Core Capabilities

- 🧠 Decision lifecycle management (create → link → evaluate → resolve)
- 🔗 Initiative ↔ Decision ↔ Metric linking
- 📊 Real-time health scoring system
- 🔔 Notification system (event-driven)
- 📈 Metric snapshots & historical tracking
- 🧭 Governance visibility layer
- 🧾 Audit-ready system design
- ⚡ Deterministic state evolution
- 🧩 Modular domain architecture
- 🏆 Decision impact tracking

---

## ⚙️ System Architecture

```bash

       [ User / UI Layer ]
                │
                ▼
 +----------------------------------+
 |         FlowDesk Platform        |
 |  decision intelligence engine    |
 +----------------------------------+
                │
                ▼
 +----------------------------------+
 |        Application Layer         |
 | - decisions                      |
 | - initiatives                    |
 | - metrics                        |
 | - notifications                  |
 +----------------------------------+
                │
                ▼
 +----------------------------------+
 |        Domain Engine             |
 | - decision lifecycle             |
 | - linking engine                 |
 | - scoring engine                 |
 | - audit logic                    |
 +----------------------------------+
                │
                ▼
 +----------------------------------+
 |        Event System              |
 | - decision.created               |
 | - initiative.linked              |
 | - metric.updated                 |
 | - notification.triggered         |
 +----------------------------------+
                │
                ▼
 +----------------------------------+
 |        Data Layer                |
 | - PostgreSQL (core state)        |
 | - Redis (real-time / cache)      |
 | - Append-only audit logs         |
 +----------------------------------+

```

---

## 🏛️ Project Structure

```bash

flowdesk/
│
├── apps/
│   ├── web/                # Next.js frontend
│   └── api/                # Node.js backend
│
├── services/
│   ├── decision-service/
│   ├── initiative-service/
│   ├── metrics-service/
│   ├── notification-service/
│
├── packages/
│   ├── db/                 # Prisma / schema
│   ├── contracts/          # events & types
│   ├── ui-kit/             # design system
│   ├── observability/      # logs / metrics
│
├── docs/
│   ├── architecture.md
│   ├── adr/
│   ├── runbooks/
│
├── docker/
├── .github/
├── package.json
└── README.md

```

---

## 🚀 Getting Started

### 📦 1. Installation

#### 📋 Prerequisites

Make sure you have installed:

```bash

- Node.js >= 18
- pnpm (recommended) or npm
- Docker + Docker Compose
- Git

```

---

### ⚙️ 2. Clone & Install

```bash

git clone https://github.com/louismarcel90/flowdesk.git
cd flowdesk
pnpm install

```

---

### 🐳 3. Start Infrastructure

FlowDesk relies on local infrastructure services:

- PostgreSQL (core state)
- Redis (real-time + caching)

Start infra:

```bash

pnpm infra:up

```

👉 Alternative (if scripts not configured):

```bash

docker-compose up -d

```

Check running services:

```bash

pnpm infra:ps

```

Or:

```bash

docker ps

```

---

### 🔐 4. Push Policies

```bash

pnpm policy:push

```

---

### 🧬 5. Database Setup

Run migrations:

```bash

pnpm db:migrate

```

Typical variables:

```bash

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flowdesk
REDIS_URL=redis://localhost:6379
NODE_ENV=development

```

---

🧪 Run Tests

```bash

pnpm test

```

Note: API tests require infrastructure to be running.

---

### 🚀 6. Start Application

Start dev:

```bash

 pnpm -C apps/web dev

```

start api:

```bash

pnpm api:dev

```

---

### 🎬 7. Verify System

Open:

```bash

http://localhost:3000

```

API:

```bash

http://localhost:4000

```

---

## 📊 Example Output

DECISION RESOLVED

```bash

✔ Decision: Migrate to event-driven architecture
✔ Impact Score: +18%
✔ System Stability: Improved

RANKING:
1. Cost Optimization
2. Performance Gains
3. Reliability

```

---

## 🧭 Engineering Notes

- Decisions are immutable events
- State is derived, not mutated
- Audit is first-class (append-only)
- System is event-driven by design
- Deterministic flows enable predictability
- Observability is built-in, not added later

---

## 🧩 System Thinking

FlowDesk is not a CRUD app.

It is a system where:

- Decisions propagate impact
- State is derived from events
- Outcomes are measurable

---

## 🧭 Philosophy

Clarity scales. Chaos compounds.

FlowDesk exists to make decisions visible, traceable, and accountable.

---

## 🔮 Future Work

- Multi-tenant enterprise isolation
- Distributed event bus (Kafka / Redpanda)
- AI-assisted decision recommendations
- Real-time collaboration layer
- Advanced analytics dashboard
- External integrations (Slack / Jira / APIs)

---

## 👨‍💻 Author

Built with precision, systems thinking, and a performance-first mindset.

---

## ⭐ Support

If you find this project interesting:

- ⭐ Star the repository
- 🍴 Fork it
- 🧠 Explore the architecture

---

## 📄 License

MIT License
