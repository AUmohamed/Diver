'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      localStorage.setItem('token', token);
      
      fetch('http://localhost:8000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(user => {
          localStorage.setItem('user', JSON.stringify(user));
          router.push('/dashboard');
        })
        .catch(() => {
          router.push('/login?error=auth_failed');
        });
    } else {
      router.push('/login?error=no_token');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--primary)' }}></div>
        <p className="text-white">Logging you in...</p>
      </div>
    </div>
  );
}