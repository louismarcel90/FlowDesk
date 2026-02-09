'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib/api';

export default function DecisionDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    apiFetch(`/decisions/${params.id}`)
      .then(setData)
      .catch((e) => setError(String(e.message ?? e)));
  }, [params.id]);

  async function approve() {
    await apiFetch(`/decisions/${params.id}/approve`, { method: 'POST' });
    const refreshed = await apiFetch(`/decisions/${params.id}`);
    setData(refreshed);
  }

  async function addComment() {
    await apiFetch(`/decisions/${params.id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: comment })
    });
    setComment('');
    const refreshed = await apiFetch(`/decisions/${params.id}`);
    setData(refreshed);
  }

  if (error) return <main><p style={{ color: 'crimson' }}>{error}</p></main>;
  if (!data) return <main><p>Loading...</p></main>;

  return (
    <main style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>{data.decision.title}</h1>
        <span>{data.decision.status}</span>
      </div>

      <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
        <h2>Versions</h2>
        <ol>
          {data.versions.map((v: any) => (
            <li key={v.id}>
              v{v.version} — {new Date(v.created_at).toLocaleString()}
            </li>
          ))}
        </ol>
      </section>

      <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
        <h2>Comments</h2>
        <ul>
          {data.comments.map((c: any) => (
            <li key={c.id}>
              <small>{new Date(c.created_at).toLocaleString()}</small>
              <div>{c.body}</div>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input value={comment} onChange={(e) => setComment(e.target.value)} style={{ flex: 1 }} />
          <button onClick={addComment}>Add</button>
        </div>
      </section>

      <button onClick={approve}>Approve</button>
    </main>
  );
}
