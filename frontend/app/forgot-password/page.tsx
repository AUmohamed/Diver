'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [sent, setSent]             = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');
  const [error, setError]           = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('http://localhost:8000/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
        if (data.devResetUrl) setDevResetUrl(data.devResetUrl);
      } else {
        setError(data.message || 'Something went wrong');
      }
    } catch {
      setError('Could not connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* Nav */}
      <nav>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#10162F', letterSpacing: '-0.3px' }}>Diver</span>
          </Link>
        </div>
      </nav>

      {/* Card */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
        <div style={{
          width: '100%', maxWidth: '440px',
          padding: '48px 44px',
          background: '#ffffff',
          border: '2px solid #10162F',
          boxShadow: '6px 6px 0 #10162F',
        }}>
          {sent ? (
            /* ── Success state ── */
            <>
              <div style={{
                width: '48px', height: '48px',
                background: '#D1FAE5', border: '2px solid #059669',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px',
              }}>
                <svg width="22" height="22" fill="none" stroke="#059669" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#10162F', marginBottom: '10px' }}>
                Reset link ready
              </h1>

              {devResetUrl ? (
                /* Dev mode — show the link directly on the page */
                <>
                  <p style={{ color: 'rgba(16,22,47,0.6)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                    Click below to set a new password for <strong>{email}</strong>.
                    The link expires in <strong>1 hour</strong>.
                  </p>
                  <a href={devResetUrl} style={{ textDecoration: 'none' }}>
                    <button className="btn-primary" style={{ width: '100%', marginBottom: '16px' }}>
                      Reset My Password →
                    </button>
                  </a>
                  <div style={{
                    padding: '12px 14px',
                    background: 'var(--background)',
                    border: '2px solid rgba(16,22,47,0.15)',
                    marginBottom: '20px',
                  }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(16,22,47,0.5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Dev mode — no email sent
                    </p>
                    <p style={{ fontSize: '11px', color: 'rgba(16,22,47,0.45)', lineHeight: 1.5 }}>
                      To send real emails, add <code style={{ background: 'rgba(16,22,47,0.08)', padding: '1px 4px' }}>SMTP_HOST</code>,{' '}
                      <code style={{ background: 'rgba(16,22,47,0.08)', padding: '1px 4px' }}>SMTP_USER</code> and{' '}
                      <code style={{ background: 'rgba(16,22,47,0.08)', padding: '1px 4px' }}>SMTP_PASS</code> to your <code style={{ background: 'rgba(16,22,47,0.08)', padding: '1px 4px' }}>.env</code>.
                    </p>
                  </div>
                </>
              ) : (
                /* Production mode — real email was sent */
                <>
                  <p style={{ color: 'rgba(16,22,47,0.6)', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px' }}>
                    We emailed a reset link to <strong>{email}</strong>.
                    Check your inbox — it expires in 1 hour.
                  </p>
                </>
              )}

              <Link href="/login" style={{ textDecoration: 'none' }}>
                <button style={{
                  width: '100%', padding: '10px 16px',
                  background: 'transparent', border: '2px solid rgba(16,22,47,0.2)',
                  color: '#10162F', fontWeight: 600, fontSize: '14px',
                  cursor: 'pointer',
                }}>
                  Back to Sign In
                </button>
              </Link>
            </>
          ) : (
            /* ── Form state ── */
            <>
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#10162F', marginBottom: '8px' }}>
                  Forgot your password?
                </h1>
                <p style={{ color: 'rgba(16,22,47,0.55)', fontSize: '14px' }}>
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div style={{
                  padding: '12px 16px', marginBottom: '20px',
                  background: '#FFF0F0', border: '2px solid #E53E3E',
                  color: '#C53030', fontSize: '13px', fontWeight: 500,
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block', marginBottom: '8px',
                    fontSize: '11px', fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#10162F',
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: '100%', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'rgba(16,22,47,0.5)' }}>
                Remember it?{' '}
                <Link href="/login" style={{ color: '#10162F', fontWeight: 700, textDecoration: 'none' }}>
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
