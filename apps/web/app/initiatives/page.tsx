'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { Decision } from '../../../api/src/modules/decisions/decisions.types';
import Link from 'next/link';

type Initiative = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  createdAt?: string;
  decision?: Decision
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

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

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
    setName('');
    setDescription('');
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
                <li key={i.id ?? i.name} className="fd-list-item">
                  <div className="fd-list-main">
                    {i.id ? (
                      <Link className="fd-item-title" href={`/initiatives/${i.id}`}>
                        {i.name}
                      </Link>
                    ) : (
                      <span className="fd-item-title">{i.name}</span>
                  )}
                    {i.description ? (
                      <div className="fd-item-subtitle">{i.description}</div>
                    ) : null}
                    <div className="fd-item-meta">
                      <div>
                        <span className="fd-chip">{i.id}</span>
                      </div>
                      <div>
                        <span className="fd-meta">
                          {i.decision?.title ?? "no decision linked"}
                        </span>
                      </div>
                     {i.createdAt && (
                      <div>
                        <span className="fd-meta">
                          Created {formatDate(i.createdAt)}
                        </span>
                      </div>
                     )}     
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
