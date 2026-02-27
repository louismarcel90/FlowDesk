// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { apiFetch } from '../../../lib/api';
// import { Principal } from '../../../../api/src/modules/auth/auth.types';


// type MeResponse = {
//   ok: boolean;
//   principal: Principal;
// };

// type OptionDraft = {
//   label: string;
//   prosText: string; // textarea -> lines
//   consText: string; // textarea -> lines
// };

// function linesToArray(s: string): string[] {
//   return s
//     .split('\n')
//     .map((x) => x.trim())
//     .filter(Boolean);
// }

// export default function CreateDecisionPage() {
//   const router = useRouter();

//   const [me, setMe] = useState<Principal | null>(null);
//   const [loadingMe, setLoadingMe] = useState(true);

//   // Required-ish
//   const [title, setTitle] = useState('');
//   const [summary, setSummary] = useState('');
//   const [recommendation, setRecommendation] = useState('');

//   // Context block (backend expects these keys)
//   const [problem, setProblem] = useState('');
//   const [goal, setGoal] = useState('');
//   const [constraints, setConstraints] = useState('');
//   const [assumptions, setAssumptions] = useState('');

//   // Options array
//   const [options, setOptions] = useState<OptionDraft[]>([
//     { label: 'Option 1', prosText: '', consText: '' },
//     { label: 'Option 2', prosText: '', consText: '' },
//   ]);

//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState<string>('');

//   // Load principal (owner/orgId) from backend
//   useEffect(() => {
//     let mounted = true;
//     setLoadingMe(true);

//     apiFetch<MeResponse>('/me')
//       .then((res) => {
//         if (!mounted) return;
//         if (!res?.ok || !res?.principal?.userId || !res?.principal?.orgId) {
//           throw new Error('Unable to load current user (/me).');
//         }
//         setMe(res.principal);
//       })
//       .catch((e) => {
//         if (!mounted) return;
//         setMe(null);
//         setError(String(e?.message ?? e));
//       })
//       .finally(() => {
//         if (!mounted) return;
//         setLoadingMe(false);
//       });

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   const canSubmit = useMemo(() => {
//     if (!me) return false;
//     if (title.trim().length < 3) return false;
//     if (summary.trim().length < 10) return false;
//     if (problem.trim().length < 5) return false;
//     if (goal.trim().length < 3) return false;
//     if (recommendation.trim().length < 3) return false;

//     // at least 1 option with label
//     const validOptions = options.filter((o) => o.label.trim().length > 0);
//     if (validOptions.length === 0) return false;

//     return true;
//   }, [me, title, summary, problem, goal, recommendation, options]);

//   function addOption() {
//     setOptions((prev) => [
//       ...prev,
//       { label: `Option ${prev.length + 1}`, prosText: '', consText: '' },
//     ]);
//   }

//   function removeOption(idx: number) {
//     setOptions((prev) => prev.filter((_, i) => i !== idx));
//   }

//   function resetForm() {
//     setTitle('');
//     setSummary('');
//     setRecommendation('');
//     setProblem('');
//     setGoal('');
//     setConstraints('');
//     setAssumptions('');
//     setOptions([
//       { label: 'Option 1', prosText: '', consText: '' },
//       { label: 'Option 2', prosText: '', consText: '' },
//     ]);
//     setError('');
//   }

//   async function onSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setError('');

//     if (!me) {
//       setError('You must be logged in to create a decision.');
//       return;
//     }
//     if (!canSubmit) {
//       setError('Please complete the required fields.');
//       return;
//     }

//     const payload = {
//       title: title.trim(),
//       initial: {
//         summary: summary.trim(),
//         context: {
//           problem: problem.trim(),
//           goal: goal.trim(),
//           constraints: constraints.trim(),
//           assumptions: assumptions.trim(),
//         },
//         options: options
//           .filter((o) => o.label.trim().length > 0)
//           .map((o) => ({
//             label: o.label.trim(),
//             pros: linesToArray(o.prosText),
//             cons: linesToArray(o.consText),
//           })),
//         recommendation: recommendation.trim(),
//         owner: me.userId,
//         orgId: me.orgId,
//       },
//     };

//     setSubmitting(true);
//     try {
//       const res = await apiFetch<{ id: string }>('/decisions', {
//         method: 'POST',
//         body: JSON.stringify(payload),
//       });

//       if (!res?.id) throw new Error('Invalid response: missing decision id');

//       // Redirect back to list and refresh it
//        router.replace('/decisions');
//     } catch (err: any) {
//       setError(String(err?.message ?? err));
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   return (
//     <main className="fd-shell">
//       <div className="fd-toolbar">
//         <h1 className="fd-page-title">Create decision</h1>
//       </div>

//       <section className="fd-card fd-card--form">
//         <div className="fd-form-head">
//     <div>
//       <div className="fd-kv">
//         <div className="fd-ro" title={me?.orgId ?? ''}>
//           <div className="k">Organization</div>
//           <div className="v">{me?.orgId ?? '—'}</div>
//         </div>
//         <div className="fd-ro" title={me?.userId ?? ''}>
//           <div className="k">Owner</div>
//           <div className="v">{me?.userId ?? '—'}</div>
//         </div>
//       </div>
//     </div>

//     <div style={{ display: 'flex', gap: 10 }}>
//       <button type="button" className="fd-btn" onClick={resetForm}>
//         Reset
//       </button>
//     </div>
//   </div>


//         <form onSubmit={onSubmit} className="fd-form">
//           <div className="fd-form-grid">
//             {/* LEFT */}
//             <div style={{ display: 'grid', gap: 14 }}>
//               <div className="fd-field">
//                 <div className="fd-label-row">
//                   <label className="fd-label" htmlFor="title">Titre</label>
//                   <span className="fd-required">*</span>
//                 </div>
//                 <input
//                   id="title"
//                   className="fd-input"
//                   value={title}
//                   onChange={(e) => setTitle(e.target.value)}
//                   placeholder="Ex: Move to Event-Driven Notifications"
//                   minLength={3}
//                   required
//                 />
//                 <div className="fd-help">Minimum 3 caractères.</div>
//               </div>

//               <div className="fd-field">
//                 <div className="fd-label-row">
//                   <label className="fd-label" htmlFor="summary">Summary</label>
//                   <span className="fd-required">*</span>
//                 </div>
//                 <textarea
//                   id="summary"
//                   className="fd-textarea"
//                   value={summary}
//                   onChange={(e) => setSummary(e.target.value)}
//                   placeholder="Replace synchronous notification writes with an event-driven pipeline..."
//                   minLength={10}
//                   required
//                 />
//               </div>

//               <div className="fd-field">
//                 <div className="fd-label-row">
//                   <label className="fd-label" htmlFor="recommendation">Recommendation</label>
//                   <span className="fd-required">*</span>
//                 </div>
//                 <textarea
//                   id="recommendation"
//                   className="fd-textarea"
//                   value={recommendation}
//                   onChange={(e) => setRecommendation(e.target.value)}
//                   placeholder="Adopt event-driven notifications with idempotent writes and retries."
//                   required
//                 />
//               </div>
//             </div>

//             {/* RIGHT */}
//             <aside className="fd-side">
//               <div className="fd-field">
//                 <div className="fd-label-row">
//                   <label className="fd-label" htmlFor="problem">Problem</label>
//                   <span className="fd-required">*</span>
//                 </div>
//                 <textarea
//                   id="problem"
//                   className="fd-textarea"
//                   style={{ minHeight: 120 }}
//                   value={problem}
//                   onChange={(e) => setProblem(e.target.value)}
//                   placeholder="Approvals/comments currently write notifications inline..."
//                   required
//                 />
//               </div>

//               <div className="fd-field">
//                 <div className="fd-label-row">
//                   <label className="fd-label" htmlFor="goal">Goal</label>
//                   <span className="fd-required">*</span>
//                 </div>
//                 <textarea
//                   id="goal"
//                   className="fd-textarea"
//                   style={{ minHeight: 90 }}
//                   value={goal}
//                   onChange={(e) => setGoal(e.target.value)}
//                   placeholder="Decouple API writes from notification delivery..."
//                   required
//                 />
//               </div>

//               <div className="fd-field">
//                 <div className="fd-label-row">
//                   <label className="fd-label" htmlFor="constraints">Constraints</label>
//                   <span className="fd-required">Optional</span>
//                 </div>
//                 <textarea
//                   id="constraints"
//                   className="fd-textarea"
//                   style={{ minHeight: 90 }}
//                   value={constraints}
//                   onChange={(e) => setConstraints(e.target.value)}
//                   placeholder="Must be idempotent; at-least-once delivery; minimal added latency..."
//                 />
//               </div>

//               <div className="fd-field">
//                 <div className="fd-label-row">
//                   <label className="fd-label" htmlFor="assumptions">Assumptions</label>
//                   <span className="fd-required">Optional</span>
//                 </div>
//                 <textarea
//                   id="assumptions"
//                   className="fd-textarea"
//                   style={{ minHeight: 90 }}
//                   value={assumptions}
//                   onChange={(e) => setAssumptions(e.target.value)}
//                   placeholder="Kafka/Redpanda available; a worker consumes events..."
//                 />
//               </div>
//             </aside>
//           </div>

//           {/* OPTIONS */}
//           <div style={{ display: 'grid', gap: 12, marginTop: 6 }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
//               <div>
//                 <div className="fd-label" style={{ fontSize: 14 }}>Options</div>
//               </div>
//               <button type="button" className="fd-btn" onClick={addOption}>
//                 + Add option
//               </button>
//             </div>

//             <div style={{ display: 'grid', gap: 12 }}>
//               {options.map((opt, idx) => (
//                 <div key={idx} className="fd-card" style={{ padding: 14 }}>
//                   <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
//                     <strong style={{ fontSize: 14 }}>Option {idx + 1}</strong>
//                     <button
//                       type="button"
//                       className="fd-btn"
//                       onClick={() => removeOption(idx)}
//                       disabled={options.length <= 1}
//                       title={options.length <= 1 ? 'At least one option is required' : 'Remove option'}
//                     >
//                       Remove
//                     </button>
//                   </div>

//                   <div style={{ display: 'grid', gap: 12, marginTop: 10 }}>
//                     <div className="fd-field">
//                       <label className="fd-label">Label</label>
//                       <input
//                         className="fd-input"
//                         value={opt.label}
//                         onChange={(e) => {
//                           const v = e.target.value;
//                           setOptions((prev) => prev.map((p, i) => (i === idx ? { ...p, label: v } : p)));
//                         }}
//                         placeholder="Event-driven via Kafka + worker"
//                       />
//                     </div>

//                     <div className="fd-inline-2">
//                       <div className="fd-field">
//                         <label className="fd-label">Pros (1 line = 1 pro)</label>
//                         <textarea
//                           className="fd-textarea"
//                           style={{ minHeight: 120 }}
//                           value={opt.prosText}
//                           onChange={(e) => {
//                             const v = e.target.value;
//                             setOptions((prev) => prev.map((p, i) => (i === idx ? { ...p, prosText: v } : p)));
//                           }}
//                           placeholder={'Decouples API\nRetryable processing\nLower latency'}
//                         />
//                       </div>

//                       <div className="fd-field">
//                         <label className="fd-label">Cons (1 line = 1 con)</label>
//                         <textarea
//                           className="fd-textarea"
//                           style={{ minHeight: 120 }}
//                           value={opt.consText}
//                           onChange={(e) => {
//                             const v = e.target.value;
//                             setOptions((prev) => prev.map((p, i) => (i === idx ? { ...p, consText: v } : p)));
//                           }}
//                           placeholder={'More moving parts\nNeed observability'}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* FOOTER */}
//           <div className="fd-form-footer sticky">
//             <button type="button" className="fd-btn" onClick={() => router.push('/decisions')}>
//                 Cancel
//             </button>
//             <button
//               type="submit"
//               className="fd-btn fd-btn--primary"
//               disabled={!me || submitting || !canSubmit}
//               title={!me ? 'Login required' : !canSubmit ? 'Complete required fields' : 'Create decision'}
//             >
//               {submitting ? 'Creating…' : 'Create decision'}
//             </button>
//           </div>
//         </form>
//       </section>
//     </main>
//   );
// }



'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { Principal } from '../../../../api/src/modules/auth/auth.types';

type MeResponse = {
  ok: boolean;
  principal: Principal;
};

type OptionDraft = {
  label: string;
  prosText: string; // textarea -> lines
  consText: string; // textarea -> lines
};

function linesToArray(s: string): string[] {
  return s
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function CreateDecisionPage() {
  const router = useRouter();

  const [me, setMe] = useState<Principal | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  // Required-ish
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [recommendation, setRecommendation] = useState('');

  // Context block (backend expects these keys)
  const [problem, setProblem] = useState('');
  const [goal, setGoal] = useState('');
  const [constraints, setConstraints] = useState('');
  const [assumptions, setAssumptions] = useState('');

  // Options array
  const [options, setOptions] = useState<OptionDraft[]>([
    { label: 'Option 1', prosText: '', consText: '' },
    { label: 'Option 2', prosText: '', consText: '' },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Load principal (owner/orgId) from backend
  useEffect(() => {
    let mounted = true;
    setLoadingMe(true);

    apiFetch<MeResponse>('/me')
      .then((res) => {
        if (!mounted) return;
        if (!res?.ok || !res?.principal?.userId || !res?.principal?.orgId) {
          throw new Error('Unable to load current user (/me).');
        }
        setMe(res.principal);
      })
      .catch((e) => {
        if (!mounted) return;
        setMe(null);
        setError(String(e?.message ?? e));
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingMe(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const validation = useMemo(() => {
    const titleOk = title.trim().length >= 3;
    const summaryOk = summary.trim().length >= 10; // <-- this was blocking you in the screenshot
    const problemOk = problem.trim().length >= 5;
    const goalOk = goal.trim().length >= 3;
    const recommendationOk = recommendation.trim().length >= 3;

    const validOptions = options.filter((o) => o.label.trim().length > 0);
    const optionsOk = validOptions.length > 0;

    const meOk = !!me;

    return {
      meOk,
      titleOk,
      summaryOk,
      problemOk,
      goalOk,
      recommendationOk,
      optionsOk,
      canSubmit:
        meOk && titleOk && summaryOk && problemOk && goalOk && recommendationOk && optionsOk,
    };
  }, [me, title, summary, problem, goal, recommendation, options]);

  function addOption() {
    setOptions((prev) => [
      ...prev,
      { label: `Option ${prev.length + 1}`, prosText: '', consText: '' },
    ]);
  }

  function removeOption(idx: number) {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  }

  function resetForm() {
    setTitle('');
    setSummary('');
    setRecommendation('');
    setProblem('');
    setGoal('');
    setConstraints('');
    setAssumptions('');
    setOptions([
      { label: 'Option 1', prosText: '', consText: '' },
      { label: 'Option 2', prosText: '', consText: '' },
    ]);
    setError('');
  }

  function firstValidationError(): string | null {
    if (!validation.meOk) return 'You must be logged in to create a decision.';
    if (!validation.titleOk) return 'Title must be at least 3 characters.';
    if (!validation.summaryOk) return 'Summary must be at least 10 characters.';
    if (!validation.problemOk) return 'Problem must be at least 5 characters.';
    if (!validation.goalOk) return 'Goal must be at least 3 characters.';
    if (!validation.recommendationOk) return 'Recommendation must be at least 3 characters.';
    if (!validation.optionsOk) return 'At least one option with a label is required.';
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const errMsg = firstValidationError();
    if (errMsg) {
      setError(errMsg);
      return;
    }

    // Build payload in the shape your backend expects
    const payload = {
      title: title.trim(),
      initial: {
        summary: summary.trim(),
        context: {
          problem: problem.trim(),
          goal: goal.trim(),
          constraints: constraints.trim(),
          assumptions: assumptions.trim(),
        },
        options: options
          .filter((o) => o.label.trim().length > 0)
          .map((o) => ({
            label: o.label.trim(),
            pros: linesToArray(o.prosText),
            cons: linesToArray(o.consText),
          })),
        recommendation: recommendation.trim(),
        owner: me!.userId,
        orgId: me!.orgId,
      },
    };

    setSubmitting(true);
    try {
      const res = await apiFetch<{ id: string }>('/decisions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res?.id) throw new Error('Invalid response: missing decision id');

      // Redirect back to list (no refresh here; list should fetch fresh data)
      router.replace('/decisions');
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setSubmitting(false);
    }
    router.push('/decisions');
  }

  return (
    <main className="fd-shell">
      <div className="fd-toolbar">
        <h1 className="fd-page-title">Create decision</h1>
      </div>

      <section className="fd-card fd-card--form">
        <div className="fd-form-head">
          <div>
            <div className="fd-kv">
              <div className="fd-ro" title={me?.orgId ?? ''}>
                <div className="k">Organization</div>
                <div className="v">{me?.orgId ?? '-'}</div>
              </div>
              <div className="fd-ro" title={me?.userId ?? ''}>
                <div className="k">Owner</div>
                <div className="v">{me?.userId ?? '-'}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="fd-btn" onClick={resetForm}>
              Reset
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="fd-form">
          {/* TOP ERROR */}
          {(error || loadingMe) && (
            <div className="fd-alert" role="alert" style={{ marginBottom: 12 }}>
              {loadingMe ? 'Loading user…' : error}
            </div>
          )}

          <div className="fd-form-grid">
            {/* LEFT */}
            <div style={{ display: 'grid', gap: 14 }}>
              <div className="fd-field">
                <div className="fd-label-row">
                  <label className="fd-label" htmlFor="title">
                    Titre
                  </label>
                  <span className="fd-required">*</span>
                </div>
                <input
                  id="title"
                  className="fd-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Move to Event-Driven Notifications"
                  minLength={3}
                  required
                />
                <div className="fd-help">Minimum 3 caractères.</div>
              </div>

              <div className="fd-field">
                <div className="fd-label-row">
                  <label className="fd-label" htmlFor="summary">
                    Summary
                  </label>
                  <span className="fd-required">*</span>
                </div>
                <textarea
                  id="summary"
                  className="fd-textarea"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Replace synchronous notification writes with an event-driven pipeline..."
                  minLength={10}
                  required
                />
                <div className="fd-help">Minimum 10 caractères.</div>
              </div>

              <div className="fd-field">
                <div className="fd-label-row">
                  <label className="fd-label" htmlFor="recommendation">
                    Recommendation
                  </label>
                  <span className="fd-required">*</span>
                </div>
                <textarea
                  id="recommendation"
                  className="fd-textarea"
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  placeholder="Adopt event-driven notifications with idempotent writes and retries."
                  minLength={3}
                  required
                />
                <div className="fd-help">Minimum 3 caractères.</div>
              </div>
            </div>

            {/* RIGHT */}
            <aside className="fd-side">
              <div className="fd-field">
                <div className="fd-label-row">
                  <label className="fd-label" htmlFor="problem">
                    Problem
                  </label>
                  <span className="fd-required">*</span>
                </div>
                <textarea
                  id="problem"
                  className="fd-textarea"
                  style={{ minHeight: 120 }}
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="Approvals/comments currently write notifications inline..."
                  minLength={5}
                  required
                />
                <div className="fd-help">Minimum 5 caractères.</div>
              </div>

              <div className="fd-field">
                <div className="fd-label-row">
                  <label className="fd-label" htmlFor="goal">
                    Goal
                  </label>
                  <span className="fd-required">*</span>
                </div>
                <textarea
                  id="goal"
                  className="fd-textarea"
                  style={{ minHeight: 90 }}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Decouple API writes from notification delivery..."
                  minLength={3}
                  required
                />
                <div className="fd-help">Minimum 3 caractères.</div>
              </div>

              <div className="fd-field">
                <div className="fd-label-row">
                  <label className="fd-label" htmlFor="constraints">
                    Constraints
                  </label>
                  <span className="fd-required">Optional</span>
                </div>
                <textarea
                  id="constraints"
                  className="fd-textarea"
                  style={{ minHeight: 90 }}
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder="Must be idempotent; at-least-once delivery; minimal added latency..."
                />
              </div>

              <div className="fd-field">
                <div className="fd-label-row">
                  <label className="fd-label" htmlFor="assumptions">
                    Assumptions
                  </label>
                  <span className="fd-required">Optional</span>
                </div>
                <textarea
                  id="assumptions"
                  className="fd-textarea"
                  style={{ minHeight: 90 }}
                  value={assumptions}
                  onChange={(e) => setAssumptions(e.target.value)}
                  placeholder="Kafka/Redpanda available; a worker consumes events..."
                />
              </div>
            </aside>
          </div>

          {/* OPTIONS */}
          <div style={{ display: 'grid', gap: 12, marginTop: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <div className="fd-label" style={{ fontSize: 14 }}>
                  Options <span className="fd-required">*</span>
                </div>
                <div className="fd-help">At least one option with a label is required.</div>
              </div>

              <button type="button" className="fd-btn" onClick={addOption}>
                + Add option
              </button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {options.map((opt, idx) => (
                <div key={idx} className="fd-card" style={{ padding: 14 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      alignItems: 'center',
                    }}
                  >
                    <strong style={{ fontSize: 14 }}>Option {idx + 1}</strong>
                    <button
                      type="button"
                      className="fd-btn"
                      onClick={() => removeOption(idx)}
                      disabled={options.length <= 1}
                      title={options.length <= 1 ? 'At least one option is required' : 'Remove option'}
                    >
                      Remove
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: 12, marginTop: 10 }}>
                    <div className="fd-field">
                      <label className="fd-label">Label</label>
                      <input
                        className="fd-input"
                        value={opt.label}
                        onChange={(e) => {
                          const v = e.target.value;
                          setOptions((prev) => prev.map((p, i) => (i === idx ? { ...p, label: v } : p)));
                        }}
                        placeholder="Event-driven via Kafka + worker"
                        required
                        minLength={1}
                      />
                    </div>

                    <div className="fd-inline-2">
                      <div className="fd-field">
                        <label className="fd-label">Pros (1 line = 1 pro)</label>
                        <textarea
                          className="fd-textarea"
                          style={{ minHeight: 120 }}
                          value={opt.prosText}
                          onChange={(e) => {
                            const v = e.target.value;
                            setOptions((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, prosText: v } : p)),
                            );
                          }}
                          placeholder={'Decouples API\nRetryable processing\nLower latency'}
                        />
                      </div>

                      <div className="fd-field">
                        <label className="fd-label">Cons (1 line = 1 con)</label>
                        <textarea
                          className="fd-textarea"
                          style={{ minHeight: 120 }}
                          value={opt.consText}
                          onChange={(e) => {
                            const v = e.target.value;
                            setOptions((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, consText: v } : p)),
                            );
                          }}
                          placeholder={'More moving parts\nNeed observability'}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER */}
          <div className="fd-form-footer sticky">
            <button type="button" className="fd-btn" onClick={() => router.push('/decisions')}>
              Cancel
            </button>

            <button
              type="submit"
              className="fd-btn fd-btn--primary"
              disabled={!me || submitting || !validation.canSubmit}
              title={
                !me
                  ? 'Login required'
                  : submitting
                    ? 'Creating…'
                    : validation.canSubmit
                      ? 'Create decision'
                      : firstValidationError() ?? 'Complete required fields'
              }
            >
              {submitting ? 'Creating…' : 'Create decision'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}