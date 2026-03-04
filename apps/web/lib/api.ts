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
  if (token) headers.set('Authorization', `Bearer ${token.trim()}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    // credentials: 'omit',
  });

  console.log('FETCH URL =', `${API_URL}${path}`);

  // ✅ auto-logout sur 401 (token expiré/invalid)
  if (res.status === 401) {
    // évite des boucles: si pas de token, ne spam pas clearTokens
    if (token) clearTokens();

    // Si l'appel était "non-auth" on laisse l'appelant gérer.
    // Ici on ne throw pas tout de suite; on laisse la suite parser le body si possible.
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    // message propre
    const msg =
      json?.message ??
      json?.error?.message ??
      json?.error ??
      `Request failed (${res.status})`;

    throw new Error(msg);
  }

  return json as T;
}