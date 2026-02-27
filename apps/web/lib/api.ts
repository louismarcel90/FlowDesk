import { getAccessToken, clearTokens } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();

  const headers = new Headers(init.headers || {});
  if (!headers.has('content-type') && init.body) headers.set('content-type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token.trim()}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  console.log("FETCH URL =", `${API_URL}${path}`);

  // si tu veux: auto-logout sur 401
  if (res.status === 401) {
    // optionnel: clearTokens(); (je recommande de le faire si token invalide)
    // clearTokens();
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.message ?? json?.error?.message ?? `Request failed (${res.status})`);
  }
  return json as T;
}
