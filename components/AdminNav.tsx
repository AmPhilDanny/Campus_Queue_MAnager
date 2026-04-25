/**
 * Admin Navigation Component
 * 
 * Persistent navigation sidebar for administrative interfaces.
 * Features:
 * - Dynamic role-based links (Super Admin vs. Admin).
 * - Branding integration (Logo and Name based on settings).
 * - Active state tracking across admin routes.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function AdminNav() {
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    fetch("/api/admin/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => setSession(data))
      .catch(() => setSession(null));

    fetch("/api/settings")
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(() => {});
  }, []);

  const isSuper = session?.role === "SUPER_ADMIN";

  const links = [
    { name: "Dashboard",   href: "/admin/dashboard" },
    { name: "Queue",       href: "/admin/queue" },
    { name: "Settings",    href: "/admin/settings" },
  ];

  if (isSuper) {
    links.splice(2, 0,
      { name: "Offices",      href: "/admin/services" },
      { name: "Admins",      href: "/admin/users" },
      { name: "Form",        href: "/admin/form-management" },
      { name: "Records",     href: "/admin/records" }
    );
  }

  const handleSignOut = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const brandText = settings.display_mode === "logo" ? (settings.logo_text || "FSQM") : (settings.campus_name || "FhinovaxSmartQM");

  return (
    <nav className="admin-nav">
      {/* Brand mark */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginRight: "1rem",
          paddingRight: "1rem",
          borderRight: "1.5px solid var(--border)",
          whiteSpace: "nowrap",
        }}
      >
        {settings.display_mode !== "name" && settings.logo_url && (
          <img src={settings.logo_url} alt="Logo" style={{ height: "24px", width: "auto", objectFit: "contain" }} />
        )}
        {settings.display_mode !== "logo" && (
          <span
            style={{
              fontWeight: 800,
              fontSize: "0.9375rem",
              color: "var(--primary)",
              letterSpacing: "-0.02em",
            }}
          >
            {brandText} Admin
          </span>
        )}
      </div>

      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`admin-nav-link${pathname === link.href ? " active" : ""}`}
        >
          {link.name}
        </Link>
      ))}

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <ThemeToggle />
        <button
          onClick={handleSignOut}
        style={{
          marginLeft: "auto",
          background: "none",
          border: "1px solid #fecaca",
          color: "#dc2626",
          cursor: "pointer",
          fontSize: "0.875rem",
          fontWeight: 600,
          padding: "0.4rem 0.875rem",
          borderRadius: "8px",
          transition: "background 0.15s",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "#fee2e2")}
        onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "none")}
      >
        ⏻ Sign Out
      </button>
      </div>
    </nav>
  );
}
