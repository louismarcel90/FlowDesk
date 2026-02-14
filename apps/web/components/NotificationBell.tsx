'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch, getToken } from '../lib/api';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * SSE via fetch streaming (works with Authorization header).
 * Emits JSON payloads: { type: 'unread_count_updated', unreadCount: number }
 */
async function connectSse(onEvent: (e: any) => void, onError: () => void) {
  const token = getToken();
  if (!token) return onError();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/notifications/stream`, {
    headers: { authorization: `Bearer ${token}` }
  });

  if (!res.ok || !res.body) return onError();

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames separated by \n\n
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const frame of parts) {
      // We only write `data: <json>`
      const line = frame.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;
      const json = line.slice('data: '.length).trim();
      try {
        onEvent(JSON.parse(json));
      } catch {}
    }
  }

  onError();
}

export function NotificationBell() {
  const [unread, setUnread] = useState<number>(0);
  const [live, setLive] = useState<boolean>(false);

  // initial fetch
  useEffect(() => {
    apiFetch('/notifications/unread-count')
      .then((r) => setUnread(r.unreadCount ?? 0))
      .catch(() => setUnread(0));
  }, []);

  // live SSE + fallback polling
  useEffect(() => {
    let cancelled = false;

    async function start() {
      // try SSE
      setLive(true);
      connectSse(
        (evt) => {
          if (cancelled) return;
          if (evt?.type === 'unread_count_updated' && typeof evt.unreadCount === 'number') {
            setUnread(evt.unreadCount);
          }
        },
        async () => {
          if (cancelled) return;
          // fallback polling
          setLive(false);
          for (;;) {
            if (cancelled) return;
            try {
              const r = await apiFetch('/notifications/unread-count');
              setUnread(r.unreadCount ?? 0);
            } catch {}
            await sleep(8000);
          }
        }
      );
    }

    start();
    return () => {
      cancelled = true;
    };
  }, []);

  const badge = useMemo(() => (unread > 99 ? '99+' : String(unread)), [unread]);

  return (
    <a href="/notifications" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <span style={{ fontSize: 18 }}>🔔</span>

      {unread > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -6,
            right: -10,
            background: 'red',
            color: 'white',
            borderRadius: 999,
            padding: '2px 6px',
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1
          }}
          aria-label={`${unread} unread notifications`}
        >
          {badge}
        </span>
      )}

      <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.65 }}>{live ? 'live' : 'poll'}</span>
    </a>
  );
}
