export default function AboutPage() {
  return (
    <main className="fd-grid">
      <section className="fd-hero fd-stack">
        <h1>About FlowDesk</h1>
        <p>
          FlowDesk is a Decision Intelligence & Governance platform that treats decisions as long-lived
          system artifacts — not disposable documents. We capture context, options, trade-offs, and outcomes,
          then connect them to measurable impact over time.
        </p>

        <div className="fd-row fd-wrap">
          <span className="fd-pill">Decision Traceability</span>
          <span className="fd-pill">Audit-first</span>
          <span className="fd-pill">Policy-as-Code</span>
          <span className="fd-pill">Event-driven</span>
          <span className="fd-pill">Enterprise-ready</span>
        </div>
      </section>

      <section className="fd-card">
        <div className="fd-card-header">
          <div>
            <div className="fd-card-title">Why it exists</div>
            <div className="fd-card-subtitle">Stop decision loss. Stop rework. Scale alignment.</div>
          </div>
        </div>

        <div className="fd-card-inner fd-stack">
          <p>
            Organizations scale faster than their decision systems. FlowDesk prevents knowledge decay by making
            decision rationale durable, searchable, and auditable — reducing misalignment and repeated mistakes.
          </p>

          <div className="fd-kpis">
            <div className="fd-kpi">
              <strong>Clarity</strong>
              <small>Decisions structured with context, owners, and measurable expectations.</small>
            </div>
            <div className="fd-kpi">
              <strong>Accountability</strong>
              <small>Audit trails, change history, and governance rules built in.</small>
            </div>
            <div className="fd-kpi">
              <strong>Impact</strong>
              <small>Link decisions to initiatives and metrics to learn over time.</small>
            </div>
          </div>
        </div>
      </section>

      <section className="fd-card">
        <div className="fd-card-header">
          <div>
            <div className="fd-card-title">What makes it different</div>
            <div className="fd-card-subtitle">Not “docs”, a real decision operating system.</div>
          </div>
        </div>

        <div className="fd-card-inner">
          <ul className="fd-list">
            <li className="fd-item">
              <div className="fd-item-title">Decisions as first-class entities</div>
              <div className="fd-item-meta">
                Structured schema, lifecycle states, ownership, and versioning — designed for long-lived reasoning.
              </div>
            </li>
            <li className="fd-item">
              <div className="fd-item-title">Policy-as-Code governance</div>
              <div className="fd-item-meta">
                Authorization and governance rules evaluated consistently via OPA, with explainable outcomes.
              </div>
            </li>
            <li className="fd-item">
              <div className="fd-item-title">Event-driven reliability</div>
              <div className="fd-item-meta">
                Notifications follow a golden path (emit → orchestrate → deliver → audit) with idempotency and DLQ.
              </div>
            </li>
            <li className="fd-item">
              <div className="fd-item-title">Operational maturity</div>
              <div className="fd-item-meta">
                Health endpoints, metrics, audit logs, and runbooks — built to run like a real company.
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* <section className="fd-row fd-wrap">
        <a className="fd-btn fd-btn--primary" href="/dashboard">
          Open Dashboard
        </a>
        <a className="fd-btn" href="/contact">
          Contact Us
        </a>
        <a className="fd-btn fd-btn--ghost" href="/notifications">
          Notifications
        </a>
      </section> */}
    </main>
  );
}