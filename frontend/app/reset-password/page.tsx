'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') ?? '';

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (!token) setError('Reset link is missing or invalid. Please request a new one.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch {
      setError('Could not connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  /* Strength indicator */
  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6)  s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) s++;
    return s; // 0-3
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][strength];
  const strengthColor = ['', '#E53E3E', '#D97706', '#059669'][strength];

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
          width: '100%', maxWidth: '420px',
          padding: '48px 44px',
          background: '#ffffff',
          border: '2px solid #10162F',
          boxShadow: '6px 6px 0 #10162F',
        }}>
          {done ? (
            /* ── Done state ── */
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
                Password updated!
              </h1>
              <p style={{ color: 'rgba(16,22,47,0.6)', fontSize: '14px', marginBottom: '28px' }}>
                Your password has been changed. Redirecting you to sign in…
              </p>
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <button className="btn-primary" style={{ width: '100%' }}>
                  Sign In Now
                </button>
              </Link>
            </>
          ) : (
            /* ── Form state ── */
            <>
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#10162F', marginBottom: '8px' }}>
                  Set a new password
                </h1>
                <p style={{ color: 'rgba(16,22,47,0.55)', fontSize: '14px' }}>
                  Choose a strong password for your Diver account.
                </p>
              </div>

              {error && (
                <div style={{
                  padding: '12px 16px', marginBottom: '20px',
                  background: '#FFF0F0', border: '2px solid #E53E3E',
                  color: '#C53030', fontSize: '13px', fontWeight: 500,
                }}>
                  {error}
                  {error.includes('missing') && (
                    <span>
                      {' '}<Link href="/forgot-password" style={{ color: '#C53030', textDecoration: 'underline' }}>Request a new link.</Link>
                    </span>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* New password */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={{
                    display: 'block', marginBottom: '8px',
                    fontSize: '11px', fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#10162F',
                  }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Strength bar */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', alignItems: 'center' }}>
                  {[1, 2, 3].map(n => (
                    <div key={n} style={{
                      flex: 1, height: '3px',
                      background: n <= strength ? strengthColor : 'rgba(16,22,47,0.12)',
                      transition: 'background 0.2s',
                    }} />
                  ))}
                  {password && (
                    <span style={{ fontSize: '11px', fontWeight: 600, color: strengthColor, marginLeft: '6px', minWidth: '36px' }}>
                      {strengthLabel}
                    </span>
                  )}
                </div>

                {/* Confirm */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block', marginBottom: '8px',
                    fontSize: '11px', fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#10162F',
                  }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    style={{ width: '100%' }}
                  />
                  {confirm && password !== confirm && (
                    <p style={{ fontSize: '12px', color: '#E53E3E', marginTop: '6px', fontWeight: 500 }}>
                      Passwords don't match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="btn-primary"
                  style={{ width: '100%', opacity: (loading || !token) ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Updating…' : 'Update Password'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'rgba(16,22,47,0.5)' }}>
                <Link href="/login" style={{ color: '#10162F', fontWeight: 700, textDecoration: 'none' }}>
                  ← Back to Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
