// const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// export function getToken() {
//   if (typeof window === 'undefined') return null;
//   return localStorage.getItem('flowdesk_access_token');
// }

// export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
//   const token = getToken();

//   // const headers = new Headers(init.headers);
//   const headers = new Headers();
//   Object.entries(init.headers ?? {}).forEach(([k, v]) => {
//   if (v != null) headers.set(k, String(v));
// });
//   // évite d’écraser un content-type si tu en passes un
//   if (!headers.has('content-type')) headers.set('content-type', 'application/json');
//   if (token) headers.set('Authorization', `Bearer ${token.trim()}`);

//   const res = await fetch(`${API_URL}${path}`, { ...init, headers });

//   const json = await res.json().catch(() => null);

//   if (!res.ok) {
//     throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
//   }

//   return json as T;
// }

// apps/web/lib/api.ts


// apps/web/lib/api.ts

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/+$/, '');

function isBrowser() {
  return typeof window !== 'undefined';
}

export function normalizeAccessToken(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let t = String(raw).trim();

  t = t.replace(/^bearer\s+/i, '').trim();

  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }

  t = t.replace(/^bearer\s+/i, '').trim();

  const looksLikeJwt = t.split('.').length === 3;
  if (!looksLikeJwt) return null;

  return t;
}

export function getToken(): string | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem('flowdesk_access_token');
  return normalizeAccessToken(raw);
}

export function setToken(token: string | null) {
  if (!isBrowser()) return;
  if (!token) {
    window.localStorage.removeItem('flowdesk_access_token');
    return;
  }
  // IMPORTANT: on stocke le token brut, pas JSON.stringify(token)
  window.localStorage.setItem('flowdesk_access_token', token);
}

function buildUrl(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${p}`;
}

async function readBody(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  try {
    return await res.text();
  } catch {
    return null;
  }
}

function mergeHeaders(initHeaders?: HeadersInit): Headers {
  // new Headers(initHeaders) marche pour object | array | Headers
  return new Headers(initHeaders ?? undefined);
}

export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = mergeHeaders(init.headers);

  // Ne pas écraser content-type si déjà défini
  if (!headers.has('content-type') && init.body != null) {
    headers.set('content-type', 'application/json');
  }

  // Ajout Authorization si token valide
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  } else {
    // si pas de token, on enlève au cas où un appelant l’aurait mis
    headers.delete('authorization');
  }

  const url = buildUrl(path);

  const res = await fetch(url, {
    ...init,
    headers,
    // Laisse le navigateur gérer le CORS standard (ne mets surtout pas Access-Control-* côté client)
    // mode: 'cors' // default pour cross-origin, pas nécessaire
  });

  const body = await readBody(res);

  if (!res.ok) {
    const msg =
      (body && typeof body === 'object' && (body as any).error?.message) ||
      (body && typeof body === 'object' && (body as any).message) ||
      (typeof body === 'string' && body) ||
      `Request failed (${res.status})`;

    // Si 401 + token présent => token invalide côté serveur => on purge pour éviter boucle infinie
    if (res.status === 401) {
      setToken(null);
    }

    throw new Error(msg);
  }

  return body as T;
}
