'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

export default function InitiativesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [name, setName] = useState('Reduce decision latency');
  const [description, setDescription] = useState('Improve decision clarity and reduce rework.');

  async function load() {
    const res = await apiFetch('/impact/initiatives');
    setItems(res);
  }

  useEffect(() => {
    load().catch((e) => setError(String(e.message ?? e)));
  }, []);

  async function create() {
    setError('');
    try {
      await apiFetch('/impact/initiatives', {
        method: 'POST',
        body: JSON.stringify({ name, description, status: 'active' })
      });
      await load();
    } catch (e: any) {
      setError(String(e.message ?? e));
    }
  }

  return (
    <main style={{ display: 'grid', gap: 16 }}>
      <h1>Initiatives</h1>

      <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, display: 'grid', gap: 8 }}>
        <h2>Create Initiative</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} />
        <button onClick={create}>Create</button>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </section>

      <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
        <h2>List</h2>
        <ul>
          {items.map((i) => (
            <li key={i.id}>
              <a href={`/impact/initiatives/${i.id}`}>{i.name}</a> — {i.status}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
