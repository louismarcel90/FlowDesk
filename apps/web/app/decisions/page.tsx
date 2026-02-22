'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

export function pill(status: string) {
  if (status === 'approved') return 'fd-pill fd-pill--success';
  if (status === 'draft') return 'fd-pill';
  return 'fd-pill fd-pill--warn';
}

export default function DecisionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/decisions')
      .then(setItems)
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  return (
    <main className="fd-grid">
      <div className="fd-spread">
        <h1>Decisions</h1>
         <a href="/decisions/new" className="fd-btn fd-btn--primary" >
          Create decision
        </a>
        {/* <a className="fd-btn fd-btn--primary" href="/dashboard">Dashboard</a> */}
      </div>

      {error && <div className="fd-card"><div className="fd-card-inner" style={{ color: 'var(--danger)' }}>{error}</div></div>}
      
      

      <ul className="fd-list">
        {items.map((d) => (
          <li key={d.id} className="fd-item">
            <div className="fd-item-title">
              <a href={`/decisions/${d.id}`}>{d.title}</a>
              <span className={pill(d.status)}>{d.status}</span>
            </div>
            <div className="fd-item-meta">
              Created: {new Date(d.createdAt).toLocaleString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
