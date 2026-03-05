// 'use client';

// import { useEffect, useMemo, useRef, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { apiFetch } from '../lib/api';
// import { getAccessToken } from '../lib/auth';

// type InboxItem = {
//   id: string;
//   type: string;
//   title: string;
//   body: string;
//   entityType?: string | null;
//   entityId?: string | null;
//   createdAt: string;
//   readAt?: string | null;
// };

// type InboxResponse = {
//   items: InboxItem[];
//   nextCursor?: string | null;
// };

// const UNREAD_CACHE_KEY = 'flowdesk_unread_count_cache';

// function readCachedUnread(): number {
//   if (typeof window === 'undefined') return 0;
//   const raw = localStorage.getItem(UNREAD_CACHE_KEY);
//   const n = raw ? Number(raw) : 0;
//   return Number.isFinite(n) && n > 0 ? n : 0;
// }

// function writeCachedUnread(n: number) {
//   if (typeof window === 'undefined') return;
//   const safe = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
//   localStorage.setItem(UNREAD_CACHE_KEY, String(safe));
// }

// function formatDate(iso: string) {
//   const d = new Date(iso);
//   if (Number.isNaN(d.getTime())) return 'Invalid Date';
//   return d.toLocaleString();
// }

// // map entity -> URL (à étendre si tu ajoutes d’autres entityType)
// function getNotificationHref(n: InboxItem): string | null {
//   if (n.entityType === 'decision' && n.entityId)
//     return `/decisions/${n.entityId}`;
//   if (n.entityType === 'initiative' && n.entityId)
//     return `/impact/initiatives/${n.entityId}`;
//   return null;
// }

// export default function NotificationBell() {
//   const router = useRouter();

//   const [open, setOpen] = useState(false);
//   const [expanded, setExpanded] = useState(false);

//   const [unreadCount, setUnreadCount] = useState<number>(0);
//   const [items, setItems] = useState<InboxItem[]>([]);
//   const [nextCursor, setNextCursor] = useState<string | null>(null);

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string>('');

//   const rootRef = useRef<HTMLDivElement | null>(null);
//   const hasLoadedOnceRef = useRef(false);
//   const sseRef = useRef<EventSource | null>(null);

//   const limit = expanded ? 50 : 10;

//   // click outside => close
//   useEffect(() => {
//     function onDocClick(e: MouseEvent) {
//       if (!open) return;
//       const el = rootRef.current;
//       if (!el) return;
//       // close if click outside the dropdown
//       if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
//     }
//     document.addEventListener('mousedown', onDocClick);
//     return () => document.removeEventListener('mousedown', onDocClick);
//   }, [open]);

//   async function refreshUnread() {
//     const token = getAccessToken();

//     // ✅ Logged out => pas d'appel réseau => pas de 401 console.
//     if (!token) {
//       setUnreadCount(readCachedUnread());
//       return;
//     }

//     try {
//       const res = await apiFetch<{ unreadCount: number }>(
//         '/notifications/unread-count',
//       );
//       const count = res?.unreadCount ?? 0;
//       setUnreadCount(count);
//       writeCachedUnread(count);
//     } catch {
//       // non bloquant
//     }
//   }

//   async function loadInbox(opts?: {
//     append?: boolean;
//     cursor?: string | null;
//   }) {
//     setError('');
//     setLoading(true);

//     try {
//       const qs = new URLSearchParams();
//       qs.set('limit', String(limit));
//       if (opts?.cursor) qs.set('cursor', opts.cursor);

//       const path = `/notifications/inbox?${qs.toString()}`;
//       const res = await apiFetch<InboxResponse>(path);

//       const newItems = Array.isArray(res?.items) ? res.items : [];
//       setItems((prev) => (opts?.append ? [...prev, ...newItems] : newItems));
//       setNextCursor(res?.nextCursor ?? null);
//     } catch (e: any) {
//       setError(e?.message ?? 'Failed to load notifications');
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function markOneRead(n: InboxItem) {
//     // si déjà read, juste navigation
//     if (n.readAt) {
//       const href = getNotificationHref(n);
//       if (href) router.push(href);
//       return;
//     }

//     // optimiste: on décrémente immédiatement + on marque read localement
//     setUnreadCount((c) => {
//       const next = Math.max(0, c - 1);
//       writeCachedUnread(next); // ✅ keep cache in sync
//       return next;
//     });

//     setItems((prev) =>
//       prev.map((x) =>
//         x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x,
//       ),
//     );

//     try {
//       const res = await apiFetch<{ ok: boolean; unreadCount?: number }>(
//         `/notifications/${n.id}/read`,
//         { method: 'POST' },
//       );

//       if (typeof res?.unreadCount === 'number') {
//         setUnreadCount(res.unreadCount);
//         writeCachedUnread(res.unreadCount);
//       }
//     } catch {
//       // rollback soft: on resync juste le compteur + reload inbox
//       refreshUnread();
//       loadInbox({ append: false });
//     }

//     const href = getNotificationHref(n);
//     if (href) router.push(href);
//   }

//   async function markAllRead() {
//     // optimiste
//     setUnreadCount(0);
//     writeCachedUnread(0);
//     setItems((prev) =>
//       prev.map((x) =>
//         x.readAt ? x : { ...x, readAt: new Date().toISOString() },
//       ),
//     );

//     try {
//       const res = await apiFetch<{ ok: boolean; unreadCount?: number }>(
//         '/notifications/read-all',
//         { method: 'POST' },
//       );
//       if (typeof res?.unreadCount === 'number') {
//         setUnreadCount(res.unreadCount);
//         writeCachedUnread(res.unreadCount);
//       }
//     } catch {
//       refreshUnread();
//       loadInbox({ append: false });
//     }
//   }

//   const title = useMemo(() => {
//     if (unreadCount > 0) return `Notifications (${unreadCount})`;
//     return 'Notifications';
//   }, [unreadCount]);

//   // Au mount : charge unreadCount (cache si logged out) + ouvre SSE si logged in
//   useEffect(() => {
//     refreshUnread();

//     const token = getAccessToken();
//     if (!token) return; // ✅ pas de SSE si logged out

//     // on évite double-connexion
//     if (sseRef.current) {
//       sseRef.current.close();
//       sseRef.current = null;
//     }

//     const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
//     const url = `${API_URL}/notifications/stream?access_token=${encodeURIComponent(token)}`;

//     const es = new EventSource(url);

//     const onUnread = (e: MessageEvent) => {
//       try {
//         const data = JSON.parse(e.data);
//         if (typeof data?.unreadCount === 'number') {
//           setUnreadCount(data.unreadCount);
//           writeCachedUnread(data.unreadCount);
//         }
//       } catch {
//         // ignore
//       }
//     };

//     // event principal (celui de inapp.routes.ts)
//     es.addEventListener('unread_count_updated', onUnread);

//     // safe backward-compat si ancien nom d’event
//     es.addEventListener('notifications.unreadCount', onUnread);

//     es.onerror = () => {
//       // EventSource retry automatiquement; on évite de spam console
//     };

//     return () => {
//       es.close();
//       sseRef.current = null;
//     };
//   }, []);

//   // Quand on ouvre : refresh + charge inbox (la première fois), puis reload quand limit change
//   useEffect(() => {
//     if (!open) return;

//     refreshUnread();

//     if (!hasLoadedOnceRef.current) {
//       hasLoadedOnceRef.current = true;
//       loadInbox({ append: false });
//       return;
//     }

//     // si limit change (expanded), on refetch
//     loadInbox({ append: false });
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [open, limit]);

//   const MAX_VISIBLE_NOTIFS = 5;
//   const NOTIF_CARD_HEIGHT = 96;
//   const DROPDOWN_MAX_HEIGHT =
//     58 /* header */ +
//     24 /* padding */ +
//     MAX_VISIBLE_NOTIFS * NOTIF_CARD_HEIGHT +
//     56; /* footer */

//   const isLoggedIn = !!getAccessToken();

//   return (
//     <div ref={rootRef} style={{ position: 'relative' }}>
//       <button
//         type="button"
//         className="fd-btn"
//         onClick={() => setOpen((v) => !v)}
//         aria-expanded={open}
//         aria-label="Notifications"
//         style={{ position: 'relative' }}
//       >
//         🔔
//         {/* Badge permanent si unreadCount > 0 */}
//         {unreadCount > 0 && (
//           <span
//             style={{
//               position: 'absolute',
//               top: -6,
//               right: -6,
//               minWidth: 18,
//               height: 18,
//               padding: '0 6px',
//               borderRadius: 999,
//               fontSize: 12,
//               lineHeight: '18px',
//               background: 'var(--danger)',
//               color: '#000',
//               fontWeight: 700,
//               textAlign: 'center',
//             }}
//           >
//             {unreadCount}
//           </span>
//         )}
//       </button>

//       {open && (
//         <div
//           style={{
//             position: 'absolute',
//             right: 0,
//             marginTop: 10,
//             width: 520,
//             maxWidth: 'calc(100vw - 24px)',
//             borderRadius: 16,
//             border: '1px solid rgba(255,255,255,0.14)',
//             background: 'rgba(7, 11, 24, 0.92)',
//             boxShadow: '0 24px 70px rgba(0,0,0,0.45)',
//             overflow: 'hidden',
//             zIndex: 1000,
//             display: 'flex',
//             flexDirection: 'column',
//             maxHeight: DROPDOWN_MAX_HEIGHT,
//           }}
//           onMouseDown={(e) => e.stopPropagation()}
//         >
//           {/* Header */}
//           <div
//             style={{
//               display: 'flex',
//               justifyContent: 'space-between',
//               alignItems: 'center',
//               padding: '14px 16px',
//               borderBottom: '1px solid rgba(255,255,255,0.10)',
//             }}
//           >
//             <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>

//             <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
//               <button
//                 type="button"
//                 className="fd-link"
//                 onClick={markAllRead}
//                 disabled={!isLoggedIn || unreadCount === 0}
//                 style={{
//                   background: 'transparent',
//                   border: 'none',
//                   color: 'rgba(255,255,255,0.85)',
//                   textDecoration: 'underline',
//                   cursor:
//                     !isLoggedIn || unreadCount === 0
//                       ? 'not-allowed'
//                       : 'pointer',
//                   fontWeight: 600,
//                   opacity: !isLoggedIn || unreadCount === 0 ? 0.5 : 1,
//                 }}
//                 title={!isLoggedIn ? 'Login required' : 'Mark all as read'}
//               >
//                 Mark all as read
//               </button>

//               <button
//                 type="button"
//                 className="fd-link"
//                 onClick={() => setExpanded((v) => !v)}
//                 style={{
//                   background: 'transparent',
//                   border: 'none',
//                   color: 'rgba(255,255,255,0.85)',
//                   textDecoration: 'underline',
//                   cursor: 'pointer',
//                   fontWeight: 600,
//                 }}
//               >
//                 {expanded ? 'Compact' : 'Expand'}
//               </button>
//             </div>
//           </div>

//           {/* Body */}
//           <div
//             style={{
//               padding: 12,
//               display: 'grid',
//               gap: 10,
//               overflowY: 'auto',
//               minHeight: 0,
//             }}
//           >
//             {!isLoggedIn && (
//               <div
//                 style={{
//                   padding: 10,
//                   borderRadius: 12,
//                   background: 'rgba(255,255,255,0.06)',
//                   border: '1px solid rgba(255,255,255,0.10)',
//                   color: 'rgba(255,255,255,0.85)',
//                   fontWeight: 600,
//                 }}
//               >
//                 You are logged out. Showing last known unread count only. Login
//                 to view your inbox.
//               </div>
//             )}

//             {error && (
//               <div
//                 style={{
//                   padding: 10,
//                   borderRadius: 12,
//                   background: 'rgba(255, 77, 125, 0.12)',
//                   border: '1px solid rgba(255, 77, 125, 0.35)',
//                   color: 'var(--danger)',
//                   fontWeight: 600,
//                 }}
//               >
//                 {error}
//               </div>
//             )}

//             {loading && (
//               <div style={{ padding: 10, color: 'rgba(255,255,255,0.75)' }}>
//                 Loading…
//               </div>
//             )}

//             {!loading && isLoggedIn && items.length === 0 && (
//               <div style={{ padding: 10, color: 'rgba(255,255,255,0.75)' }}>
//                 No notifications yet.
//               </div>
//             )}

//             {!loading &&
//               isLoggedIn &&
//               items.map((n) => {
//                 const isUnread = !n.readAt;
//                 return (
//                   <button
//                     key={n.id}
//                     type="button"
//                     onClick={() => markOneRead(n)}
//                     style={{
//                       textAlign: 'left',
//                       width: '100%',
//                       borderRadius: 14,
//                       border: `1px solid ${
//                         isUnread
//                           ? 'rgba(255,255,255,0.18)'
//                           : 'rgba(255,255,255,0.10)'
//                       }`,
//                       background: isUnread
//                         ? 'rgba(255,255,255,0.06)'
//                         : 'rgba(255,255,255,0.03)',
//                       padding: '12px 12px',
//                       cursor: 'pointer',
//                       display: 'grid',
//                       gap: 6,
//                     }}
//                   >
//                     <div
//                       style={{
//                         display: 'flex',
//                         justifyContent: 'space-between',
//                         gap: 10,
//                         alignItems: 'baseline',
//                       }}
//                     >
//                       <div
//                         style={{
//                           fontWeight: 800,
//                           color: 'rgba(255,255,255,0.92)',
//                         }}
//                       >
//                         {n.title}
//                       </div>
//                       <div
//                         style={{
//                           fontSize: 12,
//                           color: 'rgba(255,255,255,0.55)',
//                         }}
//                       >
//                         {formatDate(n.createdAt)}
//                       </div>
//                     </div>

//                     <div
//                       style={{
//                         color: 'rgba(255,255,255,0.78)',
//                         lineHeight: 1.35,
//                       }}
//                     >
//                       {n.body}
//                     </div>

//                     {isUnread && (
//                       <div
//                         style={{
//                           fontSize: 12,
//                           color: 'rgba(255,255,255,0.65)',
//                         }}
//                       >
//                         Unread
//                       </div>
//                     )}
//                   </button>
//                 );
//               })}
//           </div>

//           {/* Footer */}
//           <div
//             style={{
//               padding: '12px 16px',
//               borderTop: '1px solid rgba(255,255,255,0.10)',
//               display: 'flex',
//               justifyContent: 'space-between',
//               alignItems: 'center',
//               gap: 12,
//             }}
//           >
//             <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
//               {isLoggedIn
//                 ? 'Live updates enabled'
//                 : 'Login to enable live updates'}
//             </div>

//             <div style={{ display: 'flex', gap: 10 }}>
//               {isLoggedIn && nextCursor && (
//                 <button
//                   type="button"
//                   className="fd-btn"
//                   onClick={() =>
//                     loadInbox({ append: true, cursor: nextCursor })
//                   }
//                   disabled={loading}
//                 >
//                   Load more
//                 </button>
//               )}

//               {isLoggedIn ? (
//                 <button
//                   type="button"
//                   className="fd-btn"
//                   onClick={() => setOpen(false)}
//                 >
//                   Close
//                 </button>
//               ) : (
//                 <button
//                   type="button"
//                   className="fd-btn"
//                   onClick={() => router.push('/login')}
//                 >
//                   Login
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../lib/api';
import { getAccessToken } from '../lib/auth';

type InboxItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string;
  readAt?: string | null;
};

type InboxResponse = {
  items: InboxItem[];
  nextCursor?: string | null;
};

const UNREAD_CACHE_KEY = 'flowdesk_unread_count_cache';

function readCachedUnread(): number {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem(UNREAD_CACHE_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function writeCachedUnread(n: number) {
  if (typeof window === 'undefined') return;
  const safe = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  localStorage.setItem(UNREAD_CACHE_KEY, String(safe));
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleString();
}

// map entity -> URL (à étendre si tu ajoutes d’autres entityType)
function getNotificationHref(n: InboxItem): string | null {
  if (n.entityType === 'decision' && n.entityId)
    return `/decisions/${n.entityId}`;
  if (n.entityType === 'initiative' && n.entityId)
    return `/impact/initiatives/${n.entityId}`;
  return null;
}

export default function NotificationBell() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // const [unreadCount, setUnreadCount] = useState<number>(() => readCachedUnread());
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    // après hydration seulement
    setUnreadCount(readCachedUnread());
  }, []);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    // au mount, on sync une fois
    setAuthToken(getAccessToken() ?? null);
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const rootRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedOnceRef = useRef(false);
  const sseRef = useRef<EventSource | null>(null);

  const limit = expanded ? 50 : 10;

  // click outside => close
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const el = rootRef.current;
      if (!el) return;
      // close if click outside the dropdown
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  async function refreshUnread() {
    const token = getAccessToken();

    if (!token) {
      setUnreadCount(readCachedUnread());
      return;
    }

    try {
      const res = await apiFetch<{ unreadCount: number }>(
        '/notifications/unread-count',
      );
      const count = res?.unreadCount ?? 0;
      setUnreadCount(count);
      writeCachedUnread(count);
    } catch {}
  }

  async function loadInbox(opts?: {
    append?: boolean;
    cursor?: string | null;
  }) {
    setError('');
    setLoading(true);

    try {
      const qs = new URLSearchParams();
      qs.set('limit', String(limit));
      if (opts?.cursor) qs.set('cursor', opts.cursor);

      const path = `/notifications/inbox?${qs.toString()}`;
      const res = await apiFetch<InboxResponse>(path);

      const newItems = Array.isArray(res?.items) ? res.items : [];
      setItems((prev) => (opts?.append ? [...prev, ...newItems] : newItems));
      setNextCursor(res?.nextCursor ?? null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  async function markOneRead(n: InboxItem) {
    // si déjà read, juste navigation
    if (n.readAt) {
      const href = getNotificationHref(n);
      if (href) router.push(href);
      return;
    }

    // optimiste: on décrémente immédiatement + on marque read localement
    setUnreadCount((c) => {
      const next = Math.max(0, c - 1);
      writeCachedUnread(next); // ✅ keep cache in sync
      return next;
    });

    setItems((prev) =>
      prev.map((x) =>
        x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x,
      ),
    );

    try {
      const res = await apiFetch<{ ok: boolean; unreadCount?: number }>(
        `/notifications/${n.id}/read`,
        {
          method: 'POST',
        },
      );

      if (typeof res?.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
        writeCachedUnread(res.unreadCount);
      }
    } catch {
      // rollback soft: on resync juste le compteur + reload inbox
      refreshUnread();
      loadInbox({ append: false });
    }

    const href = getNotificationHref(n);
    if (href) router.push(href);
  }

  async function markAllRead() {
    // optimiste
    setUnreadCount(0);
    writeCachedUnread(0);
    setItems((prev) =>
      prev.map((x) =>
        x.readAt ? x : { ...x, readAt: new Date().toISOString() },
      ),
    );

    try {
      const res = await apiFetch<{ ok: boolean; unreadCount?: number }>(
        '/notifications/read-all',
        {
          method: 'POST',
        },
      );

      if (typeof res?.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
        writeCachedUnread(res.unreadCount);
      }
    } catch {
      refreshUnread();
      loadInbox({ append: false });
    }
  }

  const title = useMemo(() => {
    if (unreadCount > 0) return `Notifications (${unreadCount})`;
    return 'Notifications';
  }, [unreadCount]);

  useEffect(() => {
    // sync token if storage changes (other tab) OR app updates it.
    const onStorage = (e: StorageEvent) => {
      // si ton getAccessToken lit localStorage/cookies, on resnapshot.
      if (
        !e.key ||
        e.key.toLowerCase().includes('token') ||
        e.key.toLowerCase().includes('auth')
      ) {
        setAuthToken(getAccessToken() ?? null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Au mount + quand authToken change : refresh unread + SSE si logged in
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  useEffect(() => {
    // refreshUnread();
    if (!authToken) return;

    let closed = false;
    let es: EventSource | null = null;
    let retry = 0;
    let retryTimer: any = null;

    const connect = () => {
      if (closed) return;

      // reset timer
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }

      const url = `${API_URL}/notifications/stream?access_token=${encodeURIComponent(authToken)}`;
      es = new EventSource(url);
      sseRef.current = es;

      const onUnread = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (typeof (data as any)?.unreadCount === 'number') {
            setUnreadCount((data as any).unreadCount);
            writeCachedUnread((data as any).unreadCount);
          }
        } catch {
          // ignore
        }
      };

      es.addEventListener('unread_count_updated', onUnread as any);
      es.addEventListener('notifications.unreadCount', onUnread as any);

      // (optionnel) ping -> juste pour debug / keepalive
      es.addEventListener('ping', () => {});

      es.onopen = () => {
        retry = 0;
      };

      es.onerror = () => {
        // On ferme proprement et on reconnect avec backoff.
        try {
          es?.close();
        } catch {}
        if (sseRef.current === es) sseRef.current = null;

        if (closed) return;

        // backoff: 1s, 2s, 4s, 8s... max 15s
        retry += 1;
        const delay = Math.min(15000, 1000 * Math.pow(2, retry - 1));
        retryTimer = setTimeout(connect, delay);
      };

      // cleanup listeners si jamais on reconnect
      const cleanup = () => {
        try {
          es?.removeEventListener('unread_count_updated', onUnread as any);
          es?.removeEventListener('notifications.unreadCount', onUnread as any);
          es?.close();
        } catch {}
        if (sseRef.current === es) sseRef.current = null;
      };

      // stocker cleanup sur l'instance (optionnel)
      (es as any).__cleanup = cleanup;
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      try {
        const current = sseRef.current as any;
        current?.__cleanup?.();
      } catch {}
      try {
        es?.close();
      } catch {}
      if (sseRef.current === es) sseRef.current = null;
    };
  }, [authToken, API_URL]);

  // Quand on ouvre : refresh + charge inbox (la première fois), puis reload quand limit change
  useEffect(() => {
    if (!open) return;

    refreshUnread();

    if (!hasLoadedOnceRef.current) {
      hasLoadedOnceRef.current = true;
      loadInbox({ append: false });
      return;
    }

    // si limit change (expanded), on refetch
    loadInbox({ append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, limit]);

  const MAX_VISIBLE_NOTIFS = 5;
  const NOTIF_CARD_HEIGHT = 96;
  const DROPDOWN_MAX_HEIGHT =
    58 /* header */ +
    24 /* padding */ +
    MAX_VISIBLE_NOTIFS * NOTIF_CARD_HEIGHT +
    56; /* footer */

  const isLoggedIn = !!authToken;

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="fd-btn"
        onClick={() => {
          setAuthToken(getAccessToken() ?? null);
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-label="Notifications"
        style={{ position: 'relative' }}
      >
        🔔
        {/* Badge permanent si unreadCount > 0 */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              minWidth: 18,
              height: 18,
              padding: '0 6px',
              borderRadius: 999,
              fontSize: 12,
              lineHeight: '18px',
              background: 'var(--danger)',
              color: '#000',
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            marginTop: 10,
            width: 520,
            maxWidth: 'calc(100vw - 24px)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(7, 11, 24, 0.92)',
            boxShadow: '0 24px 70px rgba(0,0,0,0.45)',
            overflow: 'hidden',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: DROPDOWN_MAX_HEIGHT,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.10)',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                type="button"
                className="fd-link"
                onClick={markAllRead}
                disabled={!isLoggedIn || unreadCount === 0}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.85)',
                  textDecoration: 'underline',
                  cursor:
                    !isLoggedIn || unreadCount === 0
                      ? 'not-allowed'
                      : 'pointer',
                  fontWeight: 600,
                  opacity: !isLoggedIn || unreadCount === 0 ? 0.5 : 1,
                }}
                title={!isLoggedIn ? 'Login required' : 'Mark all as read'}
              >
                Mark all as read
              </button>

              <button
                type="button"
                className="fd-link"
                onClick={() => setExpanded((v) => !v)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.85)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {expanded ? 'Compact' : 'Expand'}
              </button>
            </div>
          </div>

          {/* Body */}
          <div
            style={{
              padding: 12,
              display: 'grid',
              gap: 10,
              overflowY: 'auto',
              minHeight: 0,
            }}
          >
            {!isLoggedIn && (
              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 600,
                }}
              >
                You are logged out. Showing last known unread count only. Login
                to view your inbox.
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  background: 'rgba(255, 77, 125, 0.12)',
                  border: '1px solid rgba(255, 77, 125, 0.35)',
                  color: 'var(--danger)',
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            {loading && (
              <div style={{ padding: 10, color: 'rgba(255,255,255,0.75)' }}>
                Loading…
              </div>
            )}

            {!loading && isLoggedIn && items.length === 0 && (
              <div style={{ padding: 10, color: 'rgba(255,255,255,0.75)' }}>
                No notifications yet.
              </div>
            )}

            {!loading &&
              isLoggedIn &&
              items.map((n) => {
                const isUnread = !n.readAt;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => markOneRead(n)}
                    style={{
                      textAlign: 'left',
                      width: '100%',
                      borderRadius: 14,
                      border: `1px solid ${
                        isUnread
                          ? 'rgba(255,255,255,0.18)'
                          : 'rgba(255,255,255,0.10)'
                      }`,
                      background: isUnread
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(255,255,255,0.03)',
                      padding: '12px 12px',
                      cursor: 'pointer',
                      display: 'grid',
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 10,
                        alignItems: 'baseline',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 800,
                          color: 'rgba(255,255,255,0.92)',
                        }}
                      >
                        {n.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.55)',
                        }}
                      >
                        {formatDate(n.createdAt)}
                      </div>
                    </div>

                    <div
                      style={{
                        color: 'rgba(255,255,255,0.78)',
                        lineHeight: 1.35,
                      }}
                    >
                      {n.body}
                    </div>

                    {isUnread && (
                      <div
                        style={{
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.65)',
                        }}
                      >
                        Unread
                      </div>
                    )}
                  </button>
                );
              })}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(255,255,255,0.10)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
              {isLoggedIn
                ? 'Live updates enabled'
                : 'Login to enable live updates'}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {isLoggedIn && nextCursor && (
                <button
                  type="button"
                  className="fd-btn"
                  onClick={() =>
                    loadInbox({ append: true, cursor: nextCursor })
                  }
                  disabled={loading}
                >
                  Load more
                </button>
              )}

              {isLoggedIn ? (
                <button
                  type="button"
                  className="fd-btn"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              ) : (
                <button
                  type="button"
                  className="fd-btn"
                  onClick={() => router.push('/login')}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
