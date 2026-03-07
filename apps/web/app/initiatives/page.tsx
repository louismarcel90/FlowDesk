'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

import { apiFetch } from '../../lib/api';
import type { Decision } from '../../../api/src/modules/decisions/decisions.types';

type InitiativeStatus = 'planned' | 'active' | 'done';

const ALL_INITIATIVE_STATUSES: InitiativeStatus[] = [
  'planned',
  'active',
  'done',
];

const STATUS_LABEL: Record<InitiativeStatus, string> = {
  planned: 'planned',
  active: 'active',
  done: 'done',
};

type Initiative = {
  id: string;
  name: string;
  description?: string | null;
  linkedDecisionsCount?: number;
  status: InitiativeStatus;
  createdAt?: string;
  decision?: Decision | null;
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
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');
  const [createdToast, setCreatedToast] = useState<string>('');
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  async function load() {
    setError('');
    setLoadingList(true);
    try {
      const res = await apiFetch<Initiative[] | { items: Initiative[] }>(
        '/impact/initiatives',
      );
      const list = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.items)
          ? (res as any).items
          : [];
      setItems(list);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changeInitiativeStatus(id: string, status: InitiativeStatus) {
    setError('');
    setUpdatingStatusId(id);

    try {
      await apiFetch(`/impact/initiatives/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
              }
            : item,
        ),
      );

      setOpenStatusId(null);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setUpdatingStatusId(null);
    }
  }

  // --------------------
  // Create form state
  // --------------------
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Selected decision for create form
  const [selectedDecision, setSelectedDecision] =
    useState<DecisionSearchItem | null>(null);

  // Inline search UI state
  const [showDecisionPicker, setShowDecisionPicker] = useState(false);
  const [decisionQ, setDecisionQ] = useState('');
  const [decisionResults, setDecisionResults] = useState<DecisionSearchItem[]>(
    [],
  );
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionError, setDecisionError] = useState('');

  const canSubmit = useMemo(() => {
    const n = name.trim();
    const d = description.trim();
    return n.length >= 3 && d.length >= 10 && !creating;
  }, [name, description, creating]);

  function reset() {
    setError('');
    setCreatedToast('');
    setName('');
    setDescription('');
    clearDecision();
  }

  async function create() {
    setError('');
    setCreatedToast('');

    const payload: any = {
      name: name.trim(),
      description: description.trim(),
    };

    // include decisionId if selected
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

      // keep form filled? usually reset:
      reset();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setCreating(false);
    }
  }

  // --------------------
  // Decision search (debounced, with stale-response guard)
  // --------------------
  const DECISIONS_SEARCH_URL = (q: string) =>
    `/decisions?q=${encodeURIComponent(q)}`;

  const lastReqIdRef = useRef(0);

  useEffect(() => {
    if (!showDecisionPicker) return;

    const q = decisionQ.trim();
    if (!q) {
      setDecisionResults([]);
      setDecisionError('');
      setDecisionLoading(false);
      return;
    }

    const t = window.setTimeout(async () => {
      const reqId = ++lastReqIdRef.current;

      setDecisionLoading(true);
      setDecisionError('');

      try {
        const res = await apiFetch<any>(DECISIONS_SEARCH_URL(q));

        // accept both shapes: array OR { items }
        const list: DecisionSearchItem[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
            ? res.items
            : [];

        // stale response guard
        if (reqId !== lastReqIdRef.current) return;

        setDecisionResults(list);
      } catch (e: any) {
        if (reqId !== lastReqIdRef.current) return;
        setDecisionError(String(e?.message ?? e));
        setDecisionResults([]);
      } finally {
        if (reqId === lastReqIdRef.current) setDecisionLoading(false);
      }
    }, 180);

    return () => window.clearTimeout(t);
  }, [decisionQ, showDecisionPicker]);

  function pickDecision(d: DecisionSearchItem) {
    setSelectedDecision(d);
    setShowDecisionPicker(false);
    setDecisionQ('');
    setDecisionResults([]);
    setDecisionError('');
  }

  function clearDecision() {
    setSelectedDecision(null);
    setShowDecisionPicker(false);
    setDecisionQ('');
    setDecisionResults([]);
    setDecisionError('');
    setDecisionLoading(false);
  }

  // --------------------
  // UI
  // --------------------
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
              <div className="fd-pill fd-pill-neutral">Planned</div>
              <div className="fd-help">
                You can extend this later with draft/paused/completed.
              </div>
            </div>

            {/* ---------------- LINKED DECISION (INLINE LIVE SEARCH) ---------------- */}
            <div className="fd-field">
              <label className="fd-label">
                {selectedDecision
                  ? (selectedDecision.title ?? selectedDecision.id)
                  : 'Linked decision'}
              </label>

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
                    onClick={clearDecision}
                    disabled={creating}
                    title="Remove linked decision"
                  >
                    Remove
                  </button>

                  <button
                    className="fd-btn"
                    type="button"
                    onClick={() => {
                      setDecisionError('');
                      setDecisionResults([]);
                      setShowDecisionPicker(true);
                      // keep existing query blank so user types fresh
                      setDecisionQ('');
                    }}
                    disabled={creating}
                    title="Change decision"
                  >
                    Change
                  </button>
                </div>
              ) : (
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
                      // reset query for a clean search experience
                      setDecisionQ('');
                    }}
                    disabled={creating}
                  >
                    Link Decision
                  </button>
                </div>
              )}

              {showDecisionPicker && (
                <>
                  <div className="fd-stack" style={{ gap: 10, marginTop: 10 }}>
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
                            onClick={() => pickDecision(d)}
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

                    <div className="fd-help" style={{ marginTop: 10 }}>
                      Optional — link now, or later from the initiatives list.
                    </div>
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
                            : 'no decision linked'}
                        </span>
                      </div>

                      {i.createdAt ? (
                        <div>
                          <span className="fd-meta">
                            Created {formatDate(i.createdAt)}
                          </span>
                        </div>
                      ) : null}
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

                    {/* <span className="fd-pill fd-pill--success">{i.status}</span> */}
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className={`fd-pill ${
                          i.status === 'planned'
                            ? 'fd-pill--neutral'
                            : i.status === 'active'
                              ? 'fd-pill--success'
                              : 'fd-pill--done'
                        }`}
                        onClick={() =>
                          setOpenStatusId((current) =>
                            current === i.id ? null : (i.id ?? null),
                          )
                        }
                        disabled={updatingStatusId === i.id}
                        style={{
                          border: 'none',
                          cursor:
                            updatingStatusId === i.id ? 'default' : 'pointer',
                        }}
                      >
                        {updatingStatusId === i.id
                          ? 'updating...'
                          : STATUS_LABEL[i.status as InitiativeStatus]}
                      </button>

                      {openStatusId === i.id ? (
                        <div className="fd-status-menu">
                          {ALL_INITIATIVE_STATUSES.filter(
                            (s) => s !== i.status,
                          ).map((status) => (
                            <button
                              key={status}
                              type="button"
                              className="fd-status-option"
                              onClick={() =>
                                changeInitiativeStatus(i.id!, status)
                              }
                            >
                              {STATUS_LABEL[status]}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
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
