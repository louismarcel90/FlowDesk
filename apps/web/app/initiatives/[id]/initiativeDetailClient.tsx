// 'use client';
// import { useEffect, useRef, useState } from 'react';
// import { apiFetch } from '../../../lib/api';
// import Link from 'next/link';

// type Props = { id: string };

// export default function InitiativeDetailClient({ id }: Props) {
//   const [data, setData] = useState<any>(null);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     let cancelled = false;

//     (async () => {
//       try {
//         const initiativeJson = await apiFetch(`/impact/initiatives/${id}`);

//         const metricsJson = await apiFetch(
//           `/impact/metrics?initiativeId=${encodeURIComponent(id)}`,
//         );

//         if (!cancelled) {
//           setData({ ...initiativeJson, metrics: metricsJson });
//           setError(null);
//         }
//       } catch (e: any) {
//         if (!cancelled) setError(String(e?.message ?? e));
//       }
//     })();

//     return () => {
//       cancelled = true;
//     };
//   }, [id]);

//   if (error)
//     return (
//       <main>
//         <p style={{ color: 'crimson' }}>{error}</p>
//       </main>
//     );
//   if (!data)
//     return (
//       <main>
//         <p>Loading...</p>
//       </main>
//     );

//   return (
//     <main style={{ display: 'grid', gap: 16 }}>
//       <h1>{data.initiative?.name}</h1>
//       <p>{data.initiative?.description}</p>

//       <section
//         style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}
//       >
//         <h2>Linked Decisions</h2>
//         <ul>
//           {(data.decisions ?? []).map((d: any) => (
//             <li key={d.id}>
//               <Link href={`/decisions/${d.id}`}>{d.title}</Link> — {d.status}
//             </li>
//           ))}
//         </ul>
//       </section>

//       <section
//         style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}
//       >
//         <h2>Metrics</h2>
//         <ul>
//           {(data.metrics ?? []).map((m: any) => (
//             <li key={m.id}>
//               <Link href={`/metrics/${m.id}`}>{m.name}</Link>
//             </li>
//           ))}
//         </ul>
//       </section>
//     </main>
//   );
// }

'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib/api';
import Link from 'next/link';

type Props = { id: string };

function getStatusTone(status?: string) {
  const value = String(status ?? '').toLowerCase();

  if (
    value.includes('approved') ||
    value.includes('accepted') ||
    value.includes('active') ||
    value.includes('completed')
  ) {
    return 'fd-pill fd-pill--success';
  }

  if (
    value.includes('rejected') ||
    value.includes('blocked') ||
    value.includes('failed') ||
    value.includes('archived')
  ) {
    return 'fd-pill fd-pill--danger';
  }

  if (
    value.includes('draft') ||
    value.includes('pending') ||
    value.includes('proposed') ||
    value.includes('review')
  ) {
    return 'fd-pill fd-pill--warning';
  }

  return 'fd-pill';
}

export default function InitiativeDetailClient({ id }: Props) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const initiativeJson = await apiFetch(`/impact/initiatives/${id}`);

        const metricsJson = await apiFetch(
          `/impact/metrics?initiativeId=${encodeURIComponent(id)}`,
        );

        if (!cancelled) {
          setData({ ...initiativeJson, metrics: metricsJson });
          setError('');
        }
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message ?? e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <main className="fd-page">
        <section className="fd-card fd-card--elevated">
          <div className="fd-card-inner">
            <div className="fd-alert fd-alert--danger">{error}</div>

            <div className="fd-row" style={{ gap: 10, marginTop: 16 }}>
              <Link className="fd-btn" href="/initiatives">
                Back to initiatives
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="fd-page">
        <section className="fd-card fd-card--elevated">
          <div className="fd-card-inner">
            <div className="fd-muted">Loading initiative…</div>
          </div>
        </section>
      </main>
    );
  }

  const initiative = data.initiative ?? {};
  const decisions = Array.isArray(data.decisions) ? data.decisions : [];
  const metrics = Array.isArray(data.metrics) ? data.metrics : [];

  return (
    <main className="fd-page">
      <section
        className="fd-card fd-card--elevated"
        style={{
          overflow: 'hidden',
          position: 'relative',
          background:
            'linear-gradient(135deg, rgba(10,18,46,.92) 0%, rgba(5,16,54,.88) 45%, rgba(9,52,77,.72) 100%)',
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
                {initiative.name}
              </h1>

              <p
                className="fd-page-subtitle"
                style={{
                  marginTop: 16,
                  marginBottom: 0,
                  maxWidth: 840,
                  fontSize: '1.08rem',
                  lineHeight: 1.7,
                  color: 'rgba(255,255,255,.82)',
                }}
              >
                {initiative.description ||
                  'No description provided for this initiative yet.'}
              </p>
            </div>

            <div className="fd-row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <Link className="fd-btn" href="/initiatives">
                Back
              </Link>

              <Link
                className="fd-btn fd-btn--primary"
                href={`/initiatives/${id}/link-decision`}
              >
                Link Decision
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
                <div className="fd-muted">Linked Decisions</div>
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

            <div
              className="fd-card"
              style={{
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.08)',
                minHeight: 104,
              }}
            >
              <div className="fd-card-inner">
                <div className="fd-muted">Metrics</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '2rem',
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  {metrics.length}
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
                <div className="fd-muted">Initiative ID</div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '.95rem',
                    fontWeight: 700,
                    wordBreak: 'break-word',
                    color: 'rgba(255,255,255,.92)',
                  }}
                >
                  {initiative.id ?? id}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr .8fr',
          gap: 18,
          marginTop: 18,
        }}
      >
        <section className="fd-card fd-card--elevated">
          <div className="fd-card-header">
            <div>
              <div className="fd-card-title">Linked Decisions</div>
              <div className="fd-card-subtitle">
                Governance decisions currently attached to this initiative.
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
                    Link a decision to give this initiative stronger governance
                    context.
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <Link
                      className="fd-btn fd-btn--primary"
                      href={`/initiatives/${id}/link-decision`}
                    >
                      Link a decision
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="fd-stack" style={{ gap: 12 }}>
                {decisions.map((d: any) => (
                  <Link
                    key={d.id}
                    href={`/decisions/${d.id}`}
                    className="fd-card"
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      background: 'rgba(255,255,255,.028)',
                      border: '1px solid rgba(255,255,255,.08)',
                      transition:
                        'transform .16s ease, border-color .16s ease, background .16s ease',
                      display: 'block',
                    }}
                  >
                    <div className="fd-card-inner">
                      <div
                        className="fd-row"
                        style={{
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 14,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: '1.04rem',
                              fontWeight: 700,
                              lineHeight: 1.35,
                              color: 'rgba(255,255,255,.96)',
                            }}
                          >
                            {d.title || 'Untitled decision'}
                          </div>

                          <div
                            className="fd-row"
                            style={{
                              gap: 10,
                              marginTop: 10,
                              flexWrap: 'wrap',
                            }}
                          >
                            <span className="fd-chip">{d.id}</span>
                            {d.status ? (
                              <span className={getStatusTone(d.status)}>
                                {d.status}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div
                          style={{
                            color: 'rgba(255,255,255,.62)',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Open →
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="fd-card fd-card--elevated">
          <div className="fd-card-header">
            <div>
              <div className="fd-card-title">Metrics</div>
              <div className="fd-card-subtitle">
                Quantitative indicators associated with this initiative.
              </div>
            </div>
          </div>

          <div className="fd-card-inner">
            {metrics.length === 0 ? (
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
                    Metrics linked to this initiative will appear here.
                  </div>
                </div>
              </div>
            ) : (
              <div className="fd-stack" style={{ gap: 12 }}>
                {metrics.map((m: any) => (
                  <Link
                    key={m.id}
                    href={`/metrics/${m.id}`}
                    className="fd-card"
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      background: 'rgba(255,255,255,.028)',
                      border: '1px solid rgba(255,255,255,.08)',
                      display: 'block',
                    }}
                  >
                    <div className="fd-card-inner">
                      <div
                        className="fd-row"
                        style={{
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: '1.02rem',
                              fontWeight: 700,
                              color: 'rgba(255,255,255,.96)',
                              lineHeight: 1.35,
                            }}
                          >
                            {m.name || 'Untitled metric'}
                          </div>

                          <div style={{ marginTop: 10 }}>
                            <span className="fd-chip">{m.id}</span>
                          </div>
                        </div>

                        <div
                          style={{
                            color: 'rgba(255,255,255,.62)',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Open →
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
