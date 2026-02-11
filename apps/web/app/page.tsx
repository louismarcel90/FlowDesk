export default function HomePage() {
  return (
    <main style={{ display: 'grid', gap: 12 }}>
      <h1>FlowDesk</h1>
      <p>Decision Intelligence & Governance Platform — decisions, traceability, measurable impact.</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <a href="/dashboard">Dashboard</a>
        <a href="/initiatives">Initiatives</a>
        <a href="/decisions">Decisions</a>
      </div>
    </main>
  );
}
