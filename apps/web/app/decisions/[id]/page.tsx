'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '../../../lib/api';

export default function DecisionDetailPage() {
  const params = useParams<{ id: string }>();

  const decisionId = useMemo(() => {
    const raw = params?.id;
    if (!raw) return '';
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!decisionId) return;

    apiFetch(`/decisions/${decisionId}`)
      .then(setData)
      .catch((e) => setError(String(e?.message ?? e)));
  }, [decisionId]);

  async function approve() {
    if (!decisionId) return;
    await apiFetch(`/decisions/${decisionId}/approve`, {
      method: 'POST',
      body: JSON.stringify({}), 
    
    });
    const refreshed = await apiFetch(`/decisions/${decisionId}`);
    setData(refreshed);
  }

  async function addComment() {
    if (!decisionId) return;
    await apiFetch(`/decisions/${decisionId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: comment }),
    });
    setComment('');
    const refreshed = await apiFetch(`/decisions/${decisionId}`);
    setData(refreshed);
  }

  if (error)
    return (
      <main>
        <p style={{ color: 'crimson' }}>{error}</p>
      </main>
    );
  if (!data)
    return (
      <main>
        <p>Loading...</p>
      </main>
    );

  return (
    <main style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>{data.decision.title}</h1>
        <span>{data.decision.status}</span>
      </div>

      <section
        style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}
      >
        <h2>Versions</h2>
        <ol>
          {data.versions.map((v: any) => (
            <li key={v.id}>
              v{v.version} — {new Date(v.createdAt)
              .toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })}
            </li>
          ))}
        </ol>
      </section>

      <section
        style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}
      >
        <h2>Comments</h2>
        <ul>
          {data.comments.map((c: any) => (
            <li key={c.id}>
              <small>{new Date(c.createdAt)
              .toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })}</small>
              <div>{c.body}</div>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ flex: 1 }}
          />
          <button onClick={addComment}>Add</button>
        </div>
      </section>

      <button onClick={approve}>Approve</button>
    </main>
  );
}
