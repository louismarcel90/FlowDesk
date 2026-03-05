'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { Decision } from '../../../api/src/modules/decisions/decisions.types';
import Link from 'next/link';

type Initiative = {
  id: string;
  name: string;
  description?: string | null;
  linkedDecisionsCount?: number;
  status: string;
  createdAt?: string;
  decision?: Decision; // (ton modèle actuel montre 1 decision)
};

type DecisionSearchItem = Pick<Decision, 'id' | 'title' | 'status'>;

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

  // ---------- NEW: local selected decision for the CREATE form ----------
  const [selectedDecision, setSelectedDecision] =
    useState<DecisionSearchItem | null>(null);

  // ---------- NEW: link decision modal state (shared for create + list) ----------
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkMode, setLinkMode] = useState<'create' | 'link-existing'>(
    'create',
  );
  const [linkInitiativeId, setLinkInitiativeId] = useState<string | null>(null);

  // modal search state
  const [decisionQ, setDecisionQ] = useState('');
  const [decisionResults, setDecisionResults] = useState<DecisionSearchItem[]>(
    [],
  );
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionError, setDecisionError] = useState('');
  const [showDecisionPicker, setShowDecisionPicker] = useState(false);

  const DECISIONS_SEARCH_URL = (q: string) =>
    `/impact/decisions?q=${encodeURIComponent(q)}`;

  useEffect(() => {
    if (!showDecisionPicker) return;

    const q = decisionQ.trim();
    if (q.length === 0) {
      setDecisionResults([]);
      setDecisionError('');
      return;
    }

    const t = window.setTimeout(async () => {
      setDecisionLoading(true);
      setDecisionError('');
      try {
        // ton backend peut renvoyer { items } ou directement un tableau
        const res: any = await apiFetch(DECISIONS_SEARCH_URL(q));
        const items = Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
            ? res.items
            : [];
        setDecisionResults(items);
      } catch (e: any) {
        setDecisionError(String(e?.message ?? e));
        setDecisionResults([]);
      } finally {
        setDecisionLoading(false);
      }
    }, 150); // 150–250ms = bon feeling

    return () => window.clearTimeout(t);
  }, [decisionQ, showDecisionPicker]);

  function pickDecision(d: DecisionSearchItem) {
    setSelectedDecision(d);
    setShowDecisionPicker(false);
    setDecisionQ('');
    setDecisionResults([]);
  }

  function clearDecision() {
    setSelectedDecision(null);
    setDecisionQ('');
    setDecisionResults([]);
  }

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

    const payload: any = {
      name: name.trim(),
      description: description.trim(),
      status: 'active',
    };

    // NEW: include decisionId if selected
    if (selectedDecision?.id) payload.decisionId = selectedDecision.id;

    try {
      setCreating(true);
      await apiFetch('/impact/initiatives', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setCreatedToast('Initiative created ✅');
      await load();

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
    setSelectedDecision(null); // NEW
  }

  // -------------------- NEW: modal open helpers --------------------
  function openLinkForCreate() {
    setDecisionError('');
    setDecisionQ('');
    setDecisionResults([]);
    setLinkMode('create');
    setLinkInitiativeId(null);
    setLinkOpen(true);
  }

  function openLinkForExisting(initiativeId: string) {
    setDecisionError('');
    setDecisionQ('');
    setDecisionResults([]);
    setLinkMode('link-existing');
    setLinkInitiativeId(initiativeId);
    setLinkOpen(true);
  }

  // -------------------- NEW: decision search --------------------
  async function searchDecisions() {
    setDecisionError('');
    setDecisionLoading(true);
    try {
      const res = await apiFetch<{ items: DecisionSearchItem[] }>(
        `/impact/decisions?search=${encodeURIComponent(decisionQ.trim())}`,
      );
      setDecisionResults(Array.isArray(res?.items) ? res.items : []);
    } catch (e: any) {
      setDecisionError(String(e?.message ?? e));
    } finally {
      setDecisionLoading(false);
    }
  }

  // -------------------- NEW: confirm selection from modal --------------------
  async function confirmLinkDecision(d: DecisionSearchItem) {
    setDecisionError('');

    // Mode 1: for CREATE form (just set local selection)
    if (linkMode === 'create') {
      setSelectedDecision(d);
      setLinkOpen(false);
      return;
    }

    // Mode 2: link to an existing initiative
    if (!linkInitiativeId) {
      setDecisionError('Missing initiative id.');
      return;
    }

    try {
      setDecisionLoading(true);

      await apiFetch(`/impact/initiatives/${linkInitiativeId}/links`, {
        method: 'POST',
        body: JSON.stringify({ decisionId: d.id }),
      });

      setLinkOpen(false);
      await load();
      setCreatedToast('Decision linked ✅');
      window.setTimeout(() => setCreatedToast(''), 2500);
    } catch (e: any) {
      setDecisionError(String(e?.message ?? e));
    } finally {
      setDecisionLoading(false);
    }
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
          {createdToast && (
            <div className="fd-alert fd-alert--success">{createdToast}</div>
          )}
        </div>
      )}

      {/* ---------------- CREATE FORM ---------------- */}
      <section className="fd-card fd-card--elevated">
        <div className="fd-card-header">
          <div>
            <div className="fd-card-title">Create initiative</div>
            <div className="fd-card-subtitle">
              Provide a clear name + description. Status defaults to{' '}
              <b>active</b>.
            </div>
          </div>

          <div className="fd-row" style={{ gap: 10 }}>
            <button
              className="fd-btn"
              type="button"
              onClick={reset}
              disabled={creating}
            >
              Reset
            </button>

            <button
              className="fd-btn fd-btn--primary"
              type="button"
              onClick={create}
              disabled={!canSubmit}
              aria-disabled={!canSubmit}
              title={
                !canSubmit
                  ? 'Name ≥ 3 chars, description ≥ 10 chars'
                  : 'Create initiative'
              }
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

            {/* ----------- LINKED DECISION (INLINE LIVE SEARCH) ----------- */}
            <div className="fd-field">
              {/* Label replaced by selected decision title */}
              <label className="fd-label">
                {selectedDecision
                  ? (selectedDecision.title ?? selectedDecision.id)
                  : 'Linked decision'}
              </label>

              {/* If selected => show chip + actions */}
              {selectedDecision ? (
                <div
                  className="fd-row"
                  style={{ gap: 10, alignItems: 'center' }}
                >
                  <span className="fd-chip">
                    {selectedDecision.title ?? selectedDecision.id}
                  </span>

                  <button
                    className="fd-btn"
                    type="button"
                    onClick={() => {
                      // clearDecision()
                      setSelectedDecision(null);
                      setShowDecisionPicker(false);
                      setDecisionQ('');
                      setDecisionResults([]);
                    }}
                    disabled={creating}
                    title="Remove linked decision"
                  >
                    Remove
                  </button>

                  <button
                    className="fd-btn"
                    type="button"
                    onClick={() => {
                      setShowDecisionPicker(true);
                      // optional: focus is handled by autoFocus on input below
                    }}
                    disabled={creating}
                    title="Change decision"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className="fd-row"
                    style={{ gap: 10, alignItems: 'center' }}
                  >
                    <div className="fd-help" style={{ margin: 0 }}>
                      No decision linked yet.
                    </div>

                    <button
                      className="fd-btn"
                      type="button"
                      onClick={() => {
                        setShowDecisionPicker((v) => !v);
                        setDecisionError('');
                        setDecisionResults([]);
                        // keep decisionQ as-is or reset:
                        // setDecisionQ('');
                      }}
                      disabled={creating}
                    >
                      Link Decision
                    </button>
                  </div>

                  {/* Inline search panel */}
                  {showDecisionPicker && (
                    <div
                      className="fd-stack"
                      style={{ gap: 10, marginTop: 10 }}
                    >
                      {decisionError && (
                        <div className="fd-alert fd-alert--danger">
                          {decisionError}
                        </div>
                      )}

                      <input
                        className="fd-input"
                        value={decisionQ}
                        onChange={(e) => setDecisionQ(e.target.value)}
                        placeholder="Search decisions…"
                        autoFocus
                      />

                      <div className="fd-help" style={{ marginTop: 0 }}>
                        Type to search — results update as you type.
                      </div>

                      <div className="fd-divider" />

                      {decisionLoading ? (
                        <div className="fd-muted">Searching…</div>
                      ) : decisionQ.trim().length === 0 ? (
                        <div className="fd-muted">
                          Start typing to see matches.
                        </div>
                      ) : decisionResults.length === 0 ? (
                        <div className="fd-muted">No matches.</div>
                      ) : (
                        <div className="fd-stack" style={{ gap: 8 }}>
                          {decisionResults.map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              className="fd-result-row"
                              style={{ textAlign: 'left', cursor: 'pointer' }}
                              onClick={() => {
                                // pickDecision(d)
                                setSelectedDecision(d);
                                setShowDecisionPicker(false);
                                setDecisionQ('');
                                setDecisionResults([]);
                              }}
                            >
                              <div className="fd-result-main">
                                <div className="fd-result-title">
                                  {d.title ?? d.id}
                                </div>
                                <div className="fd-result-sub">
                                  <span className="fd-chip">{d.id}</span>
                                  {d.status ? (
                                    <span
                                      className="fd-meta"
                                      style={{ marginLeft: 8 }}
                                    >
                                      {d.status}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="fd-help" style={{ marginTop: 10 }}>
                    Optional — link now, or later from the initiatives list.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- LIST ---------------- */}
      <section className="fd-card">
        <div className="fd-card-header">
          <div>
            <div className="fd-card-title">List</div>
            <div className="fd-card-subtitle">{items.length} initiative(s)</div>
          </div>
        </div>

        <div className="fd-card-inner">
          {loadingList ? (
            <div className="fd-muted">Loading…</div>
          ) : items.length === 0 ? (
            <div className="fd-muted">No initiatives yet.</div>
          ) : (
            <ul className="fd-list">
              {items.map((i) => (
                <li key={i.id ?? i.name} className="fd-list-item">
                  <div className="fd-list-main">
                    {i.id ? (
                      <Link
                        className="fd-item-title"
                        href={`/initiatives/${i.id}`}
                      >
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
                          {(i.linkedDecisionsCount ?? 0) > 0
                            ? `${i.linkedDecisionsCount} decision${
                                (i.linkedDecisionsCount ?? 0) > 1 ? 's' : ''
                              } linked`
                            : 'no decision linked'}{' '}
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

                  <div
                    className="fd-list-side"
                    style={{ display: 'flex', gap: 10, alignItems: 'center' }}
                  >
                    <Link
                      className="fd-pill"
                      href={`/initiatives/${i.id}/link-decision`}
                    >
                      Link decision
                    </Link>

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
