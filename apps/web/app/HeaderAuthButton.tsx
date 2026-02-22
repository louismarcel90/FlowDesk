'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearTokens, isLoggedIn } from '../lib/auth';

export function HeaderAuthButton() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const sync = () => setLoggedIn(isLoggedIn());
    sync();

    window.addEventListener('storage', sync);
    window.addEventListener('flowdesk-auth-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('flowdesk-auth-changed', sync);
    };
  }, []);

  if (!loggedIn) {
    return (
      <a className="fd-nav-link" href="/login">
        Login
      </a>
    );
  }

  return (
    <button
      type="button"
      className="fd-nav-link"
      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff' }}
      onClick={() => {
        clearTokens();
        router.push('/login');
        router.refresh();
      }}
    >
      Logout
    </button>
  );
}
