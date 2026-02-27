'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/* ── types ── */
interface ImageItem {
  id: string;
  name: string;
  description: string;
  size: string;
  source: 'upload' | 'github';
  dockerImage: string | null;
  buildStatus: 'pending' | 'building' | 'success' | 'failed';
  buildError: string | null;
  originalName: string | null;
  createdAt: string;
}

/* ── nav ── */
function Nav() {
  return (
    <nav style={{ borderBottom: '2px solid rgba(16,22,47,0.08)', background: '#fff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '17px', fontWeight: 800, color: '#10162F', letterSpacing: '-0.4px' }}>Diver</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/push" style={{ textDecoration: 'none', fontSize: '13px', fontWeight: 600, color: 'rgba(16,22,47,0.5)' }}>
            Push
          </Link>
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 600, color: 'rgba(16,22,47,0.5)' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ── status badge config ── */
const STATUS_CFG: Record<string, { bg: string; border: string; color: string; label: string; pulse?: boolean }> = {
  pending:  { bg: '#F5F3FF', border: '#C4B5FD', color: '#6D28D9', label: 'Queued' },
  building: { bg: '#FFFBEB', border: '#FCD34D', color: '#B45309', label: 'Building', pulse: true },
  success:  { bg: '#F0FDF4', border: '#86EFAC', color: '#15803D', label: 'Ready' },
  failed:   { bg: '#FFF1F2', border: '#FCA5A5', color: '#B91C1C', label: 'Failed' },
};

/* ── source badge ── */
function SourceBadge({ source }: { source: 'upload' | 'github' }) {
  return (
    <span style={{
      padding: '1px 7px',
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      background: source === 'github' ? '#0F1117' : 'rgba(16,22,47,0.08)',
      color:      source === 'github' ? '#fff'    : 'rgba(16,22,47,0.6)',
      border:     source === 'github' ? '1.5px solid #0F1117' : '1.5px solid rgba(16,22,47,0.15)',
    }}>
      {source === 'github' ? '⑂ GitHub' : '↑ Upload'}
    </span>
  );
}

/* ── image card ── */
function ImageCard({ image, token, onRefresh }: { image: ImageItem; token: string; onRefresh: () => void }) {
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError]         = useState('');
  const s = STATUS_CFG[image.buildStatus] ?? STATUS_CFG.success;

  const canDownload = image.buildStatus === 'success' && (image.dockerImage || image.originalName);

  const handleDownload = async () => {
    setDownloading(true); setDlError('');
    try {
      const res = await fetch(`http://localhost:8000/images/${image.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setDlError('Download failed'); return; }

      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;

      // Choose filename: .tar for Docker images, original name for raw files
      if (image.dockerImage) {
        a.download = `${image.name.replace(/[^a-z0-9_-]/gi, '-')}.tar`;
      } else {
        a.download = image.originalName || image.name;
      }

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch {
      setDlError('Could not reach server');
    } finally {
      setDownloading(false);
    }
  };

  const dateStr = new Date(image.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div style={{ background: '#fff', border: '2px solid #10162F', boxShadow: '4px 4px 0 #10162F' }}>

      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1.5px solid rgba(16,22,47,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#10162F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {image.name}
          </span>
          <SourceBadge source={image.source} />
        </div>

        {/* Status badge */}
        <span style={{
          display:       'inline-flex',
          alignItems:    'center',
          gap:           '5px',
          padding:       '3px 10px',
          background:    s.bg,
          border:        `1.5px solid ${s.border}`,
          color:         s.color,
          fontSize:      '11px',
          fontWeight:    700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          flexShrink:    0,
        }}>
          {s.pulse && (
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B', animation: 'pulse 1.2s ease-in-out infinite', display: 'inline-block' }} />
          )}
          {s.label}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 20px 16px' }}>

        {/* Description */}
        {image.description && (
          <p style={{ fontSize: '13px', color: 'rgba(16,22,47,0.55)', marginBottom: '10px' }}>{image.description}</p>
        )}

        {/* Docker image name */}
        {image.dockerImage && (
          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: '#0F1117', border: '1.5px solid #10162F' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7DD3FC" strokeWidth="2" style={{ flexShrink: 0 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <code style={{ fontFamily: 'monospace', fontSize: '12px', color: '#7DD3FC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {image.dockerImage}
            </code>
          </div>
        )}

        {/* Build error */}
        {image.buildStatus === 'failed' && image.buildError && (
          <div style={{ marginBottom: '10px', padding: '9px 12px', background: '#FFF1F2', border: '1.5px solid #FCA5A5' }}>
            <p style={{ fontSize: '12px', color: '#B91C1C', margin: 0 }}>
              <strong>Build error:</strong> {image.buildError}
            </p>
          </div>
        )}

        {/* Building spinner */}
        {image.buildStatus === 'building' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'rgba(16,22,47,0.45)', fontSize: '12px' }}>
            <div style={{ width: '14px', height: '14px', border: '2px solid rgba(16,22,47,0.12)', borderTop: '2px solid #B45309', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            Building Docker image… check back in a moment.
          </div>
        )}

        {/* Pending hint */}
        {image.buildStatus === 'pending' && (
          <p style={{ fontSize: '12px', color: 'rgba(16,22,47,0.45)', marginBottom: '10px', fontStyle: 'italic' }}>
            Queued — build will start shortly.
          </p>
        )}

        {/* Download error */}
        {dlError && (
          <p style={{ fontSize: '12px', color: '#B91C1C', marginBottom: '8px' }}>{dlError}</p>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 20px', borderTop: '1.5px solid rgba(16,22,47,0.07)', background: 'rgba(16,22,47,0.015)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(16,22,47,0.3)' }}>{dateStr}</span>
          {image.size && image.size !== 'Docker image' && (
            <>
              <span style={{ color: 'rgba(16,22,47,0.15)' }}>·</span>
              <span style={{ fontSize: '11px', color: 'rgba(16,22,47,0.3)' }}>{image.size}</span>
            </>
          )}
        </div>

        <button
          onClick={handleDownload}
          disabled={!canDownload || downloading}
          style={{
            display:       'inline-flex',
            alignItems:    'center',
            gap:           '5px',
            padding:       '7px 16px',
            background:    canDownload ? '#10162F' : 'rgba(16,22,47,0.08)',
            color:         canDownload ? '#fff'    : 'rgba(16,22,47,0.3)',
            border:        canDownload ? '2px solid #10162F' : '2px solid transparent',
            boxShadow:     canDownload && !downloading ? '2px 2px 0 rgba(16,22,47,0.3)' : 'none',
            fontWeight:    700,
            fontSize:      '12px',
            letterSpacing: '0.02em',
            cursor:        canDownload && !downloading ? 'pointer' : 'not-allowed',
            transition:    'all 0.12s',
          }}
        >
          {downloading ? (
            <>
              <div style={{ width: '11px', height: '11px', border: '1.5px solid rgba(255,255,255,0.3)', borderTop: '1.5px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Pulling…
            </>
          ) : (
            <>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {canDownload ? 'Pull' : image.buildStatus === 'building' || image.buildStatus === 'pending' ? 'Building…' : 'Unavailable'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ── main page ── */
export default function PullPage() {
  const router                          = useRouter();
  const [token, setToken]               = useState('');
  const [images, setImages]             = useState<ImageItem[]>([]);
  const [loading, setLoading]           = useState(true);

  const fetchImages = useCallback(async (tok: string) => {
    try {
      const res = await fetch('http://localhost:8000/images', {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) {
        const data = await res.json();
        setImages(data);
      }
    } catch (err) {
      console.error('Failed to fetch images:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    fetchImages(t);
  }, [router, fetchImages]);

  // Auto-refresh while any image is still building or pending
  useEffect(() => {
    if (!token) return;
    const hasPending = images.some(i => i.buildStatus === 'building' || i.buildStatus === 'pending');
    if (!hasPending) return;
    const id = setInterval(() => fetchImages(token), 4000);
    return () => clearInterval(id);
  }, [images, token, fetchImages]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Nav />

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Heading */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#10162F', margin: '0 0 5px', letterSpacing: '-0.3px' }}>Pull</h1>
            <p style={{ fontSize: '14px', color: 'rgba(16,22,47,0.5)', margin: 0 }}>Download Docker images built from your repos and uploads.</p>
          </div>
          <Link href="/push" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ fontSize: '13px', padding: '9px 18px', flexShrink: 0 }}>
              + Push Image
            </button>
          </Link>
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: '28px', height: '28px', border: '2px solid rgba(16,22,47,0.12)', borderTop: '2px solid #10162F', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>

        /* Empty state */
        ) : images.length === 0 ? (
          <div style={{ padding: '64px 32px', background: '#fff', border: '2px solid #10162F', boxShadow: '6px 6px 0 #10162F', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', border: '2px solid rgba(16,22,47,0.15)', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="22" height="22" fill="none" stroke="rgba(16,22,47,0.3)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h3 style={{ fontWeight: 700, color: '#10162F', marginBottom: '6px', fontSize: '16px' }}>No images yet</h3>
            <p style={{ color: 'rgba(16,22,47,0.45)', fontSize: '13px', marginBottom: '22px' }}>
              Connect a GitHub repo or upload a project ZIP on the Push page to build your first Docker image.
            </p>
            <Link href="/push" style={{ textDecoration: 'none' }}>
              <button className="btn-primary">Go to Push</button>
            </Link>
          </div>

        /* Image list */
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {images.map(img => (
              <ImageCard key={img.id} image={img} token={token} onRefresh={() => fetchImages(token)} />
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}
