'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../lib/api';

export default function DashboardPage() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [initiatives, setInitiatives] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/decisions'),
      apiFetch('/impact/initiatives'),
      apiFetch('/impact/metrics'),
    ])
      .then(([d, i, m]) => {
        setDecisions(d);
        setInitiatives(i);
        setMetrics(m);
      })
      .catch((e) => setError(String(e?.message ?? e)));
  }, []);

  const totalDecisions = decisions.length;
  const approvedDecisions = decisions.filter(
    (d) => d.status === 'approved',
  ).length;
  const draftDecisions = decisions.filter((d) => d.status === 'draft').length;
  const proposedDecisions = decisions.filter(
    (d) => d.status === 'proposed',
  ).length;
  const rejectedDecisions = decisions.filter(
    (d) => d.status === 'rejected',
  ).length;

  const approvalRate =
    totalDecisions > 0
      ? Math.round((approvedDecisions / totalDecisions) * 100)
      : 0;

  const topMetrics = useMemo(() => metrics.slice(0, 5), [metrics]);
  const recentDecisions = useMemo(() => decisions.slice(0, 6), [decisions]);
  const recentInitiatives = useMemo(
    () => initiatives.slice(0, 6),
    [initiatives],
  );

  return (
    <main className="fd-grid">
      <section className="fd-hero fd-stack">
        <div className="fd-spread fd-wrap">
          <div className="fd-stack" style={{ gap: 8 }}>
            <h1>Decision Command Center</h1>
            <p>
              Monitor decision flow, initiative alignment, and measurable impact
              across FlowDesk.
            </p>
          </div>

          <div className="fd-row fd-wrap">
            <a className="fd-btn fd-btn--primary" href="/decisions">
              View Decisions
            </a>
            <a className="fd-btn fd-btn--mid" href="/initiatives">
              View Initiatives
            </a>
            <a className="fd-btn" href="/metrics">
              View Metrics
            </a>
          </div>
        </div>
      </section>

      {error && (
        <section className="fd-card">
          <div className="fd-card-inner">
            <div
              style={{
                padding: 12,
                borderRadius: 14,
                border: '1px solid rgba(255, 77, 125, 0.35)',
                background: 'rgba(255, 77, 125, 0.12)',
                color: 'var(--text)',
              }}
            >
              <strong style={{ display: 'block', marginBottom: 6 }}>
                Dashboard load error
              </strong>
              <span>{error}</span>
            </div>
          </div>
        </section>
      )}

      <section className="fd-kpis">
        <div className="fd-kpi">
          <strong>{totalDecisions}</strong>
          <small>Total decisions captured in the system.</small>
        </div>

        <div className="fd-kpi">
          <strong>{approvedDecisions}</strong>
          <small>
            Approved decisions currently acting as official references.
          </small>
        </div>

        <div className="fd-kpi">
          <strong>{initiatives.length}</strong>
          <small>Initiatives connected to organizational execution.</small>
        </div>

        <div className="fd-kpi">
          <strong>{metrics.length}</strong>
          <small>Tracked metrics available for impact evaluation.</small>
        </div>

        <div className="fd-kpi">
          <strong>{approvalRate}%</strong>
          <small>Approval rate across all decisions in the repository.</small>
        </div>

        <div className="fd-kpi">
          <strong>{draftDecisions}</strong>
          <small>
            Draft decisions still in preparation or awaiting refinement.
          </small>
        </div>
      </section>

      <section className="fd-card">
        <div className="fd-card-header">
          <div>
            <div className="fd-card-title">Decision Health</div>
            <div className="fd-card-subtitle">
              Distribution of decision states across the current operating
              model.
            </div>
          </div>
        </div>

        <div className="fd-card-inner fd-stack">
          <ProgressRow
            label="Approved"
            value={approvedDecisions}
            total={totalDecisions}
            color="var(--success)"
          />
          <ProgressRow
            label="Draft"
            value={draftDecisions}
            total={totalDecisions}
            color="var(--warn)"
          />
          <ProgressRow
            label="Proposed"
            value={proposedDecisions}
            total={totalDecisions}
            color="var(--primary)"
          />
          <ProgressRow
            label="Rejected"
            value={rejectedDecisions}
            total={totalDecisions}
            color="var(--danger)"
          />
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1.3fr 1fr',
          gap: 18,
        }}
      >
        <section className="fd-card">
          <div className="fd-card-header">
            <div>
              <div className="fd-card-title">Recent Decisions</div>
              <div className="fd-card-subtitle">
                Latest decision records and current lifecycle status.
              </div>
            </div>
          </div>

          <div className="fd-card-inner">
            <ul className="fd-list">
              {recentDecisions.map((d) => (
                <li key={d.id} className="fd-item">
                  <div className="fd-item-title">
                    <a href={`/decisions/${d.id}`}>{d.title}</a>
                    <span className={getStatusPillClass(d.status)}>
                      {d.status}
                    </span>
                  </div>

                  <div className="fd-item-meta">
                    Created: {safeDate(d.created_at)}
                  </div>
                </li>
              ))}

              {recentDecisions.length === 0 && (
                <li className="fd-item">
                  <div className="fd-item-title">No decisions yet</div>
                  <div className="fd-item-meta">
                    Create your first decision to start building traceability.
                  </div>
                </li>
              )}
            </ul>
          </div>
        </section>

        <section className="fd-card">
          <div className="fd-card-header">
            <div>
              <div className="fd-card-title">Initiatives</div>
              <div className="fd-card-subtitle">
                Execution streams currently linked to decision outcomes.
              </div>
            </div>
          </div>

          <div className="fd-card-inner">
            <ul className="fd-list">
              {recentInitiatives.map((x) => (
                <li key={x.id} className="fd-item">
                  <div className="fd-item-title">
                    <a href={`/initiatives/${x.id}`}>{x.name}</a>
                    <span className={getStatusPillClass(x.status)}>
                      {x.status}
                    </span>
                  </div>

                  <div className="fd-item-meta">
                    {x.description || 'No description available.'}
                  </div>
                </li>
              ))}

              {recentInitiatives.length === 0 && (
                <li className="fd-item">
                  <div className="fd-item-title">No initiatives yet</div>
                  <div className="fd-item-meta">
                    Create an initiative to connect decisions to measurable
                    impact.
                  </div>
                </li>
              )}
            </ul>
          </div>
        </section>
      </section>

      <section className="fd-card">
        <div className="fd-card-header">
          <div>
            <div className="fd-card-title">Metric Registry Snapshot</div>
            <div className="fd-card-subtitle">
              Top tracked metrics currently registered in FlowDesk.
            </div>
          </div>
        </div>

        <div className="fd-card-inner">
          <ul className="fd-list">
            {topMetrics.map((m) => (
              <li key={m.id} className="fd-item">
                <div className="fd-item-title">
                  <a href={`/metrics/${m.id}`}>{m.name}</a>
                  <span className="fd-pill">{m.unit}</span>
                </div>

                <div className="fd-item-meta">
                  Direction:{' '}
                  <strong style={{ color: 'var(--text)' }}>
                    {m.direction}
                  </strong>
                </div>
              </li>
            ))}

            {topMetrics.length === 0 && (
              <li className="fd-item">
                <div className="fd-item-title">No metrics yet</div>
                <div className="fd-item-meta">
                  Add metrics to quantify decision quality and business impact.
                </div>
              </li>
            )}
          </ul>
        </div>
      </section>
    </main>
  );
}

function ProgressRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="fd-stack" style={{ gap: 8 }}>
      <div className="fd-spread">
        <span style={{ color: 'var(--text)' }}>{label}</span>
        <span style={{ color: 'var(--muted)' }}>
          {value} / {total} ({percent}%)
        </span>
      </div>

      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            background: color,
            transition: 'width 0.35s ease',
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

function getStatusPillClass(status: string) {
  if (status === 'approved' || status === 'active' || status === 'done') {
    return 'fd-pill fd-pill--success';
  }

  if (status === 'draft' || status === 'planned') {
    return 'fd-pill fd-pill--warn';
  }

  if (status === 'rejected') {
    return 'fd-pill fd-pill--danger';
  }

  return 'fd-pill';
}

function safeDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}
