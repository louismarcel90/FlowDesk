'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

export default function DecisionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('flowdesk_access_token');
    console.log('[Decisions] token =', token);

    if (!token) {
      setError('Not authenticated, please login.');
      return;
    }

    apiFetch('/decisions')
      .then(setItems)
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  return (
    <main>
      <h1>Decisions</h1>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <ul style={{ display: 'grid', gap: 8 }}>
        {items.map((d) => (
          <li
            key={d.id}
            style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <a href={`/decisions/${d.id}`}>{d.title}</a>
              <span>{d.status}</span>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
