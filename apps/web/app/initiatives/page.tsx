// 'use client';

// import { useEffect, useState } from 'react';
// import { apiFetch } from '../../lib/api';

// export default function InitiativesPage() {
//   const [items, setItems] = useState<any[]>([]);
//   const [error, setError] = useState('');
//   const [name, setName] = useState('Reduce decision latency');
//   const [description, setDescription] = useState('Improve decision clarity and reduce rework.');

//   async function load() {
//     const res = await apiFetch('/impact/initiatives');
//     setItems(res);
//   }

//   useEffect(() => {
//     load().catch((e) => setError(String(e.message ?? e)));
//   }, []);

//   async function create() {
//     setError('');
//     try {
//       await apiFetch('/impact/initiatives', {
//         method: 'POST',
//         body: JSON.stringify({ name, description, status: 'active' })
//       });
//       await load();
//     } catch (e: any) {
//       setError(String(e.message ?? e));
//     }
//   }

//   return (
//     <main style={{ display: 'grid', gap: 16 }}>
//       <h1>Initiatives</h1>

//       <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, display: 'grid', gap: 8 }}>
//         <h2>Create Initiative</h2>
//         <input value={name} onChange={(e) => setName(e.target.value)} />
//         <input value={description} onChange={(e) => setDescription(e.target.value)} />
//         <button onClick={create}>Create</button>
//         {error && <p style={{ color: 'crimson' }}>{error}</p>}
//       </section>

//       <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
//         <h2>List</h2>
//         <ul>
//           {items.map((i) => (
//             <li key={i.id}>
//               <a href={`/initiatives/${i.id}`}>{i.name}</a> — {i.status}
//             </li>
//           ))}
//         </ul>
//       </section>
//     </main>
//   );
// }



'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../lib/api';

type Initiative = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  createdAt?: string;
};

function formatDate(d?: string) {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleString();
}

export default function InitiativesPage() {
  const [items, setItems] = useState<Initiative[]>([]);
  const [error, setError] = useState('');
  const [loadingList, setLoadingList] = useState(true);

  const [name, setName] = useState('Reduce decision latency');
  const [description, setDescription] = useState(
    'Improve decision clarity and reduce rework.'
  );

  const [creating, setCreating] = useState(false);
  const [createdToast, setCreatedToast] = useState<string>('');

  const canSubmit = useMemo(() => {
    const n = name.trim();
    const d = description.trim();
    return n.length >= 3 && d.length >= 10 && !creating;
  }, [name, description, creating]);

  async function load() {
    setError('');
    setLoadingList(true);
    try {
      const res = await apiFetch<Initiative[]>('/impact/initiatives');
      setItems(Array.isArray(res) ? res : []);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create() {
    setError('');
    setCreatedToast('');
    const payload = {
      name: name.trim(),
      description: description.trim(),
      status: 'active',
    };

    try {
      setCreating(true);
      await apiFetch('/impact/initiatives', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setCreatedToast('Initiative created ✅');
      // Refresh list
      await load();
      // Optional: clear form or keep values
      // setName('');
      // setDescription('');
      window.setTimeout(() => setCreatedToast(''), 2500);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setCreating(false);
    }
  }

  function reset() {
    setError('');
    setCreatedToast('');
    setName('Reduce decision latency');
    setDescription('Improve decision clarity and reduce rework.');
  }

  return (
    <main className="fd-page">
      <header className="fd-page-header">
        <div className="fd-page-title">
          <h1>Initiatives</h1>
          <p className="fd-page-subtitle">
            Create initiatives to track impact and keep delivery aligned.
          </p>
        </div>

        {/* <div className="fd-page-actions">
          <button className="fd-btn" type="button" onClick={load} disabled={loadingList}>
            {loadingList ? 'Refreshing…' : 'Refresh'}
          </button>
        </div> */}
      </header>

      {(error || createdToast) && (
        <div className="fd-stack" style={{ gap: 10 }}>
          {error && <div className="fd-alert fd-alert--danger">{error}</div>}
          {createdToast && <div className="fd-alert fd-alert--success">{createdToast}</div>}
        </div>
      )}

      <section className="fd-card fd-card--elevated">
        <div className="fd-card-header">
          <div>
            <div className="fd-card-title">Create initiative</div>
            <div className="fd-card-subtitle">
              Provide a clear name + description. Status defaults to <b>active</b>.
            </div>
          </div>

          <div className="fd-row" style={{ gap: 10 }}>
            <button className="fd-btn" type="button" onClick={reset} disabled={creating}>
              Reset
            </button>
            <button
              className="fd-btn fd-btn--primary"
              type="button"
              onClick={create}
              disabled={!canSubmit}
              aria-disabled={!canSubmit}
              title={!canSubmit ? 'Name ≥ 3 chars, description ≥ 10 chars' : 'Create initiative'}
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>

        <div className="fd-card-inner">
          <div className="fd-form-grid">
            <div className="fd-field">
              <label className="fd-label" htmlFor="initiative-name">
                Name <span className="fd-required">*</span>
              </label>
              <input
                id="initiative-name"
                className="fd-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Reduce decision latency"
                autoComplete="off"
              />
              <div className="fd-help">
                Minimum 3 characters. Make it action-oriented.
              </div>
            </div>

            <div className="fd-field">
              <label className="fd-label" htmlFor="initiative-desc">
                Description <span className="fd-required">*</span>
              </label>
              <textarea
                id="initiative-desc"
                className="fd-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is the goal? Why does it matter? What changes?"
                rows={4}
              />
              <div className="fd-help">Minimum 10 characters.</div>
            </div>

            <div className="fd-field">
              <label className="fd-label">Status</label>
              <div className="fd-pill fd-pill--success">active</div>
              <div className="fd-help">
                You can extend this later with draft/paused/completed.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fd-card">
        <div className="fd-card-header">
          <div>
            <div className="fd-card-title">List</div>
            <div className="fd-card-subtitle">
              {loadingList ? 'Loading initiatives…' : `${items.length} initiative(s)`}
            </div>
          </div>
        </div>

        <div className="fd-card-inner">
          {loadingList ? (
            <div className="fd-skeleton-list">
              <div className="fd-skeleton" />
              <div className="fd-skeleton" />
              <div className="fd-skeleton" />
            </div>
          ) : items.length === 0 ? (
            <div className="fd-empty">
              <div className="fd-empty-title">No initiatives yet</div>
              <div className="fd-empty-subtitle">
                Create your first initiative above.
              </div>
            </div>
          ) : (
            <ul className="fd-list">
              {items.map((i) => (
                <li key={i.id} className="fd-list-item">
                  <div className="fd-list-main">
                    <a className="fd-item-title" href={`/initiatives/${i.id}`}>
                      {i.name}
                    </a>
                    {i.description ? (
                      <div className="fd-item-subtitle">{i.description}</div>
                    ) : null}
                    <div className="fd-item-meta">
                      <span className="fd-chip">{i.id}</span>
                      {i.createdAt ? (
                        <span className="fd-meta">
                          Created {formatDate(i.createdAt)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="fd-list-side">
                    <span className="fd-pill fd-pill--success">{i.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
