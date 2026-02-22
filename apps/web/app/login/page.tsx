// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { apiFetch } from '../../lib/api';

// type LoginResponse = {
//   accessToken: string;
//   refreshToken?: string;
// };

// export default function LoginPage() {
//   const router = useRouter();

//   const [email, setEmail] = useState('alice@example.com');
//   const [password, setPassword] = useState('Password123!');
//   const [orgId, setOrgId] = useState('4f443ab0-c6b9-49ed-960d-f0af51ff9eee');

//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       const res = await apiFetch<LoginResponse>('/auth/login', {
//         method: 'POST',
//         headers: {
//           'content-type': 'application/json',
//         },
//         body: JSON.stringify({ email, password, orgId }),
//       });

//       if (!res?.accessToken || typeof res.accessToken !== 'string') {
//         throw new Error('Invalid response from server (missing accessToken)');
//       }

//       // Nettoie les anciennes clés (pour éviter collisions / vieux code)
//       localStorage.removeItem('access_token');
//       localStorage.removeItem('refreshToken');

//       // ✅ Clés attendues par apps/web/lib/api.ts
//       localStorage.setItem('flowdesk_access_token', res.accessToken);
//       if (res.refreshToken) {
//         localStorage.setItem('flowdesk_refresh_token', res.refreshToken);
//       } else {
//         localStorage.removeItem('flowdesk_refresh_token');
//       }

//       // Redirige
//       router.push('/dashboard');
//       router.refresh();
//     } catch (err: any) {
//       // Si login échoue, on évite de laisser un token invalide traîner
//       localStorage.removeItem('flowdesk_access_token');
//       localStorage.removeItem('flowdesk_refresh_token');

//       setError(err?.message ?? 'Login failed');
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <main className="fd-grid" style={{ maxWidth: 520, margin: '40px auto' }}>
//       <div className="fd-card">
//         <div className="fd-card-header">
//           <div>
//             <div className="fd-card-title">Login to FlowDesk</div>
//             <div className="fd-card-subtitle">Access your organization workspace</div>
//           </div>
//         </div>

//         <div className="fd-card-inner">
//           <form onSubmit={handleSubmit} className="fd-stack">
//             <label className="fd-label">
//               Organization ID
//               <input
//                 className="fd-input"
//                 value={orgId}
//                 onChange={(e) => setOrgId(e.target.value)}
//                 required
//                 placeholder="org_123"
//               />
//             </label>

//             <label className="fd-label">
//               Email
//               <input
//                 type="email"
//                 className="fd-input"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//                 placeholder="you@company.com"
//               />
//             </label>

//             <label className="fd-label">
//               Password
//               <input
//                 type="password"
//                 className="fd-input"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//                 placeholder="••••••••"
//               />
//             </label>

//             {error && (
//               <div
//                 style={{
//                   padding: 10,
//                   borderRadius: 12,
//                   background: 'rgba(255, 77, 125, 0.12)',
//                   border: '1px solid rgba(255, 77, 125, 0.35)',
//                   color: 'var(--danger)',
//                 }}
//               >
//                 {error}
//               </div>
//             )}

//             <button type="submit" disabled={loading} className="fd-btn fd-btn--primary">
//               {loading ? 'Signing in…' : 'Sign In'}
//             </button>
//           </form>
//         </div>
//       </div>
//     </main>
//   );
// }


'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import { setTokens } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('alice@example.com');
  const [password, setPassword] = useState('Password123!');
  const [orgId, setOrgId] = useState('4f443ab0-c6b9-49ed-960d-f0af51ff9eee');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch<{ accessToken: string; refreshToken?: string }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password, orgId }),
        }
      );

      if (!res?.accessToken) throw new Error('Invalid response from server');

      setTokens(res.accessToken, res.refreshToken);
      router.push('/');
    } catch (err: any) {
      setError(err?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="fd-grid" style={{ maxWidth: 520, margin: '40px auto' }}>
      <div className="fd-card">
        <div className="fd-card-header">
          <div>
            <div className="fd-card-title">Login to FlowDesk</div>
            <div className="fd-card-subtitle">Access your organization workspace</div>
          </div>
        </div>

        <div className="fd-card-inner">
          <form onSubmit={handleSubmit} className="fd-stack">
            <label className="fd-label">
              Organization ID
              <input className="fd-input" value={orgId} onChange={(e) => setOrgId(e.target.value)} required />
            </label>

            <label className="fd-label">
              Email
              <input className="fd-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>

            <label className="fd-label">
              Password
              <input className="fd-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>

            {error && (
              <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,77,125,0.12)', border: '1px solid rgba(255,77,125,0.35)', color: 'var(--danger)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="fd-btn fd-btn--primary">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
