// 'use client';

// import { useEffect, useState } from 'react';
// import { apiFetch } from '../../../lib/api';

// type PageProps = {
//   params: Promise<{ id: string }>;
// }

// export default async function InitiativeDetailPage({ params }: PageProps) {
//   const { id } = await params;
//   const [data, setData] = useState<any>(null);
//   const [error, setError] = useState('');


//   useEffect(() => {
//     apiFetch(`/initiatives/${id}`)
//       .then(setData)
//       .catch((e) => setError(String(e.message ?? e)));
//   }, [id]);

//   if (error) return <main><p style={{ color: 'crimson' }}>{error}</p></main>;
//   if (!data) return <main><p>Loading...</p></main>;

//   return (
//     <main style={{ display: 'grid', gap: 16 }}>
//       <h1>{data.initiative.name}</h1>
//       <p>{data.initiative.description}</p>

//       <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
//         <h2>Linked Decisions</h2>
//         <ul>
//           {data.decisions.map((d: any) => (
//             <li key={d.id}><a href={`/decisions/${d.id}`}>{d.title}</a> — {d.status}</li>
//           ))}
//         </ul>
//       </section>

//       <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
//         <h2>Metrics</h2>
//         <ul>
//           {data.metrics.map((m: any) => (
//             <li key={m.id}>{m.name} ({m.unit}) — {m.direction}</li>
//           ))}
//         </ul>
//       </section>
//     </main>
//   );
// }

import InitiativeDetailClient from "./initiativeDetailClient";

type PageProps = {
  params: Promise<{ id: string }>; 
};

export default async function InitiativeDetailPage({ params }: PageProps) {
  const { id } = await params; 
  return <InitiativeDetailClient id={id} />;
}
