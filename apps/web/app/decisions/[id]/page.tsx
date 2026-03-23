// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { apiFetch } from '../../../lib/api';
// import { pill } from '../page';

// type DecisionStatus =
//   | 'draft'
//   | 'proposed'
//   | 'approved'
//   | 'rejected'
//   | 'superseded'
//   | 'archived';

// const STATUS_ORDER: DecisionStatus[] = [
//   'draft',
//   'proposed',
//   'approved',
//   'rejected',
//   'superseded',
//   'archived',
// ];

// export const STATUS_STYLES: Record<
//   DecisionStatus,
//   { bg: string; border: string; text: string }
// > = {
//   draft: {
//     bg: 'rgba(148, 163, 184, 0.15)',
//     border: 'rgba(148, 163, 184, 0.45)',
//     text: '#e5e7eb',
//   },
//   proposed: {
//     bg: 'rgba(59, 130, 246, 0.18)',
//     border: 'rgba(59, 130, 246, 0.55)',
//     text: '#bfdbfe',
//   },
//   approved: {
//     bg: 'rgba(34, 197, 94, 0.18)',
//     border: 'rgba(34, 197, 94, 0.55)',
//     text: '#bbf7d0',
//   },
//   rejected: {
//     bg: 'rgba(239, 68, 68, 0.18)',
//     border: 'rgba(239, 68, 68, 0.55)',
//     text: '#fecaca',
//   },
//   superseded: {
//     bg: 'rgba(168, 85, 247, 0.18)',
//     border: 'rgba(168, 85, 247, 0.55)',
//     text: '#e9d5ff',
//   },
//   archived: {
//     bg: 'rgba(234, 179, 8, 0.18)',
//     border: 'rgba(234, 179, 8, 0.55)',
//     text: '#fde68a',
//   },
// };

// export type StatusStyle = { bg: string; border: string; text: string };

// export function getStatusStyle(status: DecisionStatus): StatusStyle {
//   return STATUS_STYLES[status] ?? STATUS_STYLES.draft;
// }

// export function badgeStyle(status: DecisionStatus): React.CSSProperties {
//   const s = getStatusStyle(status);
//   return {
//     background: s.bg,
//     border: `1px solid ${s.border}`,
//     color: s.text,
//     padding: '4px 10px',
//     borderRadius: 9999,
//     fontWeight: 600,
//     letterSpacing: '0.2px',
//     display: 'inline-flex',
//     alignItems: 'center',
//     gap: 8,
//     boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
//     backdropFilter: 'blur(10px)',
//   };
// }

// export function statusLabel(s: DecisionStatus) {
//   return s.charAt(0).toUpperCase() + s.slice(1);
// }

// export default function DecisionDetailPage() {
//   const params = useParams<{ id: string }>();
//   const router = useRouter();

//   const decisionId = useMemo(() => {
//     const raw = params?.id;
//     if (!raw) return '';
//     return Array.isArray(raw) ? raw[0] : raw;
//   }, [params]);

//   const [data, setData] = useState<any>(null);
//   const [error, setError] = useState('');
//   const [comment, setComment] = useState('');
//   const [busy, setBusy] = useState<string | null>(null);

//   useEffect(() => {
//     if (!decisionId) return;
//     apiFetch(`/decisions/${decisionId}`)
//       .then(setData)
//       .catch((e) => setError(String(e?.message ?? e)));
//   }, [decisionId]);

//   async function refresh() {
//     const refreshed = await apiFetch(`/decisions/${decisionId}`);
//     setData(refreshed);
//   }

//   async function addComment() {
//     if (!decisionId || !comment.trim()) return;
//     setBusy('comment');
//     try {
//       await apiFetch(`/decisions/${decisionId}/comments`, {
//         method: 'POST',
//         body: JSON.stringify({ body: comment }),
//       });
//       setComment('');
//       await refresh();
//     } finally {
//       setBusy(null);
//     }
//   }

//   async function onChangeStatus(next: DecisionStatus) {
//     if (!decisionId) return;
//     setBusy(`status:${next}`);
//     try {
//       await apiFetch(`/decisions/${decisionId}/status`, {
//         method: 'PATCH',
//         body: JSON.stringify({ status: next }),
//       });
//       router.push('/decisions');
//     } catch (e: any) {
//       setError(String(e?.message ?? e));
//     } finally {
//       setBusy(null);
//     }
//   }

//   if (error) {
//     return (
//       <main>
//         <p style={{ color: 'crimson' }}>{error}</p>
//       </main>
//     );
//   }

//   if (!data) {
//     return (
//       <main>
//         <p>Loading…</p>
//       </main>
//     );
//   }

//   const decision = data.decision;
//   const status: DecisionStatus = decision.status;

//   return (
//     <main style={{ display: 'grid', gap: 16 }}>
//       {/* Header */}
//       <div
//         style={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           gap: 16,
//         }}
//       >
//         <h1>{decision.title}</h1>
//         <span style={badgeStyle(status)}>{statusLabel(status)}</span>
//       </div>

//       {/* Status actions */}
//       <section
//         style={{
//           border: '1px solid var(--border)',
//           padding: 16,
//           borderRadius: 12,
//           display: 'grid',
//           gap: 12,
//         }}
//       >
//         <h2>Change status</h2>
//         <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
//           {STATUS_ORDER.map((s) => {
//             const isCurrent = s === status;
//             const isLoading = busy === `status:${s}`;
//             const disabled = isCurrent || !!busy;
//             const style = STATUS_STYLES[s];

//             return (
//               <button
//                 key={s}
//                 className="fd-btn"
//                 onClick={() => onChangeStatus(s)}
//                 disabled={disabled}
//                 style={{
//                   background: style.bg,
//                   borderColor: style.border,
//                   color: style.text,
//                   fontWeight: 800,
//                   letterSpacing: '0.2px',
//                   opacity: disabled ? 0.55 : 1,
//                   boxShadow: isCurrent
//                     ? `0 0 0 1px ${style.border}, 0 0 12px ${style.border}`
//                     : 'none',
//                   cursor: disabled ? 'not-allowed' : 'pointer',
//                 }}
//                 title={isCurrent ? 'Current status' : `Set status to ${s}`}
//               >
//                 {isLoading ? 'Updating…' : statusLabel(s)}
//               </button>
//             );
//           })}
//         </div>
//       </section>

//       {/* Versions */}
//       <section
//         style={{
//           border: '1px solid var(--border)',
//           padding: 16,
//           borderRadius: 12,
//         }}
//       >
//         <h2>Versions</h2>
//         <ol>
//           {data.versions.map((v: any) => (
//             <li key={v.id}>
//               v{v.version} —{' '}
//               {new Date(v.createdAt).toLocaleString('en-US', {
//                 year: 'numeric',
//                 month: '2-digit',
//                 day: '2-digit',
//                 hour: '2-digit',
//                 minute: '2-digit',
//               })}
//             </li>
//           ))}
//         </ol>
//       </section>

//       {/* Comments */}
//       <section
//         style={{
//           border: '1px solid var(--border)',
//           padding: 16,
//           borderRadius: 12,
//           display: 'grid',
//           gap: 14,
//           background:
//             'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
//           boxShadow: 'var(--shadow-sm)',
//         }}
//       >
//         <div
//           style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}
//         >
//           <div>
//             <h2 style={{ margin: 0 }}>Comments</h2>
//             <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
//               Leave context, objections, or approvals for this decision.
//             </div>
//           </div>

//           <div
//             style={{
//               alignSelf: 'start',
//               padding: '6px 10px',
//               borderRadius: 999,
//               border: '1px solid var(--border)',
//               background: 'rgba(255,255,255,0.04)',
//               color: 'var(--muted)',
//               fontSize: 12,
//               fontWeight: 700,
//             }}
//           >
//             {data.comments?.length ?? 0} total
//           </div>
//         </div>

//         {/* List */}
//         {!data.comments || data.comments.length === 0 ? (
//           <div
//             style={{
//               border: '1px dashed rgba(255,255,255,0.14)',
//               background: 'rgba(0,0,0,0.10)',
//               borderRadius: 12,
//               padding: 14,
//               color: 'var(--muted)',
//               fontSize: 13,
//             }}
//           >
//             No comments yet. Be the first to add one.
//           </div>
//         ) : (
//           <div style={{ display: 'grid', gap: 10 }}>
//             {data.comments.map((c: any) => (
//               <div
//                 key={c.id}
//                 style={{
//                   border: '1px solid rgba(255,255,255,0.12)',
//                   background: 'rgba(0,0,0,0.14)',
//                   borderRadius: 14,
//                   padding: 12,
//                   display: 'grid',
//                   gap: 8,
//                 }}
//               >
//                 <div
//                   style={{
//                     display: 'flex',
//                     justifyContent: 'space-between',
//                     gap: 10,
//                   }}
//                 >
//                   <div
//                     style={{ display: 'flex', alignItems: 'center', gap: 10 }}
//                   >
//                     <div
//                       aria-hidden
//                       style={{
//                         width: 32,
//                         height: 32,
//                         borderRadius: 12,
//                         background:
//                           'linear-gradient(135deg, rgba(109,94,252,1), rgba(57,214,255,1))',
//                         boxShadow: '0 10px 22px rgba(0,0,0,0.25)',
//                         border: '1px solid rgba(255,255,255,0.18)',
//                       }}
//                     />
//                     <div style={{ display: 'grid' }}>
//                       <span style={{ fontWeight: 800, fontSize: 13 }}>
//                         {c.author.displayName || 'Unknown user'}
//                         {c.author.role && (
//                           <div
//                             style={{
//                               fontSize: 11,
//                               fontWeight: 'lighter',
//                               opacity: 0.7,
//                               marginTop: 1,
//                             }}
//                           >
//                             {c.author.role}
//                           </div>
//                         )}
//                       </span>
//                       <small style={{ color: 'var(--muted)', fontSize: 12 }}>
//                         {new Date(c.createdAt).toLocaleString('en-US', {
//                           year: 'numeric',
//                           month: '2-digit',
//                           day: '2-digit',
//                           hour: '2-digit',
//                           minute: '2-digit',
//                         })}
//                       </small>
//                     </div>
//                   </div>

//                   {/* (Optionnel) actions */}
//                   <div
//                     style={{
//                       color: 'var(--faint)',
//                       fontSize: 12,
//                       alignSelf: 'center',
//                     }}
//                   >
//                     #{String(c.id).slice(0, 6)}
//                   </div>
//                 </div>

//                 <div
//                   style={{
//                     color: 'rgba(255,255,255,0.92)',
//                     lineHeight: 1.45,
//                     fontSize: 14,
//                     whiteSpace: 'pre-wrap',
//                     wordBreak: 'break-word',
//                   }}
//                 >
//                   {c.body}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Composer */}
//         <div
//           style={{
//             borderTop: '1px solid rgba(255,255,255,0.10)',
//             paddingTop: 12,
//             display: 'grid',
//             gap: 10,
//           }}
//         >
//           <div
//             style={{
//               display: 'flex',
//               justifyContent: 'space-between',
//               gap: 10,
//             }}
//           >
//             <div style={{ fontSize: 12, color: 'var(--muted)' }}>
//               Tip: Use short paragraphs. Keep it actionable.
//             </div>
//             <div
//               style={{
//                 fontSize: 12,
//                 color: comment.length > 500 ? 'var(--danger)' : 'var(--muted)',
//                 fontWeight: 700,
//               }}
//             >
//               {comment.length}/500
//             </div>
//           </div>

//           <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
//             <textarea
//               value={comment}
//               onChange={(e) => setComment(e.target.value.slice(0, 500))}
//               placeholder="Write a comment…"
//               rows={3}
//               style={{
//                 flex: 1,
//                 resize: 'vertical',
//                 minHeight: 56,
//                 maxHeight: 180,
//                 padding: 12,
//                 borderRadius: 14,
//                 border: '1px solid rgba(255,255,255,0.14)',
//                 background: 'rgba(0,0,0,0.20)',
//                 color: 'rgba(255,255,255,0.92)',
//                 outline: 'none',
//                 boxShadow: '0 12px 28px rgba(0,0,0,0.22)',
//               }}
//             />

//             <button
//               className="fd-btn"
//               onClick={addComment}
//               disabled={busy === 'comment' || !comment.trim()}
//               style={{
//                 padding: '10px 14px',
//                 borderRadius: 14,
//                 fontWeight: 900,
//                 letterSpacing: '0.2px',
//                 border: '1px solid rgba(109, 94, 252, 0.55)',
//                 background:
//                   busy === 'comment' || !comment.trim()
//                     ? 'rgba(255,255,255,0.06)'
//                     : 'linear-gradient(135deg, rgba(109,94,252,0.92), rgba(57,214,255,0.35))',
//                 color:
//                   busy === 'comment' || !comment.trim()
//                     ? 'rgba(255,255,255,0.55)'
//                     : '#fff',
//                 boxShadow:
//                   busy === 'comment' || !comment.trim()
//                     ? 'none'
//                     : '0 16px 34px rgba(0,0,0,0.30)',
//                 cursor:
//                   busy === 'comment' || !comment.trim()
//                     ? 'not-allowed'
//                     : 'pointer',
//               }}
//               title={!comment.trim() ? 'Write something first' : 'Add comment'}
//             >
//               {busy === 'comment' ? 'Adding…' : 'Add'}
//             </button>
//           </div>
//         </div>
//       </section>
//     </main>
//   );
// }

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';

type DecisionStatus =
  | 'draft'
  | 'proposed'
  | 'approved'
  | 'rejected'
  | 'superseded'
  | 'archived';

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

export default function DecisionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const decisionId = useMemo(() => {
    const raw = params?.id;
    if (!raw) return '';
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

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

  async function onChangeStatus(next: DecisionStatus) {
    if (!decisionId) return;
    setBusy(`status:${next}`);
    try {
      await apiFetch(`/decisions/${decisionId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      await refresh();
      router.push(`/decisions/${decisionId}`);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(null);
    }
  }

  if (error) {
    return (
      <main className="fd-grid">
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
                Decision load error
              </strong>
              <span>{error}</span>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="fd-grid">
        <section className="fd-card">
          <div className="fd-card-inner">
            <p>Loading...</p>
          </div>
        </section>
      </main>
    );
  }

  const decision = data.decision;
  const status: DecisionStatus = decision.status;

  return (
    <main className="fd-grid">
      {/* Header */}
      <section className="fd-hero fd-stack">
        <div className="fd-spread fd-wrap">
          <div className="fd-stack" style={{ gap: 8 }}>
            <h1>{decision.title}</h1>
            <div className="fd-row fd-wrap">
              <span style={badgeStyle(status)}>{statusLabel(status)}</span>

              {decision.created_at && (
                <span className="fd-pill">
                  Created {formatDate(decision.created_at)}
                </span>
              )}

              {decision.approved_at && (
                <span className="fd-pill fd-pill--success">
                  Approved {formatDate(decision.approved_at)}
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

      {/* Status actions */}
      <section className="fd-card">
        <div className="fd-card-header">
          <div>
            <div className="fd-card-title">Change status</div>
            <div className="fd-card-subtitle">
              Update the current lifecycle state of this decision.
            </div>
          </div>
        </div>

        <div className="fd-card-inner">
          <div className="fd-row fd-wrap" style={{ alignItems: 'stretch' }}>
            {STATUS_ORDER.map((s) => {
              const isCurrent = s === status;
              const isLoading = busy === `status:${s}`;
              const disabled = isCurrent || !!busy;
              const style = STATUS_STYLES[s];

              return (
                <button
                  key={s}
                  className="fd-btn"
                  onClick={() => onChangeStatus(s)}
                  disabled={disabled}
                  style={{
                    background: style.bg,
                    borderColor: style.border,
                    color: style.text,
                    fontWeight: 800,
                    letterSpacing: '0.2px',
                    opacity: disabled ? 0.55 : 1,
                    boxShadow: isCurrent
                      ? `0 0 0 1px ${style.border}, 0 12px 28px ${style.border}`
                      : 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                  title={isCurrent ? 'Current status' : `Set status to ${s}`}
                >
                  {isLoading ? 'Updating…' : statusLabel(s)}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="fd-card">
        <div className="fd-card-header">
          <div>
            <div className="fd-card-title">Decision Timeline</div>
            <div className="fd-card-subtitle">
              Visual trace of lifecycle changes, versions, and collaboration.
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

            <TimelineItem
              title="Decision created"
              subtitle={decision.title}
              date={decision.created_at}
              color="var(--primary)"
            />

            <TimelineItem
              title="Current status"
              subtitle={statusLabel(status)}
              date={
                decision.updated_at ||
                decision.approved_at ||
                decision.created_at
              }
              color={getStatusStyle(status).border}
            />

            {Array.isArray(data.versions) &&
              data.versions.map((v: any) => (
                <TimelineItem
                  key={`version-${v.id}`}
                  title={`Version ${v.version}`}
                  subtitle="Decision updated"
                  date={v.createdAt || v.created_at}
                  color="var(--warn)"
                />
              ))}

            {Array.isArray(data.comments) &&
              data.comments.map((c: any) => (
                <TimelineItem
                  key={`comment-${c.id}`}
                  title={
                    c.author?.displayName ||
                    c.author?.display_name ||
                    'Comment added'
                  }
                  subtitle={
                    (c.body || '').slice(0, 120) || 'No preview available'
                  }
                  date={c.createdAt || c.created_at}
                  color="var(--success)"
                />
              ))}
          </div>
        </div>
      </section>

      {/* Versions */}
      <section className="fd-card">
        <div className="fd-card-header">
          <div>
            <div className="fd-card-title">Versions</div>
            <div className="fd-card-subtitle">
              Historical iterations of this decision.
            </div>
          </div>
        </div>

        <div className="fd-card-inner">
          {!data.versions || data.versions.length === 0 ? (
            <div
              style={{
                border: '1px dashed rgba(255,255,255,0.14)',
                background: 'rgba(0,0,0,0.10)',
                borderRadius: 12,
                padding: 14,
                color: 'var(--muted)',
                fontSize: 13,
              }}
            >
              No versions yet.
            </div>
          ) : (
            <ol
              className="fd-list"
              style={{ listStyle: 'none', padding: 0, margin: 0 }}
            >
              {data.versions.map((v: any) => (
                <li key={v.id} className="fd-item">
                  <div className="fd-item-title">
                    <span>v{v.version}</span>
                    <span className="fd-pill">
                      {formatDate(v.createdAt || v.created_at)}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* Comments */}
      <section
        className="fd-card"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="fd-card-header">
          <div>
            <div className="fd-card-title">Comments</div>
            <div className="fd-card-subtitle">
              Leave context, objections, or approvals for this decision.
            </div>
          </div>

          <div
            style={{
              alignSelf: 'start',
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--muted)',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {data.comments?.length ?? 0} total
          </div>
        </div>

        <div className="fd-card-inner fd-stack">
          {/* List */}
          {!data.comments || data.comments.length === 0 ? (
            <div
              style={{
                border: '1px dashed rgba(255,255,255,0.14)',
                background: 'rgba(0,0,0,0.10)',
                borderRadius: 12,
                padding: 14,
                color: 'var(--muted)',
                fontSize: 13,
              }}
            >
              No comments yet. Be the first to add one.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {data.comments.map((c: any) => (
                <div
                  key={c.id}
                  style={{
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(0,0,0,0.14)',
                    borderRadius: 14,
                    padding: 12,
                    display: 'grid',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      <div
                        aria-hidden
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 12,
                          background:
                            'linear-gradient(135deg, rgba(109,94,252,1), rgba(57,214,255,1))',
                          boxShadow: '0 10px 22px rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.18)',
                        }}
                      />
                      <div style={{ display: 'grid' }}>
                        <span style={{ fontWeight: 800, fontSize: 13 }}>
                          {c.author?.displayName ||
                            c.author?.display_name ||
                            'Unknown user'}
                        </span>

                        {c.author?.role && (
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 300,
                              opacity: 0.7,
                              marginTop: 1,
                            }}
                          >
                            {c.author.role}
                          </div>
                        )}
                      </div>
                    </div>

                    <small style={{ color: 'var(--muted)', fontSize: 12 }}>
                      {formatDate(c.createdAt || c.created_at)}
                    </small>
                  </div>

                  <div
                    style={{
                      color: 'rgba(255,255,255,0.92)',
                      lineHeight: 1.45,
                      fontSize: 14,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {c.body}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Composer */}
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.10)',
              paddingTop: 12,
              display: 'grid',
              gap: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Tip: Use short paragraphs. Keep it actionable.
              </div>
              <div
                style={{
                  fontSize: 12,
                  color:
                    comment.length > 500 ? 'var(--danger)' : 'var(--muted)',
                  fontWeight: 700,
                }}
              >
                {comment.length}/500
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                placeholder="Write a comment…"
                rows={3}
                style={{
                  flex: 1,
                  resize: 'vertical',
                  minHeight: 56,
                  maxHeight: 180,
                  padding: 12,
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(0,0,0,0.20)',
                  color: 'rgba(255,255,255,0.92)',
                  outline: 'none',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.22)',
                }}
              />

              <button
                className="fd-btn"
                onClick={addComment}
                disabled={busy === 'comment' || !comment.trim()}
                style={{
                  padding: '10px 14px',
                  borderRadius: 14,
                  fontWeight: 900,
                  letterSpacing: '0.2px',
                  border: '1px solid rgba(109, 94, 252, 0.55)',
                  background:
                    busy === 'comment' || !comment.trim()
                      ? 'rgba(255,255,255,0.06)'
                      : 'linear-gradient(135deg, rgba(109,94,252,0.92), rgba(57,214,255,0.35))',
                  color:
                    busy === 'comment' || !comment.trim()
                      ? 'rgba(255,255,255,0.55)'
                      : '#fff',
                  boxShadow:
                    busy === 'comment' || !comment.trim()
                      ? 'none'
                      : '0 16px 34px rgba(0,0,0,0.30)',
                  cursor:
                    busy === 'comment' || !comment.trim()
                      ? 'not-allowed'
                      : 'pointer',
                }}
                title={
                  !comment.trim() ? 'Write something first' : 'Add comment'
                }
              >
                {busy === 'comment' ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function TimelineItem({
  title,
  subtitle,
  date,
  color,
}: {
  title: string;
  subtitle: string;
  date?: string;
  color: string;
}) {
  return (
    <div
      style={{
        position: 'relative',
        marginBottom: 20,
        paddingLeft: 14,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: -4,
          top: 6,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 14px ${color}`,
        }}
      />

      <div
        style={{
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 12,
          padding: 12,
          background: 'rgba(0,0,0,0.22)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <div style={{ fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          {subtitle}
        </div>
        <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 8 }}>
          {date ? formatDate(date) : '—'}
        </div>
      </div>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}
