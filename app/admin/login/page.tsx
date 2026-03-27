"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push("/admin/dashboard");
    } else {
      setError("Invalid credentials. Please check the demo info below.");
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: "420px", margin: "2rem auto" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🏫</div>
          <h1 style={{ marginBottom: "0.5rem" }}>Admin Login</h1>
          <p style={{ color: "var(--text-muted)" }}>
            Enter your credentials to manage campus queues.
          </p>
        </div>

        {error && (
          <div style={{
            background: "#fee2e2", color: "#991b1b", padding: "0.875rem 1rem",
            borderRadius: "10px", marginBottom: "1.25rem", textAlign: "center",
            fontSize: "0.9375rem", fontWeight: 500,
          }}>
            ✕ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cqm.edu"
              autoComplete="email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.875rem" }}>
            Sign In →
          </button>
        </form>

        {/* Demo Credentials Panel */}
        <div
          style={{
            marginTop: "1.75rem",
            padding: "1rem 1.25rem",
            background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
            borderRadius: "10px",
            border: "1px solid #bfdbfe",
          }}
        >
          <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#1e3a8a", marginBottom: "0.625rem" }}>
            🔑 Demo Credentials
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", color: "#475569", minWidth: "70px", fontWeight: 600 }}>Email:</span>
              <button
                type="button"
                onClick={() => setEmail("admin@cqm.edu")}
                style={{
                  background: "#fff", border: "1px solid #bfdbfe", color: "#1d4ed8",
                  fontFamily: "monospace", cursor: "pointer", padding: "0.2rem 0.6rem",
                  borderRadius: "6px", fontSize: "0.8125rem", fontWeight: 600,
                }}
              >
                admin@cqm.edu
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", color: "#475569", minWidth: "70px", fontWeight: 600 }}>Password:</span>
              <button
                type="button"
                onClick={() => setPassword("password123")}
                style={{
                  background: "#fff", border: "1px solid #bfdbfe", color: "#1d4ed8",
                  fontFamily: "monospace", cursor: "pointer", padding: "0.2rem 0.6rem",
                  borderRadius: "6px", fontSize: "0.8125rem", fontWeight: 600,
                }}
              >
                password123
              </button>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.375rem" }}>
              💡 Click the values above to auto-fill the form.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
