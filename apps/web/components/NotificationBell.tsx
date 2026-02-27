"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import { getAccessToken } from "../lib/auth";

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

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Invalid Date";
  return d.toLocaleString();
}

// map entity -> URL (à étendre si tu ajoutes d’autres entityType)
function getNotificationHref(n: InboxItem): string | null {
  if (n.entityType === "decision" && n.entityId) return `/decisions/${n.entityId}`;
  return null;
}

export default function NotificationBell() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

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
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  async function refreshUnread() {
    try {
      const res = await apiFetch<{ unreadCount: number }>("/notifications/unread-count");
      setUnreadCount(res.unreadCount ?? 0);
    } catch {
      // non bloquant
    }
  }

  async function loadInbox(opts?: { append?: boolean; cursor?: string | null }) {
    setError("");
    setLoading(true);

    try {
      const qs = new URLSearchParams();
      qs.set("limit", String(limit));
      if (opts?.cursor) qs.set("cursor", opts.cursor);

      const path = `/notifications/inbox?${qs.toString()}`;
      const res = await apiFetch<InboxResponse>(path);

      const newItems = Array.isArray(res.items) ? res.items : [];
      setItems((prev) => (opts?.append ? [...prev, ...newItems] : newItems));
      setNextCursor(res.nextCursor ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  async function markOneRead(n: InboxItem) {
    if (n.readAt) {
      const href = getNotificationHref(n);
      if (href) router.push(href);
      return;
    }

    // optimiste : on décrémente immédiatement + on marque read localement
    setUnreadCount((c) => Math.max(0, c - 1));
    setItems((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x))
    );

    try {
      const res = await apiFetch<{ ok: boolean; unreadCount: number }>(
        `/notifications/${n.id}/read`,
        { method: "POST" }
      );

      if (typeof res.unreadCount === "number") setUnreadCount(res.unreadCount);
    } catch {
      // rollback soft : on resync juste le compteur
      refreshUnread();
      // et on reload inbox 
      loadInbox({ append: false });
    }

    const href = getNotificationHref(n);
    if (href) router.push(href);
  }

  async function markAllRead() {
    setUnreadCount(0);
    setItems((prev) =>
      prev.map((x) => (x.readAt ? x : { ...x, readAt: new Date().toISOString() }))
    );

    try {
      const res = await apiFetch<{ ok: boolean; unreadCount: number }>(
        "/notifications/read-all",
        { method: "POST" }
      );
      if (typeof res.unreadCount === "number") setUnreadCount(res.unreadCount);
    } catch {
      refreshUnread();
      loadInbox({ append: false });
    }
  }

  // Au mount : charge unreadCount + ouvre SSE
  useEffect(() => {
    refreshUnread();

    // SSE
    const token = getAccessToken();
    if (!token) return;

    // on évite double-connexion
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    const url = `${API_URL}/notifications/stream?access_token=${encodeURIComponent(token)}`;

    const es = new EventSource(url, { withCredentials: true });
    sseRef.current = es;

    const onUnread = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (typeof data?.unreadCount === "number") setUnreadCount(data.unreadCount);
      } catch {
        // ignore
      }
    };

    // event principal (celui de inapp.routes.ts)
    es.addEventListener("unread_count_updated", onUnread);

    // au cas où tu avais un ancien nom d'event (safe backward-compat)
    es.addEventListener("notifications.unreadCount", onUnread);

    es.addEventListener("connected", () => {
      //ToDo
    });

    es.onerror = () => {
      // EventSource retry automatiquement; on ne spam pas
    };

    return () => {
      es.close();
      sseRef.current = null;
    };
  }, []);

  // Quand on ouvre : refresh + charge inbox (la première fois)
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
  }, [open, limit]);

  const title = useMemo(() => {
    if (unreadCount > 0) return `Notifications (${unreadCount})`;
    return "Notifications";
  }, [unreadCount]);

  const MAX_VISIBLE_NOTIFS = 5;
  const NOTIF_CARD_HEIGHT = 96; 
  const DROPDOWN_MAX_HEIGHT = 58 /* header */ + 24 /* padding */ + (MAX_VISIBLE_NOTIFS * NOTIF_CARD_HEIGHT) + 56 /* footer actions */;

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="fd-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Notifications"
        style={{ position: "relative" }}
      >
        🔔

        {/* Badge permanent tant que unreadCount > 0 */}
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              minWidth: 18,
              height: 18,
              padding: "0 6px",
              borderRadius: 999,
              fontSize: 12,
              lineHeight: "18px",
              background: "var(--danger)",
              color: "#000",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            marginTop: 10,
            width: 520,
            maxWidth: "calc(100vw - 24px)",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(7, 11, 24, 0.92)",
            boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
            overflow: "hidden",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            maxHeight: 520, 
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>

            <button
              type="button"
              className="fd-link"
              onClick={markAllRead}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.85)",
                textDecoration: "underline",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Mark all as read
            </button>
          </div>

          <div style={{ padding: 12, display: "grid", gap: 10, overflowY: "auto", minHeight: 0 }}>
            {error && (
              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  background: "rgba(255, 77, 125, 0.12)",
                  border: "1px solid rgba(255, 77, 125, 0.35)",
                  color: "var(--danger)",
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            {!error && loading && items.length === 0 && (
              <div style={{ color: "rgba(255,255,255,0.75)" }}>Loading…</div>
            )}

            {!error && !loading && items.length === 0 && (
              <div style={{ color: "rgba(255,255,255,0.75)" }}>No notifications</div>
            )}

            {items.map((n) => {
              const href = getNotificationHref(n);
              const isUnread = !n.readAt;

              return (
                <a
                  key={n.id}
                  href={href ?? "#"}
                  onClick={(e) => {
                    e.preventDefault();
                    markOneRead(n);
                  }}
                  style={{
                    textDecoration: "none",
                    display: "block",
                    background: isUnread ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 14,
                    padding: 12,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 800, color: "rgba(255,255,255,0.92)" }}>
                    {n.title}
                    {isUnread && (
                      <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.8 }}>
                        • new
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: 4, color: "rgba(255,255,255,0.80)" }}>
                    {n.body}
                  </div>

                  <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                    {formatDate(n.createdAt)}
                    {href ? (
                      <span style={{ marginLeft: 10, opacity: 0.85 }}>
                        → Open source
                      </span>
                    ) : null}
                  </div>
                </a>
              );
            })}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 6,
              }}
            >
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.85)",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {expanded ? "Show less" : "Show more"}
              </button>

              {nextCursor && (
                <button
                  type="button"
                  onClick={() => loadInbox({ append: true, cursor: nextCursor })}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(255,255,255,0.85)",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Load more
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}