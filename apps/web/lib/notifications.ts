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

export function openNotificationsStream(onMessage: (data: any) => void) {
  const token = getAccessToken();

  // ✅ si pas connecté, on ne fait rien (évite 401 + spam console)
  if (!token) return null;

  // SSE: EventSource ne supporte pas Authorization header,
  // donc token en query string OK.
  const url = `${API_URL}/notifications/stream?access_token=${encodeURIComponent(
    token.trim(),
  )}`;

  // ✅ IMPORTANT: withCredentials doit rester FALSE sinon CORS exige Allow-Credentials:true
  const es = new EventSource(url, { withCredentials: false });

  es.onmessage = (evt) => {
    if (!evt.data) return;
    try {
      onMessage(JSON.parse(evt.data));
    } catch {
      // au cas où ce n'est pas JSON
      onMessage(evt.data);
    }
  };

  es.onerror = () => {
    // On ne peut pas lire le status HTTP depuis EventSource.
    // Donc on fait un fallback simple: si token absent -> logout.
    // Et si le token est là mais stream cassé, on laisse l'app décider (reconnect UI etc).
    const stillToken = getAccessToken();
    if (!stillToken) {
      clearTokens();
      redirectToLogin();
      try {
        es.close();
      } catch {}
    }
  };

  return es;
}
