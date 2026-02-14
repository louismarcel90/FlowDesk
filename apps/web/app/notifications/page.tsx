'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  async function load(cursor?: string) {
    const q = new URLSearchParams();
    q.set('limit', '30');
    if (cursor) q.set('cursor', cursor);

    const res = await apiFetch(`/notifications/inbox?${q.toString()}`);
    setNextCursor(res.nextCursor);
    if (!cursor) setItems(res.items);
    else setItems((prev) => [...prev, ...res.items]);
  }

  useEffect(() => {
    load().catch((e) => setError(String(e.message ?? e)));
  }, []);

  async function markRead(id: string) {
    await apiFetch(`/notifications/${id}/read`, { method: 'POST' });
    await load();
  }

  async function markAll() {
    await apiFetch('/notifications/read-all', { method: 'POST' });
    await load();
  }

  return (
    <main style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Notifications</h1>
        <button onClick={markAll}>Mark all as read</button>
      </div>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <ul style={{ display: 'grid', gap: 10 }}>
        {items.map((n) => (
          <li
            key={n.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 10,
              padding: 12,
              background: n.read_at ? 'white' : '#fff7f7'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'grid', gap: 4 }}>
                <strong>{n.title}</strong>
                <div style={{ opacity: 0.8 }}>{n.body}</div>
                <small style={{ opacity: 0.7 }}>{new Date(n.created_at).toLocaleString()}</small>

                {n.entity_type && n.entity_id && (
                  <a href={`/${n.entity_type === 'decision' ? 'decisions' : n.entity_type + 's'}/${n.entity_id}`}>
                    Open related {n.entity_type}
                  </a>
                )}
              </div>

              {!n.read_at && <button onClick={() => markRead(n.id)}>Mark read</button>}
            </div>
          </li>
        ))}
      </ul>

      {nextCursor && (
        <button onClick={() => load(nextCursor)} style={{ justifySelf: 'start' }}>
          Load more
        </button>
      )}
    </main>
  );
}
