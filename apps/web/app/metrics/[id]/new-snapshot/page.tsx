'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../../lib/api';

type MetricDetail = {
  id: string;
  name: string;
  //   description?: string;
  unit: string;
  direction: 'up' | 'down';
  createdAt?: string | Date;
};

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

function toDateTimeLocalValue(input?: string | Date) {
  if (!input) return '';

  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '';

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export default function NewMetricSnapshotPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [metric, setMetric] = useState<MetricDetail | null>(null);
  const [loadingMetric, setLoadingMetric] = useState(true);

  const [value, setValue] = useState('');
  const [occurredAt, setOccurredAt] = useState(() =>
    toDateTimeLocalValue(new Date()),
  );
  const [source, setSource] = useState('manual');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadMetric() {
      try {
        setLoadingMetric(true);
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
          setLoadingMetric(false);
        }
      }
    }

    if (id) {
      loadMetric();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  const numericValue = useMemo(() => Number(value), [value]);
  const canSubmit = useMemo(() => {
    return (
      !submitting &&
      !!metric &&
      value.trim() !== '' &&
      !Number.isNaN(numericValue) &&
      !!occurredAt.trim() &&
      !!source.trim()
    );
  }, [submitting, metric, value, numericValue, occurredAt, source]);

  const tone = directionTone(metric?.direction);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit || !metric) return;

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      await apiFetch(`/impact/metrics/${id}/snapshots`, {
        method: 'POST',
        body: JSON.stringify({
          value: numericValue,
          occurredAt: new Date(occurredAt).toISOString(),
          source: source.trim(),
        }),
      });

      setSuccess('Snapshot created successfully.');

      window.setTimeout(() => {
        router.push(`/metrics/${id}`);
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

  if (error && !metric) {
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
                Add Snapshot
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
                Record a measured value for this metric to start building trend
                history and operational evidence.
              </p>
            </div>

            <div className="fd-row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <Link className="fd-btn" href={`/metrics/${metric.id}`}>
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
                <div className="fd-muted">Metric</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '1.2rem',
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
                    fontSize: '1.3rem',
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
                <div className="fd-muted">Direction</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    lineHeight: 1.2,
                    color: tone.color,
                  }}
                >
                  {tone.arrow} {tone.label}
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
              <div className="fd-card-title">Snapshot input</div>
              <div className="fd-card-subtitle">
                Enter a measured value, when it occurred, and where it came
                from.
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
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                }}
              >
                <div style={{ display: 'grid', gap: 8 }}>
                  <label
                    htmlFor="value"
                    style={{
                      fontSize: '.86rem',
                      fontWeight: 800,
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,.9)',
                    }}
                  >
                    Value
                  </label>

                  <input
                    id="value"
                    className="fd-input"
                    type="number"
                    step="any"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={`e.g. 5 ${metric.unit}`}
                  />
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  <label
                    htmlFor="source"
                    style={{
                      fontSize: '.86rem',
                      fontWeight: 800,
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,.9)',
                    }}
                  >
                    Source
                  </label>

                  <input
                    id="source"
                    className="fd-input"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="choose between manual, datadog, warehouse, jira"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                <label
                  htmlFor="occurredAt"
                  style={{
                    fontSize: '.86rem',
                    fontWeight: 800,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,.9)',
                  }}
                >
                  Occurred at
                </label>

                <input
                  id="occurredAt"
                  className="fd-input"
                  type="datetime-local"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                />
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
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: 'rgba(255,255,255,.96)',
                      }}
                    >
                      {value.trim() === '' || Number.isNaN(numericValue)
                        ? `— ${metric.unit}`
                        : `${numericValue} ${metric.unit}`}
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
                      <span className="fd-chip">
                        {source.trim() || 'source'}
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
                  {submitting ? 'Creating…' : 'Create snapshot'}
                </button>

                <Link className="fd-btn" href={`/metrics/${metric.id}`}>
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
