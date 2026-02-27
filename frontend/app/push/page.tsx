'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ── types ── */
interface Repo {
  id: number; name: string; fullName: string;
  description: string | null; private: boolean;
  cloneUrl: string; defaultBranch: string;
}
interface Project {
  _id: string; name: string; repoFullName: string;
  status: 'connected' | 'building' | 'success' | 'failed';
  lastCommit?: { sha: string; message: string; author: string };
  error?: string; connectedAt: string; createdAt: string;
}

/* ── nav ── */
function Nav() {
  return (
    <nav style={{ borderBottom: '2px solid rgba(16,22,47,0.08)', background: '#fff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '17px', fontWeight: 800, color: '#10162F', letterSpacing: '-0.4px' }}>Diver</span>
        </Link>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 600, color: 'rgba(16,22,47,0.5)' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>
      </div>
    </nav>
  );
}

/* ── label helper ── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: '7px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#10162F' }}>
      {children}
    </label>
  );
}

/* ─────────────────────────────────────────────
   UPLOAD VIEW  (email users)
───────────────────────────────────────────── */
function UploadView({ token }: { token: string }) {
  const [name, setName]           = useState('');
  const [description, setDesc]    = useState('');
  const [file, setFile]           = useState<File | null>(null);
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');
  const inputRef                  = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setError(''); setFile(f); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file)        return setError('Please select a file.');
    if (!name.trim()) return setError('Project name is required.');
    setError(''); setUploading(true);
    try {
      const form = new FormData();
      form.append('name', name.trim());
      form.append('description', description.trim());
      form.append('file', file);
      const res  = await fetch('http://localhost:8000/images/push', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      const data = await res.json();
      if (res.ok) setSuccess(true); else setError(data.message || 'Upload failed');
    } catch { setError('Could not reach the server.'); }
    finally { setUploading(false); }
  };

  if (success) return (
    <div style={{ textAlign: 'center', padding: '64px 32px', background: '#fff', border: '2px solid #10162F', boxShadow: '6px 6px 0 #10162F' }}>
      <div style={{ width: '48px', height: '48px', background: '#D1FAE5', border: '2px solid #059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <svg width="22" height="22" fill="none" stroke="#059669" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
      </div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#10162F', marginBottom: '8px' }}>Project uploaded!</h2>
      <p style={{ fontSize: '14px', color: 'rgba(16,22,47,0.5)', marginBottom: '28px' }}>Your project is stored in Diver and will be built into a Docker image.</p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <Link href="/pull" style={{ textDecoration: 'none' }}><button className="btn-primary">View in Pull</button></Link>
        <button onClick={() => { setSuccess(false); setFile(null); setName(''); setDesc(''); }}
          style={{ padding: '10px 20px', border: '2px solid #10162F', background: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
          Upload Another
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#10162F', margin: '0 0 6px', letterSpacing: '-0.3px' }}>Upload a Project</h1>
        <p style={{ fontSize: '14px', color: 'rgba(16,22,47,0.5)', margin: 0 }}>Upload your project file — Diver builds it into a Docker image.</p>
      </div>

      {error && <div style={{ padding: '11px 14px', marginBottom: '18px', background: '#FFF0F0', border: '2px solid #E53E3E', color: '#C53030', fontSize: '13px', fontWeight: 500 }}>{error}</div>}

      <div style={{ marginBottom: '14px' }}>
        <Label>Project Name <span style={{ color: '#E53E3E' }}>*</span></Label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="my-app" required style={{ width: '100%' }} />
      </div>

      <div style={{ marginBottom: '18px' }}>
        <Label>Description <span style={{ fontWeight: 400, textTransform: 'none' as const, letterSpacing: 0, color: 'rgba(16,22,47,0.4)' }}>optional</span></Label>
        <input type="text" value={description} onChange={e => setDesc(e.target.value)} placeholder="Short description" style={{ width: '100%' }} />
      </div>

      <div style={{ marginBottom: '22px' }}>
        <Label>Project File <span style={{ color: '#E53E3E' }}>*</span></Label>
        <div onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{ border: `2px dashed ${dragging ? 'var(--primary)' : file ? '#059669' : 'rgba(16,22,47,0.2)'}`, background: dragging ? 'rgba(91,79,233,0.03)' : file ? '#F0FDF4' : '#fafaf8', padding: '36px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
          <input ref={inputRef} type="file" onChange={e => { const f = e.target.files?.[0]; if (f) { setError(''); setFile(f); } }} style={{ display: 'none' }} />
          {file ? (
            <>
              <div style={{ width: '36px', height: '36px', background: '#D1FAE5', border: '2px solid #059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <svg width="16" height="16" fill="none" stroke="#059669" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p style={{ fontWeight: 700, color: '#065F46', fontSize: '13px', marginBottom: '2px' }}>{file.name}</p>
              <p style={{ color: 'rgba(16,22,47,0.4)', fontSize: '12px' }}>{(file.size / (1024 * 1024)).toFixed(2)} MB · click to change</p>
            </>
          ) : (
            <>
              <svg width="24" height="24" fill="none" stroke="rgba(16,22,47,0.3)" viewBox="0 0 24 24" style={{ margin: '0 auto 10px', display: 'block' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p style={{ fontWeight: 600, color: '#10162F', fontSize: '13px', marginBottom: '3px' }}>Drop file here or click to browse</p>
              <p style={{ color: 'rgba(16,22,47,0.35)', fontSize: '12px' }}>Any file type · Max 2 GB</p>
            </>
          )}
        </div>
      </div>

      <button type="submit" disabled={uploading} className="btn-primary" style={{ width: '100%', opacity: uploading ? 0.6 : 1 }}>
        {uploading ? 'Uploading…' : 'Upload Project'}
      </button>
    </form>
  );
}

/* ─────────────────────────────────────────────
   BUILD LOG
───────────────────────────────────────────── */
function BuildLog({ projectId, status, onBuildEnd }: { projectId: string; status: string; onBuildEnd?: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [open, setOpen]   = useState(status === 'building');
  const bottomRef         = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { io } = require('socket.io-client');
    const socket = io('http://localhost:8000');
    socket.emit('join', projectId);
    socket.on('build:log',      (d: { log: string }) => setLines(p => [...p, d.log]));
    socket.on('build:started',  () => { setLines([]); setOpen(true); });
    socket.on('build:complete', () => { setLines(p => [...p, '✓ Build complete']); onBuildEnd?.(); });
    socket.on('build:failed',   (d: { error: string }) => { setLines(p => [...p, `✗ ${d.error}`]); onBuildEnd?.(); });
    return () => socket.disconnect();
  }, [projectId, onBuildEnd]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);

  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '12px', fontWeight: 600, color: 'rgba(16,22,47,0.4)' }}>
        <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
        {open ? 'Hide' : 'Show'} build log{lines.length > 0 ? ` (${lines.length} lines)` : ''}
      </button>

      {open && (
        <div style={{ marginTop: '8px', background: '#0F1117', border: '2px solid #10162F', padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.7, color: '#E2E8F0', maxHeight: '220px', overflowY: 'auto' }}>
          {lines.length === 0
            ? <span style={{ color: 'rgba(226,232,240,0.35)' }}>{status === 'building' ? 'Waiting for output…' : 'No output yet.'}</span>
            : lines.map((l, i) => <div key={i}>{l}</div>)
          }
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PROJECT CARD
───────────────────────────────────────────── */
const STATUS: Record<string, { bg: string; border: string; color: string; dot?: string; label: string }> = {
  connected: { bg: '#EFF6FF', border: '#93C5FD', color: '#1D4ED8', label: 'Waiting for push' },
  building:  { bg: '#FFFBEB', border: '#FCD34D', color: '#B45309', dot: '#F59E0B', label: 'Building' },
  success:   { bg: '#F0FDF4', border: '#86EFAC', color: '#15803D', label: 'Build succeeded' },
  failed:    { bg: '#FFF1F2', border: '#FCA5A5', color: '#B91C1C', label: 'Build failed' },
};

function ProjectCard({ project, token, onBuildEnd }: { project: Project; token: string; onBuildEnd: () => void }) {
  const s           = STATUS[project.status] ?? STATUS.connected;
  const connectedAt = new Date(project.connectedAt || project.createdAt);
  const dateStr     = connectedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await fetch(`http://localhost:8000/api/github/projects/${project._id}/retry`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      onBuildEnd(); // refresh list
    } finally { setRetrying(false); }
  };

  return (
    <div style={{ background: '#fff', border: '2px solid #10162F', boxShadow: '4px 4px 0 #10162F' }}>

      {/* ── Header ── */}
      <div style={{ padding: '16px 20px', borderBottom: '1.5px solid rgba(16,22,47,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#10162F' }}>{project.name}</span>
          <div style={{ fontSize: '12px', color: 'rgba(16,22,47,0.38)', marginTop: '1px', fontFamily: 'monospace' }}>{project.repoFullName}</div>
        </div>

        {/* Status badge */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', background: s.bg, border: `1.5px solid ${s.border}`, color: s.color, fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>
          {project.status === 'building' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot, animation: 'pulse 1.2s ease-in-out infinite', display: 'inline-block' }} />}
          {s.label}
        </span>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '14px 20px 16px' }}>

        {/* Last commit */}
        {project.lastCommit && (
          <a href={`https://github.com/${project.repoFullName}/commit/${project.lastCommit.sha}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', textDecoration: 'none', padding: '7px 10px', background: 'rgba(16,22,47,0.03)', border: '1.5px solid rgba(16,22,47,0.08)' }}>
            <code style={{ fontSize: '11px', fontWeight: 700, color: '#10162F', background: 'rgba(16,22,47,0.07)', padding: '1px 5px', flexShrink: 0 }}>
              {project.lastCommit.sha}
            </code>
            <span style={{ fontSize: '13px', color: 'rgba(16,22,47,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {project.lastCommit.message}
            </span>
            {project.lastCommit.author && (
              <span style={{ fontSize: '11px', color: 'rgba(16,22,47,0.3)', flexShrink: 0 }}>
                {project.lastCommit.author}
              </span>
            )}
            <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0, color: 'rgba(16,22,47,0.2)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        {/* Idle hint */}
        {project.status === 'connected' && !project.lastCommit && (
          <p style={{ fontSize: '13px', color: 'rgba(16,22,47,0.4)', fontStyle: 'italic', marginBottom: '14px' }}>
            Push to <strong style={{ fontStyle: 'normal', color: 'rgba(16,22,47,0.6)' }}>{project.repoFullName}</strong> to trigger the first build.
          </p>
        )}

        {/* Error detail + retry */}
        {project.status === 'failed' && (
          <div style={{ marginBottom: '14px', padding: '10px 12px', background: '#FFF1F2', border: '1.5px solid #FCA5A5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#B91C1C', flex: 1 }}>{project.error || 'Build failed'}</span>
            <button onClick={handleRetry} disabled={retrying}
              style={{ fontSize: '11px', fontWeight: 700, padding: '4px 12px', background: '#B91C1C', color: '#fff', border: 'none', cursor: retrying ? 'not-allowed' : 'pointer', opacity: retrying ? 0.6 : 1, flexShrink: 0, letterSpacing: '0.03em' }}>
              {retrying ? 'Retrying…' : '↺ Retry'}
            </button>
          </div>
        )}

        <BuildLog projectId={project._id} status={project.status} onBuildEnd={onBuildEnd} />
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '7px 20px', borderTop: '1.5px solid rgba(16,22,47,0.06)', background: 'rgba(16,22,47,0.015)' }}>
        <span style={{ fontSize: '11px', color: 'rgba(16,22,47,0.3)' }}>Connected {dateStr}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   GITHUB VIEW
───────────────────────────────────────────── */
function GitHubView({ token }: { token: string }) {
  const [projects, setProjects]         = useState<Project[]>([]);
  const [repos, setRepos]               = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [loadError, setLoadError]       = useState('');
  const [connecting, setConnecting]     = useState<number | null>(null);
  const [connectError, setConnectError] = useState('');
  const [search, setSearch]             = useState('');
  const [showRepos, setShowRepos]       = useState(false);

  const fetchProjects = () =>
    fetch('http://localhost:8000/api/github/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setProjects(d); });

  useEffect(() => {
    fetchProjects();
    fetch('http://localhost:8000/api/github/repos', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setRepos(d); else setLoadError('Failed to load repos'); })
      .catch(e => setLoadError(e.message))
      .finally(() => setLoadingRepos(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!projects.some(p => p.status === 'building')) return;
    const id = setInterval(fetchProjects, 5000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  const handleConnect = async (repo: Repo) => {
    setConnecting(repo.id); setConnectError('');
    try {
      const res = await fetch('http://localhost:8000/api/github/connect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId: repo.id, repoName: repo.name, repoFullName: repo.fullName, cloneUrl: repo.cloneUrl, defaultBranch: repo.defaultBranch }),
      });
      const data = await res.json();
      if (res.ok) { await fetchProjects(); setShowRepos(false); }
      else setConnectError(data.error || 'Failed to connect');
    } catch { setConnectError('Connection error. Please try again.'); }
    finally { setConnecting(null); }
  };

  /* deduplicate projects — keep newest per repoFullName */
  const dedupedProjects = Array.from(
    projects.reduce((map, p) => {
      const ex = map.get(p.repoFullName);
      if (!ex || new Date(p.connectedAt || p.createdAt) > new Date(ex.connectedAt || ex.createdAt))
        map.set(p.repoFullName, p);
      return map;
    }, new Map<string, Project>()).values()
  );

  const connectedNames = new Set(dedupedProjects.map(p => p.repoFullName));
  const filtered = repos.filter(r =>
    !connectedNames.has(r.fullName) &&
    (r.name.toLowerCase().includes(search.toLowerCase()) || (r.description ?? '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      {/* Page heading */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#10162F', margin: '0 0 5px', letterSpacing: '-0.3px' }}>Push</h1>
          <p style={{ fontSize: '14px', color: 'rgba(16,22,47,0.5)', margin: 0 }}>Connected repos build a Docker image on every push.</p>
        </div>
        <button onClick={() => setShowRepos(s => !s)} className="btn-primary" style={{ fontSize: '13px', padding: '9px 18px', flexShrink: 0 }}>
          {showRepos ? '✕ Cancel' : '+ Connect Repo'}
        </button>
      </div>

      {/* Connect-repo panel */}
      {showRepos && (
        <div style={{ marginBottom: '24px', border: '2px solid #10162F', background: '#fff', padding: '18px 20px', boxShadow: '4px 4px 0 #10162F' }}>
          {connectError && <div style={{ padding: '9px 12px', marginBottom: '12px', background: '#FFF1F2', border: '1.5px solid #FCA5A5', color: '#B91C1C', fontSize: '13px' }}>{connectError}</div>}

          {loadingRepos ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(16,22,47,0.45)', fontSize: '13px' }}>
              <div style={{ width: '16px', height: '16px', border: '2px solid rgba(16,22,47,0.12)', borderTop: '2px solid #10162F', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Loading…
            </div>
          ) : loadError ? (
            <p style={{ color: '#B91C1C', fontSize: '13px', margin: 0 }}>{loadError}</p>
          ) : (
            <>
              {repos.length > 5 && (
                <div style={{ marginBottom: '10px' }}>
                  <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%' }} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                {filtered.length === 0 ? (
                  <p style={{ color: 'rgba(16,22,47,0.4)', fontSize: '13px', margin: '8px 0' }}>
                    {repos.length === 0 ? 'No repositories on GitHub.' : 'All repos are already connected.'}
                  </p>
                ) : filtered.map(repo => (
                  <div key={repo.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', border: '1.5px solid rgba(16,22,47,0.1)', background: '#fafaf8' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#10162F' }}>{repo.name}</span>
                        {repo.private && <span style={{ padding: '1px 5px', background: '#10162F', color: '#fff', fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Private</span>}
                      </div>
                      {repo.description && <p style={{ color: 'rgba(16,22,47,0.45)', fontSize: '12px', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{repo.description}</p>}
                    </div>
                    <button onClick={() => handleConnect(repo)} disabled={connecting === repo.id} className="btn-primary"
                      style={{ fontSize: '12px', padding: '5px 14px', opacity: connecting === repo.id ? 0.5 : 1, flexShrink: 0 }}>
                      {connecting === repo.id ? 'Connecting…' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Project list */}
      {dedupedProjects.length === 0 ? (
        <div style={{ padding: '60px 24px', background: '#fff', border: '2px solid #10162F', textAlign: 'center' }}>
          <div style={{ width: '44px', height: '44px', border: '2px solid rgba(16,22,47,0.15)', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <svg width="18" height="18" fill="none" stroke="rgba(16,22,47,0.35)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l-5 3 5 3M16 9l5 3-5 3M14 5l-4 14" />
            </svg>
          </div>
          <p style={{ fontWeight: 700, color: '#10162F', marginBottom: '5px' }}>No repos connected yet</p>
          <p style={{ color: 'rgba(16,22,47,0.45)', fontSize: '13px', marginBottom: '20px' }}>Connect a GitHub repo and every push builds a Docker image automatically.</p>
          <button onClick={() => setShowRepos(true)} className="btn-primary">+ Connect a Repo</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {dedupedProjects.map(p => <ProjectCard key={p._id} project={p} token={token} onBuildEnd={fetchProjects} />)}
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────
   ROOT PAGE
───────────────────────────────────────────── */
export default function PushPage() {
  const router = useRouter();
  const [token, setToken]     = useState('');
  const [isGitHub, setIsGitHub] = useState<boolean | null>(null);

  useEffect(() => {
    const t   = localStorage.getItem('token');
    const raw = localStorage.getItem('user');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    try { setIsGitHub(!!(JSON.parse(raw || '{}').githubId)); }
    catch { setIsGitHub(false); }
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Nav />
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 80px' }}>
        {isGitHub === null ? null : isGitHub ? <GitHubView token={token} /> : <UploadView token={token} />}
      </main>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}
