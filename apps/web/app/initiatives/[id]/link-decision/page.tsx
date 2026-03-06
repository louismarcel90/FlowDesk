'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { Decision } from '../../../../../api/src/modules/decisions/decisions.types';

type DecisionCard = Pick<Decision, 'id' | 'title' | 'status'>;

export default function LinkDecisionPage() {
  const params = useParams<{ id: string }>();
  const initiativeId = params?.id;

  const [q, setQ] = useState('');
  const [items, setItems] = useState<DecisionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');
  const [selected, setSelected] = useState<DecisionCard | null>(null);
  const [success, setSuccess] = useState('');
  const [results, setResults] = useState<Decision[]>([]);

  const DECISIONS_SEARCH_URL = useMemo(
    () => (query: string) => `/decisions?search=${encodeURIComponent(query)}`,
    []
  );

  useEffect(() => {
    setError('');
    setSuccess('');

    const term = q.trim();
    if (term.length === 0) {
      setResults([]);
      return;
    }

    const t = window.setTimeout(async () => {
      try {
        setLoading(true);
        // ⚠️ tes décisions semblent être sur /decisions?search= (pas /impact)
        const res = await apiFetch<Decision[]>(
          `/decisions?search=${encodeURIComponent(term)}`,
        );
        setResults(Array.isArray(res) ? res : []);
      } catch (e: any) {
        setError(String(e?.message ?? e));
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => window.clearTimeout(t);
  }, [q]);

  async function load() {
    setError('');
    setLoading(true);
    try {
      // si q vide, tu peux charger "recent" (backend) ou juste vide
      const res: any = await apiFetch(
        `/decisions?search=${encodeURIComponent(q.trim())}`,
      );
      const arr = Array.isArray(res)
        ? res
        : Array.isArray(res?.items)
          ? res.items
          : [];
      setItems(arr);
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  // live search
  useEffect(() => {
    const t = window.setTimeout(load, 180);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // initial load
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function link() {
    if (!initiativeId || !selected) return;
    setError('');
    setBanner('');
    try {
      setLinking(true);

      await apiFetch(`/impact/initiatives/${initiativeId}/links`, {
        method: 'POST',
        body: JSON.stringify({ decisionId: selected.id }),
      });

      setBanner('Decision linked ✅');
      window.setTimeout(() => setBanner(''), 2500);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLinking(false);
    }
  }

  const canLink = !!selected && !linking;

  return (
    <main className="fd-page">
      <header className="fd-page-header">
        <div className="fd-page-title">
          <h1>Link Decision</h1>
          <p className="fd-page-subtitle">
            Choose a decision to link to this initiative.
          </p>
        </div>

        <div className="fd-row" style={{ gap: 10 }}>
          <Link className="fd-btn" href="/initiatives">
            Back
          </Link>
          <button
            className="fd-btn fd-btn--primary"
            type="button"
            disabled={!canLink}
            aria-disabled={!canLink}
            onClick={link}
            title={!selected ? 'Select a decision first' : 'Link decision'}
          >
            {linking ? 'Linking…' : 'LINK'}
          </button>
        </div>
      </header>

      {(error || banner) && (
        <div className="fd-stack" style={{ gap: 10 }}>
          {error && <div className="fd-alert fd-alert--danger">{error}</div>}
          {banner && <div className="fd-alert fd-alert--success">{banner}</div>}
        </div>
      )}

      <section className="fd-card fd-card--elevated">
        <div className="fd-card-header">
          <div>
            <div className="fd-card-title">Decisions</div>
            <div className="fd-card-subtitle">
              Click a card to select it, then press LINK.
            </div>
          </div>
        </div>

        <div className="fd-card-inner">
          <div className="fd-row" style={{ gap: 10, alignItems: 'center' }}>
            <input
              className="fd-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search decisions…"
            />
          </div>

          <div className="fd-divider" />

          {loading ? (
            <div className="fd-muted">Loading…</div>
          ) : items.length === 0 ? (
            <div className="fd-muted">No decisions found.</div>
          ) : (
            <div className="fd-grid" style={{ gap: 12 }}>
              {items.map((d) => {
                const isActive = selected?.id === d.id;
                return (
                  <div
                    key={d.id}
                    className="fd-decision-card"
                    onClick={() => setSelected(d)}
                    role="button"
                    tabIndex={0}
                    style={{
                      cursor: 'pointer',
                      border: isActive
                        ? '1px solid rgba(124,58,237,.55)'
                        : undefined,
                      background: isActive ? 'rgba(124,58,237,.08)' : undefined,
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setSelected(d);
                    }}
                  >
                    <div className="fd-item-title">{d.title ?? d.id}</div>
                    <div className="fd-item-meta" style={{ marginTop: 10 }}>
                      <span className="fd-chip">{d.id}</span>
                      {d.status ? (
                        <span className="fd-pill">{d.status}</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
