'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { statusLabel, badgeStyle } from './[id]/page';
import type { DecisionListItem } from '../../../api/src/modules/decisions/decisions.types';

function formatDecisionDate(value?: string | Date) {
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

function statusColor(status: string) {
  switch (status) {
    case 'approved':
      return '#059339';
    case 'rejected':
      return '#a11313';
    case 'proposed':
      return '#05337d';
    case 'draft':
      return '#9ca3af';
    case 'superseded':
      return '#6b15bb';
    case 'archived':
      return '#b78a01';
    default:
      return 'white';
  }
}

export default function DecisionsPage() {
  const [items, setItems] = useState<DecisionListItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const res = await apiFetch('/decisions');
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

  const stats = useMemo(() => {
    const total = items.length;

    const proposed = items.filter(
      (d) => String(d.status ?? '').toLowerCase() === 'proposed',
    ).length;

    const rejected = items.filter(
      (d) => String(d.status ?? '').toLowerCase() === 'rejected',
    ).length;

    const approved = items.filter(
      (d) => String(d.status ?? '').toLowerCase() === 'approved',
    ).length;

    const draft = items.filter(
      (d) => String(d.status ?? '').toLowerCase() === 'draft',
    ).length;

    return { total, proposed, approved, draft, rejected };
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
            <div style={{ maxWidth: 820 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(2rem, 4vw, 3.4rem)',
                  lineHeight: 1.02,
                  letterSpacing: '-0.03em',
                  fontWeight: 800,
                }}
              >
                Decisions
              </h1>

              <p
                className="fd-page-subtitle"
                style={{
                  marginTop: 16,
                  marginBottom: 0,
                  maxWidth: 860,
                  fontSize: '1.06rem',
                  lineHeight: 1.7,
                  color: 'rgba(255,255,255,.82)',
                }}
              >
                Centralize strategic decisions, track their lifecycle, and keep
                governance visible across the organization.
              </p>
            </div>

            <div className="fd-row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <Link className="fd-btn fd-btn--primary" href="/decisions/new">
                Create decision
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
                <div className="fd-muted">Total decisions</div>
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
                <div className="fd-muted">Draft</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '2rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: statusColor('draft'),
                  }}
                >
                  {stats.draft}
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
                <div className="fd-muted">Proposed</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '2rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: statusColor('proposed'),
                  }}
                >
                  {stats.proposed}
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
                <div className="fd-muted">Approved</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '2rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: statusColor('approved'),
                  }}
                >
                  {stats.approved}
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
                <div className="fd-muted">Rejected</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '2rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: statusColor('rejected'),
                  }}
                >
                  {stats.rejected}
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
              <div className="fd-card-title">Decision list</div>
              <div className="fd-card-subtitle">
                Browse current governance records and open any decision for full
                detail.
              </div>
            </div>
          </div>

          <div className="fd-card-inner">
            {loading ? (
              <div className="fd-muted">Loading decisions…</div>
            ) : items.length === 0 ? (
              <div
                className="fd-card"
                style={{
                  background: 'rgba(255,255,255,.025)',
                  border: '1px dashed rgba(255,255,255,.12)',
                }}
              >
                <div className="fd-card-inner">
                  <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    No decisions yet
                  </div>
                  <div className="fd-muted" style={{ marginTop: 8 }}>
                    Start building your governance layer by creating the first
                    decision.
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <Link
                      className="fd-btn fd-btn--primary"
                      href="/decisions/new"
                    >
                      Create first decision
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="fd-stack" style={{ gap: 14 }}>
                {items.map((d) => (
                  <Link
                    key={d.id}
                    href={`/decisions/${d.id}`}
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
                              fontSize: '1.32rem',
                              fontWeight: 800,
                              lineHeight: 1.25,
                              color: 'rgba(255,255,255,.97)',
                              letterSpacing: '-0.02em',
                            }}
                          >
                            {d.title || 'Untitled decision'}
                          </div>

                          <div
                            className="fd-row"
                            style={{
                              gap: 10,
                              marginTop: 14,
                              flexWrap: 'wrap',
                              alignItems: 'center',
                            }}
                          >
                            <span className="fd-chip">{d.id}</span>
                            <span
                              className="fd-muted"
                              style={{ fontSize: '.95rem' }}
                            >
                              Created: {formatDecisionDate(d.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div
                          className="fd-row"
                          style={{
                            gap: 10,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span style={badgeStyle(d.status)}>
                            {statusLabel(d.status)}
                          </span>

                          <span
                            style={{
                              color: 'rgba(255,255,255,.6)',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Open →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
