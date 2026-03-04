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

type ClearTokensOptions = {
  redirectTo?: string; // ex: "/login"
  clearSessionStorage?: boolean; // par défaut true
};

export function clearTokens(options: ClearTokensOptions = {}) {
  if (typeof window === 'undefined') return;

  const { redirectTo, clearSessionStorage = true } = options;

  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);

  if (clearSessionStorage) {
    // utile si tu stockes des infos temporaires (tabs, drafts, etc.)
    sessionStorage.clear();
  }

  window.dispatchEvent(new Event('flowdesk-auth-changed'));

  // optionnel: redirection (si tu l'appelles sur 401 par exemple)
  if (redirectTo) {
    window.location.assign(redirectTo);
  }
}

export function isLoggedIn(): boolean {
  // ✅ correct: logged in = token présent
  return Boolean(getAccessToken());
}
