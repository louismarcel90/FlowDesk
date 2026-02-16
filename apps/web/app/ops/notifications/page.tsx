'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib/api';

export default function OpsNotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await apiFetch('/admin/notifications/dlq?limit=50');
    setItems(res);
  }

  useEffect(() => {
    load().catch((e) => setError(String(e.message ?? e)));
  }, []);

  async function reprocess(id: string) {
    setBusyId(id);
    setError('');
    try {
      await apiFetch(`/admin/notifications/dlq/${id}/reprocess`, { method: 'POST' });
      await load();
    } catch (e: any) {
      setError(String(e.message ?? e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main style={{ display: 'grid', gap: 16 }}>
      <h1>Ops — Notification DLQ</h1>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <ul style={{ display: 'grid', gap: 10 }}>
        {items.map((x) => (
          <li key={x.id} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'grid', gap: 4 }}>
                <strong>{x.channel}</strong>
                <div><b>Reason:</b> {x.reason}</div>
                <small style={{ opacity: 0.7 }}>
                  {new Date(x.created_at).toLocaleString()} — reprocessed: {x.reprocessed_at ? 'yes' : 'no'}
                </small>
              </div>

              <button disabled={busyId === x.id} onClick={() => reprocess(x.id)}>
                {busyId === x.id ? '...' : 'Reprocess'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
