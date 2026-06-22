import React, { useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try { await login(email, password); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">A</div>
        <div>
          <p className="eyebrow" style={{ marginBottom: 4 }}>Admin Portal</p>
          <h1>Atomic CMS</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>
            Sign in to manage your website content, media, and leads.
          </p>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <label className="field">
            <span>Email Address</span>
            <input
              type="email"
              placeholder="admin@atomicmedia.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", background: "var(--danger-bg)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--r)", color: "var(--danger)", fontSize: 13 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Signing in…" : <><Lock size={15} /> Sign in to Dashboard <ArrowRight size={15} /></>}
        </button>

        <p style={{ fontSize: 11, color: "var(--text-dim)", textAlign: "center" }}>
          Atomic Media © {new Date().getFullYear()} — Secure Admin Panel
        </p>
      </form>
    </main>
  );
}
