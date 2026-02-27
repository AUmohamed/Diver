'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) {
      router.push('/login');
    } else if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <nav>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight" style={{ color: '#10162F' }}>Diver</span>
          <div className="flex items-center gap-4">
            <Link href="/account" className="p-2 transition-colors" title="Account" style={{ color: '#10162F' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
            <span className="text-sm" style={{ color: 'rgba(16,22,47,0.5)' }}>
              {user?.username || 'User'}
            </span>
            <button
              onClick={handleLogout}
              className="card text-sm font-semibold"
              style={{ cursor: 'pointer', background: '#ffffff', padding: '8px 18px' }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16 animate-fade-in" style={{ marginTop: '80px' }}>
          <h1 className="text-4xl font-bold mb-3" style={{ color: '#10162F' }}>Dive into the Ocean</h1>
          <p className="text-lg" style={{ color: 'rgba(16,22,47,0.6)' }}>Store and share your MERN stack Docker images</p>
        </div>

        <div className="flex justify-center gap-10" style={{ marginTop: '60px' }}>
          {/* Push card */}
          <Link
            href="/push"
            className="card animate-fade-in text-center"
            style={{
              animationDelay: '0.1s',
              width: '300px',
              padding: '56px 48px',
              textDecoration: 'none',
            }}
          >
            <div
              className="flex items-center justify-center mb-7 mx-auto"
              style={{
                width: '72px',
                height: '72px',
                background: 'var(--primary)',
                border: '2px solid #10162F',
              }}
            >
              <svg className="w-9 h-9" style={{ color: '#ffffff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l-5 3 5 3M16 9l5 3-5 3M14 5l-4 14" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#10162F' }}>Push</h2>
            <p style={{ color: 'rgba(16,22,47,0.6)', fontSize: '15px' }}>Connect a GitHub repo and auto-build Docker images</p>
          </Link>

          {/* Pull card */}
          <Link
            href="/pull"
            className="card animate-fade-in text-center"
            style={{
              animationDelay: '0.2s',
              width: '300px',
              padding: '56px 48px',
              textDecoration: 'none',
            }}
          >
            <div
              className="flex items-center justify-center mb-7 mx-auto"
              style={{
                width: '72px',
                height: '72px',
                background: 'var(--primary)',
                border: '2px solid #10162F',
              }}
            >
              <svg className="w-9 h-9" style={{ color: '#ffffff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8 4-8-4M20 7v10l-8 4M20 7L12 3 4 7m8 4v10" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#10162F' }}>Pull</h2>
            <p style={{ color: 'rgba(16,22,47,0.6)', fontSize: '15px' }}>Browse and download your built images</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
