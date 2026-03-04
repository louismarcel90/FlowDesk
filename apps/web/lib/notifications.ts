// apps/web/lib/notifications.ts
import { getAccessToken, clearTokens } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function isBrowser() {
  return typeof window !== 'undefined';
}

function redirectToLogin() {
  if (!isBrowser()) return;
  if (window.location.pathname.startsWith('/login')) return;
  window.location.assign('/login');
}

function buildSseUrl(token: string, paramName: 'access_token' | 'token') {
  const t = token.trim();
  return `${API_URL}/notifications/stream?${paramName}=${encodeURIComponent(t)}`;
}

/**
 * Opens the Notifications SSE stream.
 *
 * Important behavior:
 * - Tries `access_token` first (standard).
 * - Falls back once to `token` (some backends use this param).
 * - NEVER logs the user out or clears tokens on SSE errors (SSE can fail transiently).
 *
 * Returns the EventSource instance so callers can close it on unmount.
 */
export function openNotificationsStream(onMessage: (data: any) => void) {
  const token = getAccessToken();
  if (!token) return null;

  let es: EventSource | null = null;
  let fallbackTried = false;

  const attachHandlers = (source: EventSource) => {
    source.onmessage = (evt) => {
      if (!evt.data) return;
      try {
        onMessage(JSON.parse(evt.data));
      } catch {
        onMessage(evt.data);
      }
    };

    source.onerror = () => {
      // Try once with the alternative query param name
      if (!fallbackTried) {
        fallbackTried = true;
        try {
          source.close();
        } catch {}

        es = new EventSource(buildSseUrl(token, 'token'));
        attachHandlers(es);
        return;
      }

      // Do NOT clear tokens / redirect on SSE errors.
      // Just close to avoid noisy reconnect loops.
      try {
        source.close();
      } catch {}
    };
  };

  // 1st attempt: access_token (standard)
  es = new EventSource(buildSseUrl(token, 'access_token'));
  attachHandlers(es);

  return es;
}

/**
 * Optional helper to safely close a stream.
 */
export function closeNotificationsStream(es: EventSource | null) {
  try {
    es?.close();
  } catch {}
}
