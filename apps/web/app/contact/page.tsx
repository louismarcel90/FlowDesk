'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sent'>('idle');

  function submit(e: React.FormEvent) {
    e.preventDefault();

    // MVP: front-end only (no backend email sending)
    // Later: POST /contact -> creates ticket + sends email (notification system)
    setStatus('sent');

    // reset fields (optional)
    setName('');
    setEmail('');
    setCompany('');
    setMessage('');
  }

  return (
    <main className="fd-grid" style={{ maxWidth: 760, margin: '0 auto' }}>
      <section className="fd-hero fd-stack">
        <h1>Contact Us</h1>
        <p>
          Have a question, a request, or want a product demo? Send us a message and we’ll get back to you.
        </p>
      </section>

      <section className="fd-card">
        <div className="fd-card-header">
          <div>
            <div className="fd-card-title">Message</div>
            <div className="fd-card-subtitle">We typically respond within 1–2 business days.</div>
          </div>
        </div>

        <div className="fd-card-inner">
          {status === 'sent' && (
            <div
              style={{
                padding: 12,
                borderRadius: 14,
                border: '1px solid rgba(46,233,166,0.35)',
                background: 'rgba(46,233,166,0.10)',
                color: 'rgba(255,255,255,0.9)',
                marginBottom: 12
              }}
            >
              ✅ Message sent. Thanks — we’ll reach out soon.
            </div>
          )}

          <form onSubmit={submit} className="fd-stack">
            <div className="fd-row fd-wrap" style={{ alignItems: 'flex-start' }}>
              <label className="fd-label" style={{ flex: 1, minWidth: 220 }}>
                Name
                <input
                  className="fd-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </label>

              <label className="fd-label" style={{ flex: 1, minWidth: 220 }}>
                Email
                <input
                  className="fd-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </label>
            </div>

            <label className="fd-label">
              Company (optional)
              <input
                className="fd-input"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company name"
              />
            </label>

            <label className="fd-label">
              Message
              <textarea
                className="fd-textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help?"
                required
                rows={6}
              />
            </label>

            <div className="fd-row fd-wrap">
              <button className="fd-btn fd-btn--primary" type="submit">
                Send message
              </button>
              {/* <a className="fd-btn fd-btn--ghost" href="/about">
                About FlowDesk
              </a> */}
            </div>
          </form>
        </div>
      </section>

      <section className="fd-card">
        <div className="fd-card-header">
          <div>
            <div className="fd-card-title">Other ways to reach us</div>
            <div className="fd-card-subtitle">For enterprise inquiries and support.</div>
          </div>
        </div>

        <div className="fd-card-inner fd-stack">
          <div className="fd-row fd-wrap">
            <span className="fd-pill">Enterprise</span>
            <span className="fd-pill">Support</span>
            <span className="fd-pill">Security</span>
          </div>

          <ul className="fd-list">
            <li className="fd-item">
              <div className="fd-item-title">Sales</div>
              <div className="fd-item-meta">sales@flowdesk.local (demo)</div>
            </li>
            <li className="fd-item">
              <div className="fd-item-title">Support</div>
              <div className="fd-item-meta">support@flowdesk.local (demo)</div>
            </li>
            <li className="fd-item">
              <div className="fd-item-title">Security</div>
              <div className="fd-item-meta">security@flowdesk.local (demo)</div>
            </li>
          </ul>

          <p style={{ color: 'var(--muted)' }}>
            Note: these addresses are placeholders for the portfolio version.
            In production, connect this form to the notification system (email + ticket).
          </p>
        </div>
      </section>
    </main>
  );
}