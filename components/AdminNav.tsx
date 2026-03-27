"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => setSession(data))
      .catch(() => setSession(null));
  }, []);

  const isSuper = session?.role === "SUPER_ADMIN";

  const links = [
    { name: "Dashboard",   href: "/admin/dashboard" },
    { name: "Queue",       href: "/admin/queue" },
    { name: "Settings",    href: "/admin/settings" },
  ];

  if (isSuper) {
    links.splice(2, 0,
      { name: "Services",    href: "/admin/services" },
      { name: "Admins",      href: "/admin/users" },
      { name: "Form",        href: "/admin/form-management" },
      { name: "Records",     href: "/admin/records" }
    );
  }

  const handleSignOut = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <nav className="admin-nav">
      {/* Brand mark */}
      <span
        style={{
          fontWeight: 800,
          fontSize: "1rem",
          color: "var(--primary)",
          letterSpacing: "-0.02em",
          marginRight: "0.5rem",
          paddingRight: "0.75rem",
          borderRight: "1.5px solid var(--border)",
          whiteSpace: "nowrap",
        }}
      >
        🏫 CQM Admin
      </span>

      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`admin-nav-link${pathname === link.href ? " active" : ""}`}
        >
          {link.name}
        </Link>
      ))}

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
    </nav>
  );
}
