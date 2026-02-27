'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [Username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Username, email, password }),
        },
      );

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Nav */}
      <nav>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span className="text-xl font-bold tracking-tight" style={{ color: '#10162F' }}>
              Diver
            </span>
          </Link>
        </div>
      </nav>

      {/* Centered card */}
      <div className="flex items-center justify-center px-6 py-16">
        <div
          className="w-full"
          style={{
            maxWidth: '420px',
            padding: '48px 44px',
            background: '#ffffff',
            border: '2px solid #10162F',
            boxShadow: '6px 6px 0 #10162F',
          }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-1" style={{ color: '#10162F' }}>
              Create account
            </h1>
            <p style={{ color: 'rgba(16,22,47,0.55)', fontSize: '15px' }}>
              Join Diver and start building
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                className="p-3 text-sm font-medium"
                style={{
                  background: '#FFF0F0',
                  border: '2px solid #E53E3E',
                  color: '#C53030',
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label
                className="block mb-2 text-xs font-bold tracking-widest"
                style={{ color: '#10162F' }}
              >
                NAME
              </label>
              <input
                type="text"
                value={Username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div>
              <label
                className="block mb-2 text-xs font-bold tracking-widest"
                style={{ color: '#10162F' }}
              >
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div>
              <label
                className="block mb-2 text-xs font-bold tracking-widest"
                style={{ color: '#10162F' }}
              >
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
              style={{ marginTop: '8px' }}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center mt-6 text-sm" style={{ color: 'rgba(16,22,47,0.55)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold" style={{ color: '#10162F' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
