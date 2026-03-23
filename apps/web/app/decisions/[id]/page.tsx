'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';

type DecisionMetricLink = {
  id: string;
  metricId: string;
  metricName: string;
  metricUnit: string;
  metricDirection: 'up' | 'down';
  linkedAt?: string | Date;
  targetDirection?: 'up' | 'down';
  baselineValue?: number | null;
  latestSnapshot: {
    id: string;
    value: number;
    occurredAt?: string | Date;
    source?: string;
    createdAt?: string | Date;
  } | null;
};

type DecisionStatus =
  | 'draft'
  | 'proposed'
  | 'approved'
  | 'rejected'
  | 'superseded'
  | 'archived';

type DecisionDetailData = {
  decision: {
    id: string;
    title: string;
    status: DecisionStatus;
    ownerUserId?: string | null;
    ownerTeamId?: string | null;
    dueAt?: string | null;
    approvedAt?: string | null;
    updatedAt?: string | null;
    supersededById?: string | null;
    archivedAt?: string | null;
    archivedReason?: string | null;
    createdAt?: string | Date;
  };
  versions?: any[];
  comments?: any[];
  links?: any[];
  linkedMetrics?: DecisionMetricLink[];
};

const STATUS_ORDER: DecisionStatus[] = [
  'draft',
  'proposed',
  'approved',
  'rejected',
  'superseded',
  'archived',
];

export const STATUS_STYLES: Record<
  DecisionStatus,
  { bg: string; border: string; text: string }
> = {
  draft: {
    bg: 'rgba(148, 163, 184, 0.15)',
    border: 'rgba(148, 163, 184, 0.45)',
    text: '#e5e7eb',
  },
  proposed: {
    bg: 'rgba(59, 130, 246, 0.18)',
    border: 'rgba(59, 130, 246, 0.55)',
    text: '#bfdbfe',
  },
  approved: {
    bg: 'rgba(34, 197, 94, 0.18)',
    border: 'rgba(34, 197, 94, 0.55)',
    text: '#bbf7d0',
  },
  rejected: {
    bg: 'rgba(239, 68, 68, 0.18)',
    border: 'rgba(239, 68, 68, 0.55)',
    text: '#fecaca',
  },
  superseded: {
    bg: 'rgba(168, 85, 247, 0.18)',
    border: 'rgba(168, 85, 247, 0.55)',
    text: '#e9d5ff',
  },
  archived: {
    bg: 'rgba(234, 179, 8, 0.18)',
    border: 'rgba(234, 179, 8, 0.55)',
    text: '#fde68a',
  },
};

export type StatusStyle = { bg: string; border: string; text: string };

export function getStatusStyle(status: DecisionStatus): StatusStyle {
  return STATUS_STYLES[status] ?? STATUS_STYLES.draft;
}

export function badgeStyle(status: DecisionStatus): React.CSSProperties {
  const s = getStatusStyle(status);
  return {
    background: s.bg,
    border: `1px solid ${s.border}`,
    color: s.text,
    padding: '4px 10px',
    borderRadius: 999,
    fontWeight: 600,
    letterSpacing: '0.2px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
    backdropFilter: 'blur(10px)',
  };
}

export function statusLabel(s: DecisionStatus) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(value?: string | Date | null) {
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

function metricDirectionTone(direction?: 'up' | 'down') {
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

function TimelineItem({
  title,
  subtitle,
  date,
  color,
}: {
  title: string;
  subtitle?: string;
  date?: string | Date | null;
  color?: string;
}) {
  return (
    <div
      className="fd-row"
      style={{
        alignItems: 'flex-start',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: 999,
          marginTop: 6,
          background: color || 'rgba(255,255,255,.65)',
          boxShadow: `0 0 0 6px ${
            color === 'var(--primary)'
              ? 'rgba(99,102,241,.14)'
              : 'rgba(255,255,255,.05)'
          }`,
          flex: '0 0 auto',
        }}
      />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontWeight: 800,
            color: 'rgba(255,255,255,.96)',
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            className="fd-muted"
            style={{ marginTop: 4, color: 'rgba(255,255,255,.75)' }}
          >
            {subtitle}
          </div>
        ) : null}
        <div className="fd-muted" style={{ marginTop: 6, fontSize: '.92rem' }}>
          {formatDate(date)}
        </div>
      </div>
    </div>
  );
}

function computeMetricScore(metric: DecisionMetricLink): number {
  if (!metric.latestSnapshot) return 40;

  const trend = computeMetricTrend(metric);

  if (trend === 'improving') return 100;
  if (trend === 'stable') return 65;
  if (trend === 'degrading') return 20;

  return 40;
}

function computeDecisionHealth(metrics: DecisionMetricLink[]) {
  if (!metrics.length) return 50;

  const scores = metrics.map(computeMetricScore);
  const total = scores.reduce((sum, score) => sum + score, 0);

  return Math.round(total / scores.length);
}

function healthTone(score: number) {
  if (score >= 75) {
    return {
      label: 'Strong alignment',
      color: '#22c55e',
    };
  }

  if (score >= 50) {
    return {
      label: 'Moderate',
      color: '#eab308',
    };
  }

  return {
    label: 'At risk',
    color: '#ef4444',
  };
}

type TrendState = 'improving' | 'degrading' | 'stable' | 'no-data';

function computeMetricTrend(metric: DecisionMetricLink): TrendState {
  if (!metric.latestSnapshot) return 'no-data';

  const value = metric.latestSnapshot.value;

  if (metric.metricDirection === 'up') {
    if (value > 0) return 'improving';
    if (value === 0) return 'stable';
    return 'degrading';
  }

  if (metric.metricDirection === 'down') {
    if (value === 0) return 'improving';
    if (value > 0 && value <= 3) return 'stable';
    if (value > 3) return 'degrading';
  }

  return 'no-data';
}

function trendTone(trend: TrendState) {
  if (trend === 'improving') {
    return {
      label: 'Improving',
      color: '#22c55e',
      border: '1px solid rgba(34,197,94,.35)',
      background: 'rgba(34,197,94,.10)',
      arrow: '↑',
    };
  }

  if (trend === 'degrading') {
    return {
      label: 'Degrading',
      color: '#ef4444',
      border: '1px solid rgba(239,68,68,.35)',
      background: 'rgba(239,68,68,.10)',
      arrow: '↓',
    };
  }

  if (trend === 'stable') {
    return {
      label: 'Stable',
      color: '#eab308',
      border: '1px solid rgba(234,179,8,.35)',
      background: 'rgba(234,179,8,.10)',
      arrow: '→',
    };
  }

  return {
    label: 'No data',
    color: 'rgba(255,255,255,.72)',
    border: '1px solid rgba(255,255,255,.14)',
    background: 'rgba(255,255,255,.06)',
    arrow: '•',
  };
}

export default function DecisionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const decisionId = useMemo(() => {
    const raw = params?.id;
    if (!raw) return '';
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [data, setData] = useState<DecisionDetailData | null>(null);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const linkedMetrics = Array.isArray(data?.linkedMetrics)
    ? data.linkedMetrics
    : [];
  const healthScore = computeDecisionHealth(linkedMetrics);
  const health = healthTone(healthScore);
  const improvingCount = linkedMetrics.filter(
    (metric) => computeMetricTrend(metric) === 'improving',
  ).length;

  const degradingCount = linkedMetrics.filter(
    (metric) => computeMetricTrend(metric) === 'degrading',
  ).length;

  const stableCount = linkedMetrics.filter(
    (metric) => computeMetricTrend(metric) === 'stable',
  ).length;
  useEffect(() => {
    if (!decisionId) return;

    apiFetch(`/decisions/${decisionId}`)
      .then(setData)
      .catch((e) => setError(String(e?.message ?? e)));
  }, [decisionId]);

  async function refresh() {
    const refreshed = await apiFetch(`/decisions/${decisionId}`);
    setData(refreshed);
  }

  async function updateStatus(nextStatus: string) {
    if (!decisionId) return;

    try {
      setBusy('status');

      await apiFetch(`/decisions/${decisionId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });

      await refresh();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(null);
    }
  }

  async function addComment() {
    if (!decisionId || !comment.trim()) return;
    setBusy('comment');
    try {
      await apiFetch(`/decisions/${decisionId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: comment }),
      });
      setComment('');
      await refresh();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(null);
    }
  }

  if (error && !data) {
    return (
      <main className="fd-grid">
        <section className="fd-card">
          <div className="fd-card-inner">
            <div className="fd-alert fd-alert--danger">{error}</div>
          </div>
        </section>
      </main>
    );
  }

  const decision = data?.decision;

  if (!data || !decision) {
    return (
      <main className="fd-grid">
        <section className="fd-card">
          <div className="fd-card-inner">
            <div className="fd-muted">Loading decision…</div>
          </div>
        </section>
      </main>
    );
  }

  const status: DecisionStatus = decision.status;
  const versions = Array.isArray(data.versions) ? data.versions : [];
  const comments = Array.isArray(data.comments) ? data.comments : [];
  const links = Array.isArray(data.links) ? data.links : [];

  const currentStage = Math.max(
    0,
    STATUS_ORDER.findIndex((item) => item === status),
  );

  return (
    <main className="fd-grid">
      <section className="fd-hero fd-stack">
        <div className="fd-spread fd-wrap">
          <div className="fd-stack" style={{ gap: 8 }}>
            <h1>{decision.title}</h1>

            <div className="fd-row fd-wrap">
              <span style={badgeStyle(status)}>{statusLabel(status)}</span>

              {decision.createdAt && (
                <span className="fd-pill">
                  Created {formatDate(decision.createdAt)}
                </span>
              )}

              {decision.approvedAt && (
                <span className="fd-pill fd-pill--success">
                  Approved {formatDate(decision.approvedAt)}
                </span>
              )}
            </div>
          </div>

          <div className="fd-row fd-wrap">
            <a className="fd-btn" href="/decisions">
              Back to Decisions
            </a>
            <a className="fd-btn fd-btn--ghost" href="/dashboard">
              Dashboard
            </a>
          </div>
        </div>
      </section>

      {error ? (
        <section className="fd-card">
          <div className="fd-card-inner">
            <div className="fd-alert fd-alert--danger">{error}</div>
          </div>
        </section>
      ) : null}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)',
          gap: 16,
        }}
      >
        <div className="fd-stack" style={{ gap: 16 }}>
          <section className="fd-card">
            <div className="fd-card-header">
              <div>
                <div className="fd-card-title">Overview</div>
                <div className="fd-card-subtitle">
                  Core metadata and lifecycle markers for this decision.
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
                <div className="fd-card">
                  <div className="fd-card-inner">
                    <div className="fd-muted">Decision ID</div>
                    <div
                      style={{
                        marginTop: 10,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,.95)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {decision.id}
                    </div>
                  </div>
                </div>

                <div className="fd-card">
                  <div className="fd-card-inner">
                    <div className="fd-muted">Owner user</div>
                    <div
                      style={{
                        marginTop: 10,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,.95)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {decision.ownerUserId || '—'}
                    </div>
                  </div>
                </div>

                <div className="fd-card">
                  <div className="fd-card-inner">
                    <div className="fd-muted">Owner team</div>
                    <div
                      style={{
                        marginTop: 10,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,.95)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {decision.ownerTeamId || '—'}
                    </div>
                  </div>
                </div>

                <div className="fd-card">
                  <div className="fd-card-inner">
                    <div className="fd-muted">Due at</div>
                    <div
                      style={{
                        marginTop: 10,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,.95)',
                      }}
                    >
                      {decision.dueAt ? formatDate(decision.dueAt) : '—'}
                    </div>
                  </div>
                </div>

                <div className="fd-card">
                  <div className="fd-card-inner">
                    <div className="fd-muted">Archived at</div>
                    <div
                      style={{
                        marginTop: 10,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,.95)',
                      }}
                    >
                      {decision.archivedAt
                        ? formatDate(decision.archivedAt)
                        : '—'}
                    </div>
                  </div>
                </div>

                <div className="fd-card">
                  <div className="fd-card-inner">
                    <div className="fd-muted">Superseded by</div>
                    <div
                      style={{
                        marginTop: 10,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,.95)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {decision.supersededById || '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="fd-card">
            <div className="fd-card-header">
              <div>
                <div className="fd-card-title">Timeline</div>
                <div className="fd-card-subtitle">
                  Decision lifecycle and important state transitions.
                </div>
              </div>
            </div>

            <div className="fd-card-inner">
              <div style={{ position: 'relative', paddingLeft: 24 }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 7,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: 'rgba(255,255,255,0.08)',
                  }}
                />

                <div className="fd-stack" style={{ gap: 18 }}>
                  <TimelineItem
                    title="Decision created"
                    subtitle={decision.title}
                    date={decision.createdAt}
                    color="var(--primary)"
                  />

                  <TimelineItem
                    title="Current status"
                    subtitle={statusLabel(status)}
                    date={
                      decision.updatedAt ||
                      decision.approvedAt ||
                      decision.createdAt
                    }
                    color={getStatusStyle(status).border}
                  />

                  {decision.approvedAt ? (
                    <TimelineItem
                      title="Approved"
                      subtitle="Decision reached approved state"
                      date={decision.approvedAt}
                      color="#22c55e"
                    />
                  ) : null}

                  {decision.archivedAt ? (
                    <TimelineItem
                      title="Archived"
                      subtitle={decision.archivedReason || 'Decision archived'}
                      date={decision.archivedAt}
                      color="#eab308"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="fd-card">
            <div className="fd-card-header">
              <div>
                <div className="fd-card-title">Linked Metrics</div>
                <div className="fd-card-subtitle">
                  Evidence signals connected to this governance decision.
                </div>
              </div>
            </div>

            <div className="fd-card-inner">
              {linkedMetrics.length === 0 ? (
                <div
                  className="fd-card"
                  style={{
                    background: 'rgba(255,255,255,.025)',
                    border: '1px dashed rgba(255,255,255,.12)',
                  }}
                >
                  <div className="fd-card-inner">
                    <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                      No linked metrics yet
                    </div>
                    <div className="fd-muted" style={{ marginTop: 8 }}>
                      Link one or more metrics to connect this decision with
                      measurable evidence.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="fd-stack" style={{ gap: 12 }}>
                  {linkedMetrics.map((metric) => {
                    const tone = metricDirectionTone(metric.metricDirection);
                    const trend = computeMetricTrend(metric);
                    const trendStyle = trendTone(trend);

                    return (
                      <Link
                        key={metric.id}
                        href={`/metrics/${metric.metricId}`}
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
                                {metric.metricName || 'Untitled metric'}
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
                                  {metric.metricId}
                                </span>
                                <span className="fd-chip">
                                  {metric.metricUnit}
                                </span>
                                <span
                                  className="fd-chip"
                                  style={{
                                    color: trendStyle.color,
                                    border: trendStyle.border,
                                    background: trendStyle.background,
                                  }}
                                >
                                  {trendStyle.arrow} {trendStyle.label}
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
                                Latest snapshot
                              </div>
                              <div
                                className="fd-muted"
                                style={{
                                  fontSize: '.9rem',
                                  textAlign: 'right',
                                  color: trendStyle.color,
                                  fontWeight: 700,
                                }}
                              >
                                {trendStyle.arrow} {trendStyle.label}
                              </div>

                              <div
                                style={{
                                  fontWeight: 800,
                                  color: 'rgba(255,255,255,.95)',
                                  textAlign: 'right',
                                }}
                              >
                                {metric.latestSnapshot
                                  ? `${metric.latestSnapshot.value} ${metric.metricUnit}`
                                  : '—'}
                              </div>

                              <div
                                className="fd-muted"
                                style={{
                                  fontSize: '.9rem',
                                  textAlign: 'right',
                                }}
                              >
                                {metric.latestSnapshot
                                  ? `Occurred ${formatDate(
                                      metric.latestSnapshot.occurredAt,
                                    )}`
                                  : `Linked ${formatDate(metric.linkedAt)}`}
                              </div>

                              <div
                                style={{
                                  marginTop: 4,
                                  color: 'rgba(255,255,255,.6)',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Open metric →
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
        </div>

        <div className="fd-stack" style={{ gap: 16 }}>
          <section className="fd-card fd-card--elevated">
            <div className="fd-card-header">
              <div>
                <div className="fd-card-title">Decision Health</div>
                <div className="fd-card-subtitle">
                  Aggregated signal from linked metrics.
                </div>
              </div>
            </div>

            <div className="fd-card-inner">
              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  justifyItems: 'center',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '3rem',
                    fontWeight: 900,
                    color: health.color,
                  }}
                >
                  {healthScore}%
                </div>

                <div
                  style={{
                    width: '100%',
                    height: 8,
                    borderRadius: 999,
                    background: 'rgba(255,255,255,.08)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${healthScore}%`,
                      height: '100%',
                      background: health.color,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                <div
                  style={{
                    fontWeight: 700,
                    color: 'rgba(255,255,255,.9)',
                  }}
                >
                  {health.label}
                </div>

                <div className="fd-muted" style={{ fontSize: '.9rem' }}>
                  Based on {linkedMetrics.length} metric
                  {linkedMetrics.length > 1 ? 's' : ''}
                </div>
                <div
                  className="fd-row"
                  style={{
                    gap: 8,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    marginTop: 6,
                  }}
                >
                  <span
                    className="fd-chip"
                    style={{
                      color: '#22c55e',
                      border: '1px solid rgba(34,197,94,.35)',
                      background: 'rgba(34,197,94,.10)',
                    }}
                  >
                    ↑ {improvingCount} improving
                  </span>

                  <span
                    className="fd-chip"
                    style={{
                      color: '#eab308',
                      border: '1px solid rgba(234,179,8,.35)',
                      background: 'rgba(234,179,8,.10)',
                    }}
                  >
                    → {stableCount} stable
                  </span>

                  <span
                    className="fd-chip"
                    style={{
                      color: '#ef4444',
                      border: '1px solid rgba(239,68,68,.35)',
                      background: 'rgba(239,68,68,.10)',
                    }}
                  >
                    ↓ {degradingCount} degrading
                  </span>
                </div>
              </div>
            </div>
          </section>
          <section className="fd-card">
            <div className="fd-card-header">
              <div>
                <div className="fd-card-title">Progress</div>
                <div className="fd-card-subtitle">
                  Current lifecycle position of this decision.
                </div>
              </div>
            </div>

            <div className="fd-card-inner">
              <div className="fd-stack" style={{ gap: 12 }}>
                {STATUS_ORDER.map((item, index) => {
                  const active = index <= currentStage;
                  const isCurrent = item === status;
                  const style = getStatusStyle(item);

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        console.log('clicked status =', item);
                        updateStatus(item);
                      }}
                      disabled={busy === 'status' || isCurrent}
                      style={{
                        width: '100%',
                        cursor:
                          busy === 'status' || isCurrent
                            ? 'not-allowed'
                            : 'pointer',
                        opacity: busy === 'status' ? 0.6 : 1,
                        textAlign: 'left',
                        background: active
                          ? style.bg
                          : 'rgba(255,255,255,.025)',
                        border: `1px solid ${
                          active ? style.border : 'rgba(255,255,255,.08)'
                        }`,
                        borderRadius: 14,
                        padding: '10px 12px',
                        transition: 'all .18s ease',
                        color: 'inherit',
                      }}
                    >
                      <div
                        className="fd-row"
                        style={{
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            color: active
                              ? style.text
                              : 'rgba(255,255,255,.62)',
                          }}
                        >
                          {statusLabel(item)}
                        </div>

                        {isCurrent ? (
                          <span
                            className="fd-chip"
                            style={{
                              color: style.text,
                              border: `1px solid ${style.border}`,
                              background: style.bg,
                            }}
                          >
                            Current
                          </span>
                        ) : (
                          <span
                            className="fd-muted"
                            style={{
                              fontSize: '.88rem',
                              color: 'rgba(255,255,255,.48)',
                            }}
                          >
                            Click to set
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {busy === 'status' ? (
                <div className="fd-muted" style={{ marginTop: 12 }}>
                  Updating status...
                </div>
              ) : null}
            </div>
          </section>

          <section className="fd-card">
            <div className="fd-card-header">
              <div>
                <div className="fd-card-title">Comments</div>
                <div className="fd-card-subtitle">
                  Discussion and notes around this decision.
                </div>
              </div>
            </div>

            <div className="fd-card-inner">
              <div className="fd-stack" style={{ gap: 12 }}>
                <textarea
                  className="fd-input"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment..."
                  style={{ resize: 'vertical', minHeight: 120, paddingTop: 14 }}
                />

                <div className="fd-row" style={{ gap: 10 }}>
                  <button
                    className="fd-btn fd-btn--primary"
                    type="button"
                    onClick={addComment}
                    disabled={busy === 'comment' || !comment.trim()}
                  >
                    {busy === 'comment' ? 'Posting…' : 'Add comment'}
                  </button>
                </div>

                {comments.length === 0 ? (
                  <div className="fd-muted">No comments yet.</div>
                ) : (
                  <div className="fd-stack" style={{ gap: 10 }}>
                    {comments.map((c: any, index: number) => (
                      <div
                        key={c.id ?? index}
                        className="fd-card"
                        style={{
                          background: 'rgba(255,255,255,.028)',
                          border: '1px solid rgba(255,255,255,.08)',
                        }}
                      >
                        <div className="fd-card-inner">
                          <div
                            style={{
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.65,
                              color: 'rgba(255,255,255,.92)',
                            }}
                          >
                            {c.body ?? c.comment ?? 'Empty comment'}
                          </div>

                          <div
                            className="fd-muted"
                            style={{ marginTop: 10, fontSize: '.9rem' }}
                          >
                            {formatDate(c.createdAt ?? c.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="fd-card">
            <div className="fd-card-header">
              <div>
                <div className="fd-card-title">Versions & Links</div>
                <div className="fd-card-subtitle">
                  Historical updates and related records.
                </div>
              </div>
            </div>

            <div className="fd-card-inner">
              <div className="fd-stack" style={{ gap: 14 }}>
                <div>
                  <div className="fd-muted" style={{ marginBottom: 8 }}>
                    Versions
                  </div>
                  {versions.length === 0 ? (
                    <div className="fd-muted">No versions.</div>
                  ) : (
                    <div className="fd-stack" style={{ gap: 8 }}>
                      {versions.map((v: any, index: number) => (
                        <div key={v.id ?? index} className="fd-chip">
                          {v.version ?? v.id ?? `Version ${index + 1}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="fd-muted" style={{ marginBottom: 8 }}>
                    Initiative links
                  </div>
                  {links.length === 0 ? (
                    <div className="fd-muted">No initiative links.</div>
                  ) : (
                    <div className="fd-stack" style={{ gap: 8 }}>
                      {links.map((l: any, index: number) => (
                        <div
                          key={l.id ?? index}
                          className="fd-card"
                          style={{
                            background: 'rgba(255,255,255,.028)',
                            border: '1px solid rgba(255,255,255,.08)',
                          }}
                        >
                          <div className="fd-card-inner">
                            <div
                              style={{
                                fontWeight: 700,
                                color: 'rgba(255,255,255,.95)',
                              }}
                            >
                              {l.initiativeName ?? l.initiativeTitle ?? l.id}
                            </div>
                            <div
                              className="fd-muted"
                              style={{ marginTop: 6, fontSize: '.9rem' }}
                            >
                              {formatDate(l.createdAt ?? l.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
