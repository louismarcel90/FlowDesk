import { getAccessToken, clearTokens } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function isBrowser() {
  return typeof window !== "undefined";
}

function redirectToLogin() {
  // ✅ Fix: l'ancien code faisait l'inverse et cassait la redirection
  if (!isBrowser()) return;
  if (window.location.pathname.startsWith("/login")) return;
  window.location.assign("/login");
}

function buildSseUrl(token: string, paramName: "access_token" | "token") {
  const t = token.trim();
  return `${API_URL}/notifications/stream?${paramName}=${encodeURIComponent(t)}`;
}

export function openNotificationsStream(onMessage: (data: any) => void) {
  const token = getAccessToken();

  if (!token) return null;

  let es: EventSource | null = null;
  let fallbackTried = false;

  const attachHandlers = () => {
    if (!es) return;

    es.onmessage = (evt) => {
      if (!evt.data) return;
      try {
        onMessage(JSON.parse(evt.data));
      } catch {
        onMessage(evt.data);
      }
    };

    es.onerror = () => {
      if (!fallbackTried) {
        fallbackTried = true;
        try {
          es?.close();
        } catch {}

        es = new EventSource(buildSseUrl(token, "token"));
        attachHandlers();
        return;
      }
      const stillToken = getAccessToken();
      if (!stillToken) {
        clearTokens();
        redirectToLogin();
        try {
          es?.close();
        } catch {}
      }
    };
  };

  // 1er essai: access_token (standard)
  es = new EventSource(buildSseUrl(token, "access_token"), {
    // ✅ keep false sinon CORS exige Allow-Credentials:true
    withCredentials: false,
  });

  attachHandlers();
  return es;
}