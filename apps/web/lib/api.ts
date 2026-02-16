const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('flowdesk_access_token');
}

export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers = new Headers(init.headers);
  // évite d’écraser un content-type si tu en passes un
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }

  return json as T;
}
