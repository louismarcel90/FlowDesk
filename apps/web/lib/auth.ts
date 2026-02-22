// apps/web/lib/auth.ts
export const ACCESS_KEY = 'flowdesk_access_token';
export const REFRESH_KEY = 'flowdesk_refresh_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  // notifier le header & le reste de l'app
  window.dispatchEvent(new Event('flowdesk-auth-changed'));
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  window.dispatchEvent(new Event('flowdesk-auth-changed'));
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}
