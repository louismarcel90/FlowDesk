'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../../lib/api';

type MetricDetail = {
  id: string;
  name: string;
  description?: string;
  unit: string;
  direction: 'up' | 'down';
};

type DecisionItem = {
  id: string;
  title?: string;
  status?: string;
  createdAt?: string | Date;
};

function formatDateTime(value?: string | Date) {
  if (!value) return 'Unknown date';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusTone(status?: string) {
  const value = String(status ?? '').toLowerCase();

  if (value === 'approved') {
    return {
      color: '#22c55e',
      border: '1px solid rgba(34,197,94,.35)',
      background: 'rgba(34,197,94,.10)',
      label: 'Approved',
    };
  }

  if (value === 'rejected') {
    return {
      color: '#ef4444',
      border: '1px solid rgba(239,68,68,.35)',
      background: 'rgba(239,68,68,.10)',
      label: 'Rejected',
    };
  }

  if (value === 'superseded') {
    return {
      color: '#a855f7',
      border: '1px solid rgba(168,85,247,.35)',
      background: 'rgba(168,85,247,.10)',
      label: 'Superseded',
    };
  }

  if (value === 'archived') {
    return {
      color: '#eab308',
      border: '1px solid rgba(234,179,8,.35)',
      background: 'rgba(234,179,8,.10)',
      label: 'Archived',
    };
  }

  if (value === 'proposed') {
    return {
      color: '#3b82f6',
      border: '1px solid rgba(59,130,246,.35)',
      background: 'rgba(59,130,246,.10)',
      label: 'Proposed',
    };
  }

  return {
    color: 'rgba(255,255,255,.82)',
    border: '1px solid rgba(255,255,255,.14)',
    background: 'rgba(255,255,255,.06)',
    label: status || 'Draft',
  };
}

export default function LinkMetricToDecisionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const metricId = params.id;

  const [metric, setMetric] = useState<MetricDetail | null>(null);
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [selected, setSelected] = useState<DecisionItem | null>(null);

  const [query, setQuery] = useState('');
  const [loadingMetric, setLoadingMetric] = useState(true);
  const [loadingDecisions, setLoadingDecisions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadMetric() {
      try {
        setLoadingMetric(true);
        setError('');

        const res: any = await apiFetch(`/impact/metrics/${metricId}`);

        if (!cancelled) {
          setMetric(res);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(String(e?.message ?? e));
          setMetric(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingMetric(false);
        }
      }
    }

    if (metricId) {
      loadMetric();
    }

    return () => {
      cancelled = true;
    };
  }, [metricId]);

  useEffect(() => {
    let cancelled = false;

    async function loadDecisions() {
      try {
        setLoadingDecisions(true);

        const res: any = await apiFetch('/decisions');
        const arr = Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
            ? res.items
            : [];

        if (!cancelled) {
          setDecisions(arr);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(String(e?.message ?? e));
          setDecisions([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingDecisions(false);
        }
      }
    }

    loadDecisions();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredDecisions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return decisions;

    return decisions.filter((d) => {
      return (
        String(d.title ?? '')
          .toLowerCase()
          .includes(q) ||
        String(d.status ?? '')
          .toLowerCase()
          .includes(q) ||
        String(d.id ?? '')
          .toLowerCase()
          .includes(q)
      );
    });
  }, [decisions, query]);

  const canSubmit = !!metric && !!selected && !submitting;

  async function onLink() {
    if (!metric || !selected) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      await apiFetch(`/impact/decisions/${selected.id}/metric-links`, {
        method: 'POST',
        body: JSON.stringify({
          metricId: metric.id,
        }),
      });

      setSuccess('Metric linked to decision successfully.');

      window.setTimeout(() => {
        router.push(`/metrics/${metric.id}`);
      }, 500);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingMetric) {
    return (
      <main className="fd-page">
        <section className="fd-card fd-card--elevated">
          <div className="fd-card-inner">
            <div className="fd-muted">Loading metric…</div>
          </div>
        </section>
      </main>
    );
  }

  if (!metric) {
    return (
      <main className="fd-page">
        <section className="fd-card fd-card--elevated">
          <div className="fd-card-inner">
            {error ? (
              <div className="fd-alert fd-alert--danger">{error}</div>
            ) : (
              <div className="fd-muted">Metric not found.</div>
            )}

            <div className="fd-row" style={{ gap: 10, marginTop: 16 }}>
              <Link className="fd-btn" href="/metrics">
                Back to metrics
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="fd-page">
      <section
        className="fd-card fd-card--elevated"
        style={{
          overflow: 'hidden',
          position: 'relative',
          background:
            'linear-gradient(135deg, rgba(10,18,46,.94) 0%, rgba(6,17,56,.9) 44%, rgba(9,52,77,.76) 100%)',
          border: '1px solid rgba(255,255,255,.12)',
          boxShadow: '0 24px 80px rgba(0,0,0,.28)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(circle at top right, rgba(100,149,255,.18), transparent 30%), radial-gradient(circle at bottom left, rgba(124,58,237,.14), transparent 28%)',
          }}
        />

        <div
          className="fd-card-inner"
          style={{
            position: 'relative',
            display: 'grid',
            gap: 24,
          }}
        >
          <div
            className="fd-row"
            style={{
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ maxWidth: 860 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                  lineHeight: 1.02,
                  letterSpacing: '-0.03em',
                  fontWeight: 800,
                }}
              >
                Link Metric to Decision
              </h1>

              <p
                className="fd-page-subtitle"
                style={{
                  marginTop: 16,
                  marginBottom: 0,
                  maxWidth: 820,
                  fontSize: '1.06rem',
                  lineHeight: 1.7,
                  color: 'rgba(255,255,255,.82)',
                }}
              >
                Connect this metric to a governance decision so evidence and
                decision logic can evolve together.
              </p>
            </div>

            <div className="fd-row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <Link className="fd-btn" href={`/metrics/${metric.id}`}>
                Back
              </Link>

              <button
                type="button"
                className="fd-btn fd-btn--primary"
                disabled={!canSubmit}
                aria-disabled={!canSubmit}
                onClick={onLink}
              >
                {submitting ? 'Linking…' : 'Link decision'}
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
            }}
          >
            <div
              className="fd-card"
              style={{
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.08)',
                minHeight: 104,
              }}
            >
              <div className="fd-card-inner">
                <div className="fd-muted">Metric</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    lineHeight: 1.2,
                    color: 'rgba(255,255,255,.95)',
                  }}
                >
                  {metric.name}
                </div>
              </div>
            </div>

            <div
              className="fd-card"
              style={{
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.08)',
                minHeight: 104,
              }}
            >
              <div className="fd-card-inner">
                <div className="fd-muted">Unit</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    lineHeight: 1.2,
                    color: 'rgba(255,255,255,.95)',
                  }}
                >
                  {metric.unit}
                </div>
              </div>
            </div>

            <div
              className="fd-card"
              style={{
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.08)',
                minHeight: 104,
              }}
            >
              <div className="fd-card-inner">
                <div className="fd-muted">Selected decision</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    lineHeight: 1.3,
                    color: 'rgba(255,255,255,.95)',
                  }}
                >
                  {selected?.title || 'None selected'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {(error || success) && (
        <section style={{ marginTop: 18 }}>
          <div className="fd-stack" style={{ gap: 10 }}>
            {error ? (
              <div className="fd-alert fd-alert--danger">{error}</div>
            ) : null}
            {success ? (
              <div className="fd-alert fd-alert--success">{success}</div>
            ) : null}
          </div>
        </section>
      )}

      <section style={{ marginTop: 18 }}>
        <div className="fd-card fd-card--elevated">
          <div className="fd-card-header">
            <div>
              <div className="fd-card-title">Decision selector</div>
              <div className="fd-card-subtitle">
                Search, review, and choose a decision to attach to this metric.
              </div>
            </div>
          </div>

          <div className="fd-card-inner">
            <div style={{ marginBottom: 16 }}>
              <input
                className="fd-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search decisions by title, status, or ID..."
              />
            </div>

            {loadingDecisions ? (
              <div className="fd-muted">Loading decisions…</div>
            ) : filteredDecisions.length === 0 ? (
              <div className="fd-muted">No decisions found.</div>
            ) : (
              <div className="fd-stack" style={{ gap: 12 }}>
                {filteredDecisions.map((decision) => {
                  const isActive = selected?.id === decision.id;
                  const tone = statusTone(decision.status);

                  return (
                    <button
                      key={decision.id}
                      type="button"
                      onClick={() => setSelected(decision)}
                      className="fd-card"
                      style={{
                        textAlign: 'left',
                        cursor: 'pointer',
                        background: isActive
                          ? 'linear-gradient(90deg, rgba(124,58,237,.14) 0%, rgba(255,255,255,.02) 100%)'
                          : 'linear-gradient(90deg, rgba(255,255,255,.028) 0%, rgba(255,255,255,.018) 100%)',
                        border: isActive
                          ? '1px solid rgba(124,58,237,.35)'
                          : '1px solid rgba(255,255,255,.08)',
                        boxShadow: isActive
                          ? '0 14px 36px rgba(124,58,237,.14)'
                          : '0 10px 28px rgba(0,0,0,.12)',
                        color: 'inherit',
                      }}
                    >
                      <div className="fd-card-inner">
                        <div
                          className="fd-row"
                          style={{
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 16,
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontSize: '1.12rem',
                                fontWeight: 800,
                                lineHeight: 1.3,
                                color: 'rgba(255,255,255,.97)',
                              }}
                            >
                              {decision.title || 'Untitled decision'}
                            </div>

                            <div
                              className="fd-row"
                              style={{
                                gap: 10,
                                marginTop: 12,
                                flexWrap: 'wrap',
                                alignItems: 'center',
                              }}
                            >
                              <span className="fd-chip">{decision.id}</span>

                              <span
                                className="fd-chip"
                                style={{
                                  color: tone.color,
                                  border: tone.border,
                                  background: tone.background,
                                }}
                              >
                                {tone.label}
                              </span>
                            </div>
                          </div>

                          <div
                            style={{
                              minWidth: 220,
                              display: 'grid',
                              justifyItems: 'end',
                              gap: 8,
                            }}
                          >
                            <div
                              className="fd-muted"
                              style={{
                                fontSize: '.9rem',
                                textAlign: 'right',
                              }}
                            >
                              Created
                            </div>

                            <div
                              style={{
                                fontWeight: 700,
                                color: 'rgba(255,255,255,.95)',
                                textAlign: 'right',
                              }}
                            >
                              {formatDateTime(decision.createdAt)}
                            </div>

                            <div
                              style={{
                                marginTop: 4,
                                color: isActive
                                  ? 'rgba(196,181,253,.92)'
                                  : 'rgba(255,255,255,.6)',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {isActive ? 'Selected' : 'Select'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
