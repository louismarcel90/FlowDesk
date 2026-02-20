'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../lib/api'; 

type InboxItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  createdAt: string;
  readAt?: string | null;
};

type InboxResponse = {
  items: InboxItem[];
  nextCursor?: string | null;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleString();
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const rootRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedOnceRef = useRef(false);

  const limit = expanded ? 50 : 10;

  // click outside => close
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  async function refreshUnread() {
    try {
      const res = await apiFetch<{ unreadCount: number }>('/notifications/unread-count');
      setUnreadCount(res.unreadCount ?? 0);
    } catch {
      // pas bloquant
    }
  }

  async function loadInbox(opts?: { append?: boolean; cursor?: string | null }) {
    setError('');
    setLoading(true);
    try {
      // ton backend retourne items + nextCursor
      // on tente avec query cursor/limit, et si backend ignore, ça marche quand même
      const qs = new URLSearchParams();
      qs.set('limit', String(limit));
      if (opts?.cursor) qs.set('cursor', opts.cursor);

      const path = `/notifications/inbox?${qs.toString()}`;

      const res = await apiFetch<InboxResponse>(path);

      const newItems = Array.isArray(res.items) ? res.items : [];
      setItems(prev => (opts?.append ? [...prev, ...newItems] : newItems));
      setNextCursor(res.nextCursor ?? null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  // Load when opening the dropdown (once), then refresh on re-open
  useEffect(() => {
    if (!open) return;

    refreshUnread();

    // première ouverture => charge la liste
    if (!hasLoadedOnceRef.current) {
      hasLoadedOnceRef.current = true;
      loadInbox({ append: false });
      return;
    }

    loadInbox({ append: false });
  }, [open, limit]); // limit change (expanded) => refetch

  const title = useMemo(() => {
    if (unreadCount > 0) return `Notifications (${unreadCount})`;
    return 'Notifications';
  }, [unreadCount]);

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="fd-btn"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label="Notifications"
        style={{ position: 'relative' }}
      >
        🔔
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
          }}
          onMouseDown={(e) => {
            // empêche le click-outside de fermer quand tu cliques dans le dropdown
            e.stopPropagation();
          }}
        >
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

            <button
              type="button"
              className="fd-link"
              onClick={() => {
                // TODO: appelle ton endpoint "mark all read" si tu l’as
                // puis refresh:
                loadInbox({ append: false });
                refreshUnread();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.85)',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Mark all as read
            </button>
          </div>

          <div style={{ padding: 12, display: 'grid', gap: 10 }}>
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

            {!error && loading && items.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.75)' }}>Loading…</div>
            )}

            {!error && !loading && items.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.75)' }}>No notifications</div>
            )}

            {items.map((n) => (
              <div
                key={n.id}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                <div style={{ fontWeight: 800, color: 'rgba(255,255,255,0.92)' }}>
                  {n.title}
                </div>
                <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.80)' }}>
                  {n.body}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                  {formatDate(n.createdAt)}
                </div>
              </div>
            ))}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 6,
              }}
            >
              <button
                type="button"
                onClick={() => setExpanded(v => !v)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.85)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {expanded ? 'Show less' : 'Show More'}
              </button>

              {/* <button
                type="button"
                disabled={!nextCursor || loading}
                onClick={() => loadInbox({ append: true, cursor: nextCursor })}
                style={{
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.9)',
                  padding: '8px 10px',
                  borderRadius: 12,
                  cursor: !nextCursor || loading ? 'not-allowed' : 'pointer',
                  opacity: !nextCursor || loading ? 0.55 : 1,
                  fontWeight: 700,
                }}
              >
                Load more
              </button> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
