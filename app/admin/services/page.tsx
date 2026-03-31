/**
 * Manage Offices Page (renamed from Services)
 * 
 * Central control for institutional offices:
 * - Create, update, and delete service points.
 * - Manage custom form fields per office.
 * - Toggle queue visibility and status.
 */

"use client";

import { useState, useEffect } from "react";
import AdminNav from "@/components/AdminNav";
import { useToast } from "@/components/Toast";
import { SkeletonList } from "@/components/Skeleton";

export default function ManageOffices() {
  const [session, setSession] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/admin/me")
      .then(r => r.ok ? r.json() : null)
      .then(setSession);
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/admin/services");
      setServices(await res.json());
    } catch {
      showToast("Failed to load services.", "error");
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error();
      setNewName("");
      fetchServices();
      showToast(`"${newName.trim()}" added successfully!`, "success");
    } catch {
      showToast("Failed to add service.", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, current: boolean, name: string) => {
    try {
      await fetch(`/api/admin/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      fetchServices();
      showToast(`${name} is now ${!current ? "active" : "inactive"}.`, "info");
    } catch {
      showToast("Failed to update service.", "error");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will remove all ticket history for this service.`)) return;
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      fetchServices();
      showToast(`"${name}" deleted.`, "success");
    } catch {
      showToast("Failed to delete service.", "error");
    }
  };

  if (session && session.role !== "SUPER_ADMIN") {
    return (
      <div className="admin-container">
        <AdminNav />
        <main className="admin-main">
          <header className="admin-header">
            <h1>Access Denied</h1>
            <p>Only Super Admins can manage institutional offices.</p>
          </header>
          <div className="card" style={{ textAlign: "center", padding: "4rem" }}>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              You do not have permission to view or manage offices.
            </p>
            <a href="/admin/dashboard" className="btn btn-primary">Return to Dashboard</a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <AdminNav />

      <main className="admin-main">
        <header className="admin-header">
          <h1>Manage Offices</h1>
          <p>Add or configure institutional offices for the queue.</p>
        </header>

        {/* Add new */}
        {session?.role === "SUPER_ADMIN" && (
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>Add New Office</h3>
            <form onSubmit={handleAdd} style={{ display: "flex", gap: "0.75rem" }}>
              <input
                type="text"
                placeholder="Office Name (e.g. Registrar)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{ flex: 1 }}
                required
              />
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ whiteSpace: "nowrap" }}>
                {loading ? "Adding..." : "Add Office"}
              </button>
            </form>
          </div>
        )}

        {/* List */}
        <div className="card">
          <h3 style={{ marginBottom: "1.25rem" }}>Offices</h3>
          {servicesLoading ? (
            <SkeletonList count={4} />
          ) : services.length === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem 0" }}>
              No offices yet. Add one above.
            </p>
          ) : (
            <div>
              {services.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.875rem 0",
                    borderBottom: i < services.length - 1 ? "1px solid var(--border)" : "none",
                    gap: "1rem",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: "1rem" }}>{s.name}</p>
                    <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                      {s.isActive ? "● Active" : "○ Inactive"}
                    </p>
                  </div>
                  {session?.role === "SUPER_ADMIN" && (
                    <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                      <button
                        onClick={() => toggleActive(s.id, s.isActive, s.name)}
                        className="btn"
                        style={{
                          background: s.isActive ? "#dcfce7" : "#fee2e2",
                          color: s.isActive ? "#14532d" : "#7f1d1d",
                          fontSize: "0.8125rem",
                          padding: "0.5rem 0.875rem",
                        }}
                      >
                        {s.isActive ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        className="btn"
                        style={{ background: "#f1f5f9", color: "#475569", fontSize: "0.8125rem", padding: "0.5rem 0.875rem" }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
