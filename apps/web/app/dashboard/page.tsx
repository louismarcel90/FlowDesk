'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { pill } from '../decisions/page';

export default function DashboardPage() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [initiatives, setInitiatives] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([apiFetch('/decisions'), apiFetch('/impact/initiatives'), apiFetch('/impact/metrics')])
      .then(([d, i, m]) => {
        setDecisions(d);
        setInitiatives(i);
        setMetrics(m);
      })
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  return (
    <main style={{ display: 'grid', gap: 18 }}>
      <h1>Dashboard</h1>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
        <h2>Recent Decisions</h2>
        <ul>
          {decisions.slice(0, 8).map((d) => (
            <li key={d.id}><a href={`/decisions/${d.id}`}>{d.title}</a> — <span className={pill(d.status)}>{d.status}</span></li>
          ))}
        </ul>
      </section>

      <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
        <h2>Initiatives</h2>
        <ul>
          {initiatives.slice(0, 8).map((x) => (
            <li key={x.id}><a href={`/initiatives/${x.id}`}>{x.name}</a> — {x.status}</li>
          ))}
        </ul>
      </section>

      <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
        <h2>Metrics</h2>
        <ul>
          {metrics.slice(0, 8).map((m) => (
            <li key={m.id}><a href={`/metrics/${m.id}`}>{m.name} ({m.unit})</a> — direction: {m.direction}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
