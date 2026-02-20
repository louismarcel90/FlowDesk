export default function HomePage() {
  return (
    <main className="fd-grid">
      <section className="fd-hero fd-stack">
        <h1>FlowDesk</h1>
        <p>
          Decision Intelligence & Governance Platform — decisions, traceability, measurable impact.
        </p>

        <div className="fd-row fd-wrap">
          <a className="fd-btn fd-btn--primary" href="/dashboard">
            Open Dashboard
          </a>
          <a className="fd-btn" href="/initiatives">
            Initiatives
          </a>
          <a className="fd-btn" href="/decisions">
            Decisions
          </a>
          {/* <a className="fd-btn" href="/initiatives">
            Initiatives
          </a>    */}
          <a className="fd-btn" href="/ops/notifications">
            Ops    
          </a> 
        </div>
      </section>

      <section className="fd-kpis">
        <div className="fd-kpi">
          <strong>Decision Traceability</strong>
          <small>Every decision has context, options, tradeoffs, and version history.</small>
        </div>
        <div className="fd-kpi">
          <strong>Audit-first</strong>
          <small>Critical actions are logged with correlation IDs for compliance & debugging.</small>
        </div>
        <div className="fd-kpi">
          <strong>Event-driven</strong>
          <small>Notifications follow a golden path: emit → orchestrate → deliver → audit.</small>
        </div>
      </section>
    </main>
  );
}
