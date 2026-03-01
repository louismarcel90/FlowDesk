// apps/web/lib/api.ts
import { getAccessToken, clearTokens } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function apiFetch<T = any>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();

  const headers = new Headers(init.headers || {});
  if (!headers.has('content-type') && init.body) {
    headers.set('content-type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token.trim()}`);
  }

  // IMPORTANT:
  // On utilise des Bearer tokens (Authorization), donc on ne veut PAS envoyer cookies.
  // Ça évite le mode credentials=include et le CORS "Allow-Credentials".
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: 'omit',
  });

  console.log('FETCH URL =', `${API_URL}${path}`);

  // ✅ Auto-logout sur 401 (token expiré / invalide)
  if (res.status === 401) {
    clearTokens();

    // Optionnel: rediriger vers /login si on est côté browser
    if (typeof window !== 'undefined') {
      const here = window.location.pathname + window.location.search;
      // évite boucle si déjà sur login
      if (!here.startsWith('/login')) {
        window.location.href = `/login?next=${encodeURIComponent(here)}`;
      }
    }

    // on throw quand même pour que l'appelant sache que ça a échoué
    throw new Error('Unauthorized (401)');
  }

  // Tentative de parse JSON; sinon null
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      json?.message ??
      json?.error?.message ??
      json?.error ??
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return json as T;
}
