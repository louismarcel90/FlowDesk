'use client';
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api"; // adapte si besoin
import Link from "next/link";

type Props = { id: string };

export default function InitiativeDetailClient({ id }: Props) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    apiFetch(`/initiatives/${id}`)
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e?.message ?? e));
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) return <main><p style={{ color: "crimson" }}>{error}</p></main>;
  if (!data) return <main><p>Loading...</p></main>;

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>{data.initiative?.name}</h1>
      <p>{data.initiative?.description}</p>

      <section style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
        <h2>Linked Decisions</h2>
        <ul>
          {(data.decisions ?? []).map((d: any) => (
            <li key={d.id}>
              <Link href={`/decisions/${d.id}`}>{d.title}</Link> — {d.status}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
        <h2>Metrics</h2>
        <ul>
          {(data.metrics ?? []).map((m: any) => (
            <li key={m.id}>
              <Link href={`/impact/metrics/${m.id}`}>{m.name}</Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
