'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '../../../lib/api';

type MetricSnapshot = {
  id: string;
  value: number;
  occurredAt?: string | Date;
  source?: string;
  createdAt?: string | Date;
};

type MetricDecisionLink = {
  id: string;
  decisionId: string;
  decisionTitle: string;
  decisionStatus: string;
  createdAt?: string | Date;
};

type MetricDetail = {
  id: string;
  name: string;
  description?: string;
  unit: string;
  direction: 'up' | 'down';
  createdAt?: string | Date;
  snapshots?: MetricSnapshot[];
  decisions?: MetricDecisionLink[];
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

function directionTone(direction?: 'up' | 'down') {
  return direction === 'up'
    ? {
        color: '#22c55e',
        border: '1px solid rgba(34,197,94,.35)',
        background: 'rgba(34,197,94,.10)',
        label: 'Higher is better',
        arrow: '↑',
      }
    : {
        color: '#ef4444',
        border: '1px solid rgba(239,68,68,.35)',
        background: 'rgba(239,68,68,.10)',
        label: 'Lower is better',
        arrow: '↓',
      };
}

function decisionStatusTone(status?: string) {
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

export default function MetricDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [metric, setMetric] = useState<MetricDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const res: any = await apiFetch(`/impact/metrics/${id}`);

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
          setLoading(false);
        }
      }
    }

    if (id) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  const tone = directionTone(metric?.direction);

  const snapshots = useMemo(
    () =>
      Array.isArray(metric?.snapshots)
        ? metric!.snapshots.filter((s) => s.value >= 0)
        : [],
    [metric],
  );

  const decisions = useMemo(
    () => (Array.isArray(metric?.decisions) ? metric!.decisions : []),
    [metric],
  );

  const latestSnapshot = useMemo(() => {
    if (snapshots.length === 0) return null;

    return [...snapshots].sort((a, b) => {
      const aTime = new Date(a.occurredAt ?? 0).getTime();
      const bTime = new Date(b.occurredAt ?? 0).getTime();
      return bTime - aTime;
    })[0];
  }, [snapshots]);

  if (loading) {
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

  if (error) {
    return (
      <main className="fd-page">
        <section className="fd-card fd-card--elevated">
          <div className="fd-card-inner">
            <div className="fd-alert fd-alert--danger">{error}</div>

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

  if (!metric) {
    return (
      <main className="fd-page">
        <section className="fd-card fd-card--elevated">
          <div className="fd-card-inner">
            <div className="fd-muted">Metric not found.</div>

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
                {metric.name || 'Untitled metric'}
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
                {metric.description?.trim() ||
                  'No description provided for this metric yet.'}
              </p>
            </div>

            <div className="fd-row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <Link className="fd-btn" href="/metrics">
                Back
              </Link>

              <Link
                className="fd-btn"
                href={`/metrics/${metric.id}/link-decision`}
              >
                Link decision
              </Link>

              <Link
                className="fd-btn fd-btn--primary"
                href={`/metrics/${metric.id}/new-snapshot`}
              >
                Add snapshot
              </Link>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
                <div className="fd-muted">Direction</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    lineHeight: 1.2,
                    color: tone.color,
                  }}
                >
                  {tone.arrow} {tone.label}
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
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    lineHeight: 1.2,
                    color: 'rgba(255,255,255,.95)',
                    wordBreak: 'break-word',
                  }}
                >
                  {metric.unit || '—'}
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
                <div className="fd-muted">Snapshots</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '2rem',
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  {snapshots.length}
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
                <div className="fd-muted">Latest value</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    lineHeight: 1.1,
                    color: 'rgba(255,255,255,.95)',
                  }}
                >
                  {latestSnapshot
                    ? `${latestSnapshot.value} ${metric.unit}`
                    : '—'}
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
                <div className="fd-muted">Linked decisions</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '2rem',
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  {decisions.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          marginTop: 18,
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 18,
        }}
      >
        <section className="fd-card fd-card--elevated">
          <div className="fd-card-header">
            <div>
              <div className="fd-card-title">Metric overview</div>
              <div className="fd-card-subtitle">
                Core definition and metadata for this measurable signal.
              </div>
            </div>
          </div>

          <div className="fd-card-inner">
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
                  background: 'rgba(255,255,255,.025)',
                  border: '1px solid rgba(255,255,255,.08)',
                }}
              >
                <div className="fd-card-inner">
                  <div className="fd-muted">Metric ID</div>
                  <div
                    style={{
                      marginTop: 10,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,.95)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {metric.id}
                  </div>
                </div>
              </div>

              <div
                className="fd-card"
                style={{
                  background: 'rgba(255,255,255,.025)',
                  border: '1px solid rgba(255,255,255,.08)',
                }}
              >
                <div className="fd-card-inner">
                  <div className="fd-muted">Created</div>
                  <div
                    style={{
                      marginTop: 10,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,.95)',
                    }}
                  >
                    {formatDateTime(metric.createdAt)}
                  </div>
                </div>
              </div>

              <div
                className="fd-card"
                style={{
                  background: 'rgba(255,255,255,.025)',
                  border: '1px solid rgba(255,255,255,.08)',
                }}
              >
                <div className="fd-card-inner">
                  <div className="fd-muted">Direction</div>
                  <div style={{ marginTop: 10 }}>
                    <span
                      className="fd-chip"
                      style={{
                        color: tone.color,
                        border: tone.border,
                        background: tone.background,
                      }}
                    >
                      {tone.arrow} {tone.label}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="fd-card"
                style={{
                  background: 'rgba(255,255,255,.025)',
                  border: '1px solid rgba(255,255,255,.08)',
                }}
              >
                <div className="fd-card-inner">
                  <div className="fd-muted">Unit</div>
                  <div
                    style={{
                      marginTop: 10,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,.95)',
                    }}
                  >
                    {metric.unit}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fd-card fd-card--elevated">
          <div className="fd-card-header">
            <div>
              <div className="fd-card-title">Snapshots</div>
              <div className="fd-card-subtitle">
                Historical data points recorded for this metric.
              </div>
            </div>
          </div>

          <div className="fd-card-inner">
            {snapshots.length === 0 ? (
              <div
                className="fd-card"
                style={{
                  background: 'rgba(255,255,255,.025)',
                  border: '1px dashed rgba(255,255,255,.12)',
                }}
              >
                <div className="fd-card-inner">
                  <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    No snapshots yet
                  </div>
                  <div className="fd-muted" style={{ marginTop: 8 }}>
                    Add the first snapshot to start building a measurable
                    history.
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <Link
                      className="fd-btn fd-btn--primary"
                      href={`/metrics/${metric.id}/new-snapshot`}
                    >
                      Add first snapshot
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="fd-stack" style={{ gap: 12 }}>
                {[...snapshots]
                  .sort((a, b) => {
                    const aTime = new Date(a.occurredAt ?? 0).getTime();
                    const bTime = new Date(b.occurredAt ?? 0).getTime();
                    return bTime - aTime;
                  })
                  .map((snapshot) => (
                    <div
                      key={snapshot.id}
                      className="fd-card"
                      style={{
                        background: 'rgba(255,255,255,.028)',
                        border: '1px solid rgba(255,255,255,.08)',
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
                                fontSize: '1.1rem',
                                fontWeight: 800,
                                color: 'rgba(255,255,255,.97)',
                              }}
                            >
                              {snapshot.value} {metric.unit}
                            </div>

                            <div
                              className="fd-row"
                              style={{
                                gap: 10,
                                marginTop: 12,
                                flexWrap: 'wrap',
                              }}
                            >
                              <span className="fd-chip">{snapshot.id}</span>

                              {snapshot.source ? (
                                <span className="fd-chip">
                                  {snapshot.source}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div
                            style={{
                              minWidth: 210,
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
                              Occurred at
                            </div>

                            <div
                              style={{
                                fontWeight: 700,
                                color: 'rgba(255,255,255,.95)',
                                textAlign: 'right',
                              }}
                            >
                              {formatDateTime(snapshot.occurredAt)}
                            </div>

                            <div
                              className="fd-muted"
                              style={{
                                fontSize: '.9rem',
                                textAlign: 'right',
                                marginTop: 4,
                              }}
                            >
                              Created {formatDateTime(snapshot.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>

        <section className="fd-card fd-card--elevated">
          <div className="fd-card-header">
            <div>
              <div className="fd-card-title">Linked Decisions</div>
              <div className="fd-card-subtitle">
                Governance decisions currently connected to this metric.
              </div>
            </div>
          </div>

          <div className="fd-card-inner">
            {decisions.length === 0 ? (
              <div
                className="fd-card"
                style={{
                  background: 'rgba(255,255,255,.025)',
                  border: '1px dashed rgba(255,255,255,.12)',
                }}
              >
                <div className="fd-card-inner">
                  <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    No linked decisions yet
                  </div>
                  <div className="fd-muted" style={{ marginTop: 8 }}>
                    Link this metric to a decision to connect evidence with
                    governance.
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <Link
                      className="fd-btn fd-btn--primary"
                      href={`/metrics/${metric.id}/link-decision`}
                    >
                      Link a decision
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="fd-stack" style={{ gap: 12 }}>
                {decisions.map((decision) => {
                  const tone = decisionStatusTone(decision.decisionStatus);

                  return (
                    <Link
                      key={decision.id}
                      href={`/decisions/${decision.decisionId}`}
                      className="fd-card"
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'block',
                        background:
                          'linear-gradient(90deg, rgba(255,255,255,.028) 0%, rgba(255,255,255,.018) 100%)',
                        border: '1px solid rgba(255,255,255,.08)',
                        boxShadow: '0 10px 28px rgba(0,0,0,.12)',
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
                                fontSize: '1.08rem',
                                fontWeight: 800,
                                color: 'rgba(255,255,255,.97)',
                                lineHeight: 1.3,
                              }}
                            >
                              {decision.decisionTitle || 'Untitled decision'}
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
                              <span className="fd-chip">
                                {decision.decisionId}
                              </span>

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
                              Linked at
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
                                color: 'rgba(255,255,255,.6)',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Open decision →
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
