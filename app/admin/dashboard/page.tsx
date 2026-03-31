/**
 * Admin Dashboard Page
 * 
 * Overview for administrators:
 * - Quick access to key modules (Queue, Offices, Admins, Records).
 * - Real-time statistics summaries.
 * - System health and usage overview.
 */

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import AdminNav from "@/components/AdminNav";
import { SkeletonStats } from "@/components/Skeleton";

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/me")
      .then(r => r.ok ? r.json() : null)
      .then(setSession);

    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const cards = [
    { title: "Live Queue", desc: "Call and serve tickets.", href: "/admin/queue", emoji: "📋" },
    { title: "Offices",    desc: "Manage institutional offices.",  href: "/admin/services", emoji: "🏢", superOnly: true },
    { title: "Branding",   desc: "Name, logo & colors.",    href: "/admin/settings", emoji: "🎨", superOnly: true },
  ].filter(c => !c.superOnly || session?.role === "SUPER_ADMIN");

  return (
    <div className="admin-container">
      <AdminNav />

      <main className="admin-main">
        <header className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back. Here's a snapshot of today's activity.</p>
        </header>

        {/* Nav cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2rem",
          }}
        >
          {cards.map((c) => (
            <Link key={c.href} href={c.href} style={{ textDecoration: "none" }}>
              <div
                className="card"
                style={{
                  height: "100%",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(30,58,138,0.15)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "";
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{c.emoji}</div>
                <h2 style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{c.title}</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{c.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="card">
          <h3 style={{ marginBottom: "1.25rem" }}>Today's Metrics</h3>
          {loading ? (
            <SkeletonStats count={3} />
          ) : stats ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Total Tickets</p>
                <p style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1 }}>{stats.totalTickets}</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Served</p>
                <p style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1, color: "#16a34a" }}>{stats.servedCount}</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Avg. Wait</p>
                <p style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1 }}>{stats.avgWait || 0}<span style={{ fontSize: "1rem", fontWeight: 400 }}> min</span></p>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)" }}>Could not load stats.</p>
          )}
        </div>
      </main>
    </div>
  );
}
