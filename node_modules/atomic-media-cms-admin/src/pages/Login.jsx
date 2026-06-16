import React, { useState } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-icon"><Lock size={24} /></div>
        <h1>Atomic CMS</h1>
        <input placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        {error && <p className="error">{error}</p>}
        <button>Sign in</button>
      </form>
    </main>
  );
}
