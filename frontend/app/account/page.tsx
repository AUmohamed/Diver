'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Image {
  id: string;
  name: string;
  description: string;
  size: string;
  createdAt: string;
}

interface User {
  name: string;
  email: string;
  username: string;
}

const staticCard: React.CSSProperties = {
  background: '#ffffff',
  border: '2px solid #10162F',
  boxShadow: '6px 6px 0 #10162F',
  transition: 'none',
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) {
      router.push('/login');
      return;
    }
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch { /* ignore */ }
    }
    fetchImages(token);
  }, [router]);

  const fetchImages = async (token: string) => {
    try {
      const res = await fetch('/api/images', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setImages(await res.json());
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const initial = (user?.username || user?.name || 'U')[0].toUpperCase();

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Nav */}
      <nav>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <span className="text-xl font-bold tracking-tight" style={{ color: '#10162F' }}>Diver</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-semibold"
            style={{ color: '#10162F' }}
          >
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-14">

        {/* Profile card */}
        <div style={{ ...staticCard, padding: '40px 44px', marginBottom: '32px' }}>
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: '72px',
                height: '72px',
                background: 'var(--primary)',
                border: '2px solid #10162F',
                fontSize: '28px',
                fontWeight: 800,
                color: '#ffffff',
              }}
            >
              {initial}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-0.5" style={{ color: '#10162F' }}>
                {user?.username || user?.name || 'User'}
              </h1>
              <p className="text-sm" style={{ color: 'rgba(16,22,47,0.5)' }}>
                {user?.email || 'No email on record'}
              </p>
            </div>

            {/* Stats chip */}
            <div
              className="flex-shrink-0 text-center"
              style={{
                border: '2px solid #10162F',
                padding: '10px 20px',
              }}
            >
              <p className="text-2xl font-bold" style={{ color: '#10162F' }}>{images.length}</p>
              <p className="text-xs font-semibold tracking-widest" style={{ color: 'rgba(16,22,47,0.5)' }}>
                {images.length === 1 ? 'IMAGE' : 'IMAGES'}
              </p>
            </div>
          </div>
        </div>

        {/* Images section */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold tracking-tight" style={{ color: '#10162F' }}>
              Pushed Images
            </h2>
            <Link href="/push" className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
              + Push New
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div
                className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
              />
            </div>
          ) : images.length === 0 ? (
            <div style={{ ...staticCard, padding: '48px 40px', textAlign: 'center' }}>
              <div
                className="flex items-center justify-center mx-auto mb-5"
                style={{ width: '56px', height: '56px', border: '2px solid #10162F', background: 'var(--background)' }}
              >
                <svg className="w-6 h-6" style={{ color: 'rgba(16,22,47,0.35)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: '#10162F' }}>No images yet</h3>
              <p className="text-sm mb-6" style={{ color: 'rgba(16,22,47,0.55)' }}>
                Connect a GitHub repo and push your first MERN project
              </p>
              <Link href="/push" className="btn-primary inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l-5 3 5 3M16 9l5 3-5 3M14 5l-4 14" />
                </svg>
                Push Your First Image
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="animate-fade-in"
                  style={{ ...staticCard, padding: '20px 24px', animationDelay: `${index * 0.07}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-base" style={{ color: '#10162F' }}>{image.name}</h3>
                        <span
                          className="text-xs font-semibold px-2 py-0.5"
                          style={{ background: '#10162F', color: '#ffffff' }}
                        >
                          {image.size}
                        </span>
                      </div>
                      {image.description && (
                        <p className="text-sm mb-1" style={{ color: 'rgba(16,22,47,0.6)' }}>{image.description}</p>
                      )}
                      <p className="text-xs" style={{ color: 'rgba(16,22,47,0.4)' }}>
                        Created {formatDate(image.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
