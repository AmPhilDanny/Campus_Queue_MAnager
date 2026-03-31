/**
 * Admin User Management Page
 * 
 * Restricted to SUPER_ADMIN:
 * - Create new administrator accounts.
 * - Assign admins to specific institutional offices.
 * - Manage and delete administrative roles.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { useToast } from "@/components/Toast";
import { SkeletonBlock } from "@/components/Skeleton";
import { UserPlus, Trash2, Shield, Building2 } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "ADMIN",
    officeId: ""
  });
  const { showToast } = useToast();

  const fetchUsers = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/users").then(r => r.json()),
      fetch("/api/services").then(r => r.json())
    ]).then(([userData, svcData]) => {
      setUsers(userData);
      setServices(svcData);
      setLoading(false);
    }).catch(() => {
      showToast("Failed to load users or services.", "error");
      setLoading(false);
    });
  };

  useEffect(() => {
    fetch("/api/admin/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.role !== "SUPER_ADMIN") {
          window.location.href = "/admin/dashboard";
        }
      });

    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Admin user created successfully.", "success");
        setUsers([data, ...users]);
        setShowAddModal(false);
        setFormData({ email: "", password: "", role: "ADMIN", officeId: "" });
      } else {
        showToast(data.error || "Failed to create user.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, id: editingUser.id }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Admin user updated successfully.", "success");
        setUsers(users.map(u => u.id === editingUser.id ? data : u));
        setEditingUser(null);
        setFormData({ email: "", password: "", role: "ADMIN", officeId: "" });
      } else {
        showToast(data.error || "Failed to update user.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this admin? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Admin deleted.", "success");
        setUsers(users.filter(u => u.id !== id));
      } else {
        showToast("Failed to delete admin.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "", // Don't show old password
      role: user.role,
      officeId: user.officeId || ""
    });
  };

  return (
    <div className="admin-container">
      <AdminNav />
      <main className="admin-main">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <div style={{ marginBottom: "0.5rem" }}>
              <Link href="/admin/dashboard" className="btn btn-ghost" style={{ padding: "0.4rem 0.75rem", fontSize: "0.875rem", gap: "0.4rem" }}>
                ← Return to Dashboard
              </Link>
            </div>
            <h1 style={{ fontSize: "1.5rem" }}>Admin User Management</h1>
            <p style={{ color: "var(--text-muted)" }}>Manage administrative access and roles.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <UserPlus size={18} style={{ marginRight: "0.5rem" }} />
            Add Admin
          </button>
        </header>

      {loading ? (
        <SkeletonBlock height="200px" />
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "rgba(255,255,255,0.05)" }}>
              <tr>
                <th style={{ padding: "1rem", textAlign: "left" }}>Email</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>Role</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>Assigned Office</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <td style={{ padding: "1rem" }}>{user.email}</td>
                  <td style={{ padding: "1rem" }}>
                    <span className={`badge ${user.role === 'SUPER_ADMIN' ? 'badge-primary' : 'badge-secondary'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {user.office ? user.office.name : "Global (All)"}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button 
                      className="btn btn-ghost" 
                      style={{ color: "var(--primary)", marginRight: "0.5rem" }}
                      onClick={() => openEditModal(user)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-ghost" 
                      style={{ color: "var(--error)" }}
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(showAddModal || editingUser) && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <h2>{editingUser ? "Edit Administrator" : "Add New Administrator"}</h2>
            <form onSubmit={editingUser ? handleUpdate : handleCreate}>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Password {editingUser && "(Leave blank to keep current)"}</label>
                <input 
                  type="password" 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  required={!editingUser} 
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="ADMIN">Institutional Admin (Lower)</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              {formData.role === "ADMIN" && (
                <div className="form-group">
                  <label>Assign to Office</label>
                  <select value={formData.officeId} onChange={e => setFormData({...formData, officeId: e.target.value})} required>
                    <option value="">-- Select an Office --</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingUser ? "Save Changes" : "Create"}
                </button>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingUser(null);
                    setFormData({ email: "", password: "", role: "ADMIN", officeId: "" });
                  }} 
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </main>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          width: 100%;
          max-width: 450px;
        }
        .badge {
          padding: 0.25rem 0.6rem;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .badge-primary { background: var(--primary); color: white; }
        .badge-secondary { background: rgba(255,255,255,0.1); color: var(--text-muted); }
      `}</style>
    </div>
  );
}
