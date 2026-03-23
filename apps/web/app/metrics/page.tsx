'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';

type MetricListItem = {
  id: string;
  name: string;
  // description?: string;
  unit: string;
  direction: 'up' | 'down';
  createdAt?: string | Date;
};

function formatMetricDate(value?: string | Date) {
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

export default function MetricsPage() {
  const [items, setItems] = useState<MetricListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const res: any = await apiFetch('/impact/metrics');
        const arr = Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
            ? res.items
            : [];

        if (!cancelled) {
          setItems(arr);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(String(e?.message ?? e));
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((m) => {
      return (
        String(m.name ?? '')
          .toLowerCase()
          .includes(q) ||
        // String(m.description ?? '').toLowerCase().includes(q) ||
        String(m.unit ?? '')
          .toLowerCase()
          .includes(q) ||
        String(m.direction ?? '')
          .toLowerCase()
          .includes(q) ||
        String(m.id ?? '')
          .toLowerCase()
          .includes(q)
      );
    });
  }, [items, query]);

  const stats = useMemo(() => {
    const total = items.length;
    const up = items.filter((m) => m.direction === 'up').length;
    const down = items.filter((m) => m.direction === 'down').length;

    return { total, up, down };
  }, [items]);

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
                  fontSize: 'clamp(2rem, 4vw, 3.4rem)',
                  lineHeight: 1.02,
                  letterSpacing: '-0.03em',
                  fontWeight: 800,
                }}
              >
                Metrics
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
                Define measurable signals, track performance over time, and
                connect operational evidence to governance decisions.
              </p>
            </div>

            <div className="fd-row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <Link className="fd-btn fd-btn--primary" href="/metrics/new">
                Create metric
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
                <div className="fd-muted">Total metrics</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '2rem',
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  {stats.total}
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
                <div className="fd-muted">Higher is better</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '2rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: '#22c55e',
                  }}
                >
                  {stats.up}
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
                <div className="fd-muted">Lower is better</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '2rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: '#ef4444',
                  }}
                >
                  {stats.down}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <section style={{ marginTop: 18 }}>
          <div className="fd-alert fd-alert--danger">{error}</div>
        </section>
      )}

      <section style={{ marginTop: 18 }}>
        <div className="fd-card fd-card--elevated">
          <div className="fd-card-header">
            <div>
              <div className="fd-card-title">Metric registry</div>
              <div className="fd-card-subtitle">
                Browse all metrics and open any one for detail, snapshots, and
                links.
              </div>
            </div>
          </div>

          <div className="fd-card-inner">
            <div style={{ marginBottom: 16 }}>
              <input
                className="fd-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search metrics by name, description, unit, direction, or ID..."
              />
            </div>

            {loading ? (
              <div className="fd-muted">Loading metrics…</div>
            ) : filteredItems.length === 0 ? (
              items.length === 0 ? (
                <div
                  className="fd-card"
                  style={{
                    background: 'rgba(255,255,255,.025)',
                    border: '1px dashed rgba(255,255,255,.12)',
                  }}
                >
                  <div className="fd-card-inner">
                    <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                      No metrics yet
                    </div>
                    <div className="fd-muted" style={{ marginTop: 8 }}>
                      Create your first metric to start tracking operational or
                      business impact.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="fd-muted">No metrics match your search.</div>
              )
            ) : (
              <div className="fd-stack" style={{ gap: 14 }}>
                {filteredItems.map((metric) => {
                  const tone = directionTone(metric.direction);

                  return (
                    <Link
                      key={metric.id}
                      href={`/metrics/${metric.id}`}
                      className="fd-card"
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'block',
                        background:
                          'linear-gradient(90deg, rgba(255,255,255,.028) 0%, rgba(255,255,255,.018) 100%)',
                        border: '1px solid rgba(255,255,255,.08)',
                        transition:
                          'transform .16s ease, border-color .16s ease, background .16s ease, box-shadow .16s ease',
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
                                fontSize: '1.22rem',
                                fontWeight: 800,
                                lineHeight: 1.25,
                                color: 'rgba(255,255,255,.97)',
                                letterSpacing: '-0.02em',
                              }}
                            >
                              {metric.name || 'Untitled metric'}
                            </div>

                            {/* <div
                              className="fd-muted"
                              style={{
                                marginTop: 10,
                                lineHeight: 1.65,
                                color: 'rgba(255,255,255,.72)',
                              }}
                            >
                              {metric.description?.trim() || 'No description provided.'}
                            </div> */}

                            <div
                              className="fd-row"
                              style={{
                                gap: 10,
                                marginTop: 14,
                                flexWrap: 'wrap',
                                alignItems: 'center',
                              }}
                            >
                              <span className="fd-chip">{metric.id}</span>
                              <span className="fd-chip">
                                {metric.unit || 'unit'}
                              </span>
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

                          <div
                            style={{
                              minWidth: 180,
                              display: 'grid',
                              justifyItems: 'end',
                              gap: 10,
                            }}
                          >
                            <div
                              className="fd-muted"
                              style={{
                                fontSize: '.92rem',
                                textAlign: 'right',
                              }}
                            >
                              Created
                            </div>

                            <div
                              style={{
                                fontWeight: 700,
                                color: 'rgba(255,255,255,.92)',
                                textAlign: 'right',
                              }}
                            >
                              {formatMetricDate(metric.createdAt)}
                            </div>

                            <div
                              style={{
                                marginTop: 4,
                                color: 'rgba(255,255,255,.6)',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Open →
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
        </div>
      </section>
    </main>
  );
}
