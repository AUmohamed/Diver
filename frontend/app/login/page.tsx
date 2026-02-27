"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const GH_ICON = (
  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const btnBase: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 16px",
  border: "2px solid #10162F",
  background: "#ffffff",
  color: "#10162F",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 600,
  textAlign: "left",
  transition: "background 0.15s ease",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        setError(data.message || "Login failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <nav>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="text-xl font-bold tracking-tight" style={{ color: "#10162F" }}>Diver</span>
          </Link>
        </div>
      </nav>

      <div className="flex items-center justify-center px-6 py-20">
        <div
          className="w-full"
          style={{
            maxWidth: "420px",
            padding: "48px 44px",
            background: "#ffffff",
            border: "2px solid #10162F",
            boxShadow: "6px 6px 0 #10162F",
          }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-1" style={{ color: "#10162F" }}>Welcome back</h1>
            <p style={{ color: "rgba(16,22,47,0.55)", fontSize: "15px" }}>Sign in to your Diver account</p>
          </div>

          {/* GitHub button */}
          <button
            type="button"
            style={btnBase}
            onClick={() => { window.location.href = "http://localhost:8000/api/auth/github"; }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--background)")}
            onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}
          >
            {GH_ICON}
            <span>Continue with GitHub</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: "#10162F", opacity: 0.15 }} />
            <span className="text-xs font-semibold" style={{ color: "rgba(16,22,47,0.4)", letterSpacing: "0.05em" }}>OR</span>
            <div className="flex-1 h-px" style={{ background: "#10162F", opacity: 0.15 }} />
          </div>

          {/* Email / password form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-sm font-medium" style={{ background: "#FFF0F0", border: "2px solid #E53E3E", color: "#C53030" }}>
                {error}
              </div>
            )}
            <div>
              <label className="block mb-2 text-xs font-bold tracking-widest" style={{ color: "#10162F" }}>EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full" required />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold tracking-widest" style={{ color: "#10162F" }}>PASSWORD</label>
                <Link href="/forgot-password" className="text-xs font-semibold" style={{ color: "rgba(16,22,47,0.5)", textDecoration: "none" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#10162F")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(16,22,47,0.5)")}
                >
                  Forgot password?
                </Link>
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full" style={{ marginTop: "8px" }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: "rgba(16,22,47,0.55)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold" style={{ color: "#10162F" }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
