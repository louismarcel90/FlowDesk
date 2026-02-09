'use client';

import { useState } from 'react';
import { apiFetch } from '../../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('alice@example.com');
  const [password, setPassword] = useState('password123');
  const [orgId, setOrgId] = useState('');
  const [msg, setMsg] = useState('');

  async function onRegister() {
    setMsg('...');
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName: 'Alice', orgName: 'FlowDesk Inc' })
    });
    localStorage.setItem('flowdesk_access_token', res.accessToken);
    localStorage.setItem('flowdesk_refresh_token', res.refreshToken);
    localStorage.setItem('flowdesk_org_id', res.org.id);
    setOrgId(res.org.id);
    setMsg('Registered + logged in.');
  }

  async function onLogin() {
    setMsg('...');
    const oid = orgId || localStorage.getItem('flowdesk_org_id') || '';
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, orgId: oid })
    });
    localStorage.setItem('flowdesk_access_token', res.accessToken);
    localStorage.setItem('flowdesk_refresh_token', res.refreshToken);
    setMsg('Logged in.');
  }

  return (
    <main>
      <h1>Login</h1>
      <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%' }} />
        </label>
        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%' }} />
        </label>
        <label>
          OrgId (after register)
          <input value={orgId} onChange={(e) => setOrgId(e.target.value)} style={{ width: '100%' }} />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onRegister}>Register</button>
          <button onClick={onLogin}>Login</button>
        </div>
        <p>{msg}</p>
      </div>
    </main>
  );
}
