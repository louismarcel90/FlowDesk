'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';

type Direction = 'up' | 'down';

export default function NewMetricPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  // const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [direction, setDirection] = useState<Direction>('up');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canSubmit = useMemo(() => {
    return (
      !submitting &&
      !!name.trim() &&
      // !!description.trim() &&
      !!unit.trim() &&
      !!direction
    );
  }, [submitting, name, unit, direction]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!canSubmit) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const payload = {
        name: name.trim(),
        // description: description.trim(),
        unit: unit.trim(),
        direction,
      };

      const created: any = await apiFetch('/impact/metrics', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccess('Metric created successfully.');

      const createdId = created?.id;

      window.setTimeout(() => {
        if (createdId) {
          router.push(`/metrics/${createdId}`);
        } else {
          router.push('/metrics');
        }
      }, 500);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSubmitting(false);
    }
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
                Create Metric
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
                Define a measurable signal your organization can track over
                time, then enrich it with snapshots and link it to governance
                decisions.
              </p>
            </div>

            <div className="fd-row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <Link className="fd-btn" href="/metrics">
                Back
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
                    fontSize: '2rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: direction === 'up' ? '#22c55e' : '#ef4444',
                  }}
                >
                  {direction === 'up' ? '↑' : '↓'}
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
                <div className="fd-muted">Unit preview</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    lineHeight: 1.2,
                    color: 'rgba(255,255,255,.95)',
                    wordBreak: 'break-word',
                  }}
                >
                  {unit.trim() || '—'}
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
              <div className="fd-card-title">Metric definition</div>
              <div className="fd-card-subtitle">
                Create a reusable metric that can later be linked to decisions
                and tracked through snapshots.
              </div>
            </div>
          </div>

          <div className="fd-card-inner">
            <form
              onSubmit={onSubmit}
              style={{
                display: 'grid',
                gap: 18,
                maxWidth: 860,
              }}
            >
              <div style={{ display: 'grid', gap: 8 }}>
                <label
                  htmlFor="name"
                  style={{
                    fontSize: '.86rem',
                    fontWeight: 800,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,.9)',
                  }}
                >
                  Metric name
                </label>

                <input
                  id="name"
                  className="fd-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Decision latency"
                />
              </div>

              {/* <div style={{ display: 'grid', gap: 8 }}>
                <label
                  htmlFor="description"
                  style={{
                    fontSize: '.86rem',
                    fontWeight: 800,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,.9)',
                  }}
                >
                  Description
                </label>

                <textarea
                  id="description"
                  className="fd-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Average number of days between proposal and final decision."
                  rows={5}
                  style={{
                    resize: 'vertical',
                    minHeight: 140,
                    paddingTop: 14,
                  }}
                />
              </div> */}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                }}
              >
                <div style={{ display: 'grid', gap: 8 }}>
                  <label
                    htmlFor="unit"
                    style={{
                      fontSize: '.86rem',
                      fontWeight: 800,
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,.9)',
                    }}
                  >
                    Unit
                  </label>

                  <input
                    id="unit"
                    className="fd-input"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. days, %, ms, tickets"
                  />
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  <label
                    htmlFor="direction"
                    style={{
                      fontSize: '.86rem',
                      fontWeight: 800,
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,.9)',
                    }}
                  >
                    Direction
                  </label>

                  <select
                    id="direction"
                    className="fd-input"
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as Direction)}
                    style={{ minHeight: 54 }}
                  >
                    <option value="up">Up — higher is better</option>
                    <option value="down">Down — lower is better</option>
                  </select>
                </div>
              </div>

              <div
                className="fd-card"
                style={{
                  background: 'rgba(255,255,255,.025)',
                  border: '1px dashed rgba(255,255,255,.12)',
                }}
              >
                <div className="fd-card-inner">
                  <div
                    style={{
                      fontSize: '.9rem',
                      fontWeight: 800,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,.86)',
                    }}
                  >
                    Preview
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <div
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: 'rgba(255,255,255,.96)',
                      }}
                    >
                      {name.trim() || 'Untitled metric'}
                    </div>

                    {/* <div
                      className="fd-muted"
                      style={{
                        marginTop: 8,
                        lineHeight: 1.65,
                        color: 'rgba(255,255,255,.72)',
                      }}
                    >
                      {description.trim() || 'No description yet.'}
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
                      <span className="fd-chip">{unit.trim() || 'unit'}</span>

                      <span
                        className="fd-chip"
                        style={{
                          color: direction === 'up' ? '#22c55e' : '#ef4444',
                          borderColor:
                            direction === 'up'
                              ? 'rgba(34,197,94,.35)'
                              : 'rgba(239,68,68,.35)',
                          background:
                            direction === 'up'
                              ? 'rgba(34,197,94,.10)'
                              : 'rgba(239,68,68,.10)',
                        }}
                      >
                        {direction === 'up'
                          ? 'Higher is better'
                          : 'Lower is better'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="fd-row"
                style={{
                  gap: 12,
                  marginTop: 6,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="submit"
                  className="fd-btn fd-btn--primary"
                  disabled={!canSubmit}
                  aria-disabled={!canSubmit}
                >
                  {submitting ? 'Creating…' : 'Create metric'}
                </button>

                <Link className="fd-btn" href="/metrics">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
