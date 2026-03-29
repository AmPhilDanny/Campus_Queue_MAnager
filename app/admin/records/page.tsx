"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { useToast } from "@/components/Toast";
import { SkeletonBlock } from "@/components/Skeleton";
import { Trash2, Calendar, Filter, FileDown, Eye, X } from "lucide-react";

export default function RecordsPage() {
  const [queues, setQueues] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: "", serviceId: "" });
  const [selectedQueue, setSelectedQueue] = useState<any>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/admin/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.role !== "SUPER_ADMIN") {
          window.location.href = "/admin/dashboard";
        }
      });
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/admin/records?${query}`);
      const data = await res.json();
      setQueues(data);
    } catch {
      showToast("Failed to load records.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      setServices(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [filters]);

  const handleDeleteQueue = async (id: string) => {
    if (!confirm("Delete this daily queue and all its tickets? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/records?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Record deleted successfully.", "success");
        setQueues(queues.filter(q => q.id !== id));
      } else {
        showToast("Failed to delete record.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const handleViewQueue = async (id: string) => {
    setViewLoading(true);
    try {
      const res = await fetch(`/api/admin/records?id=${id}`);
      const data = await res.json();
      setSelectedQueue(data);
    } catch {
      showToast("Failed to load queue details.", "error");
    } finally {
      setViewLoading(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string, status: string) => {
    if (!confirm("Delete this individual ticket?")) return;
    try {
      const res = await fetch("/api/admin/records", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-ticket", queueId: selectedQueue.id, ticketId, status }),
      });
      if (res.ok) {
        showToast("Ticket deleted.", "success");
        setSelectedQueue({
          ...selectedQueue,
          tickets: selectedQueue.tickets.filter((t: any) => t.id !== ticketId)
        });
        fetchRecords(); // Update counts in main list
      } else {
        showToast("Failed to delete ticket.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const handleToggleQueueStatus = async (isOpen: boolean) => {
    try {
      const res = await fetch("/api/admin/records", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-queue", queueId: selectedQueue.id, isOpen }),
      });
      if (res.ok) {
        showToast(`Queue ${isOpen ? 'opened' : 'closed'}.`, "success");
        setSelectedQueue({ ...selectedQueue, isOpen });
      } else {
        showToast("Failed to update status.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const handleDeleteBefore = async () => {
    const beforeDate = prompt("Enter a date (YYYY-MM-DD) to delete all records before it:");
    if (!beforeDate) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(beforeDate)) {
      alert("Invalid date format. Use YYYY-MM-DD.");
      return;
    }
    if (!confirm(`Delete ALL records before ${beforeDate}? THIS ACTION IS IRREVERSIBLE.`)) return;
    
    try {
      const res = await fetch(`/api/admin/records?beforeDate=${beforeDate}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`Records before ${beforeDate} deleted.`, "success");
        fetchRecords();
      } else {
        showToast("Failed to delete records.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  return (
    <div className="admin-container" style={{ maxWidth: "1200px", background: "linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)", borderRadius: "24px", marginTop: "1rem", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
      <AdminNav />
      <main className="admin-main">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <div style={{ marginBottom: "0.5rem" }}>
              <Link href="/admin/dashboard" className="btn btn-ghost" style={{ padding: "0.4rem 0.75rem", fontSize: "0.875rem", gap: "0.4rem" }}>
                ← Return to Dashboard
              </Link>
            </div>
            <h1 style={{ fontSize: "1.5rem" }}>Queue History & Records</h1>
            <p style={{ color: "var(--text-muted)" }}>View, export, and manage historical queue data.</p>
          </div>
          <button className="btn btn-ghost" onClick={handleDeleteBefore} style={{ color: "var(--error)", border: "1px solid #fee2e2" }}>
            <Trash2 size={18} style={{ marginRight: "0.5rem" }} />
            Cleanup Old Data
          </button>
        </header>

        {/* Filters */}
        <div className="card" style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label><Calendar size={14} style={{ marginRight: "0.4rem" }} /> Filter by Date</label>
            <input 
              type="date" 
              value={filters.date} 
              onChange={e => setFilters({...filters, date: e.target.value})} 
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label><Filter size={14} style={{ marginRight: "0.4rem" }} /> Filter by Office</label>
            <select value={filters.serviceId} onChange={e => setFilters({...filters, serviceId: e.target.value})}>
              <option value="">-- All Offices --</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button className="btn btn-ghost" onClick={() => setFilters({ date: "", serviceId: "" })} style={{ height: "44px" }}>
            Reset Filters
          </button>
        </div>

        {loading ? (
          <SkeletonBlock height="300px" />
        ) : queues.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "4rem" }}>
            <p style={{ color: "var(--text-muted)" }}>No historical records found for the selected filters.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "rgba(255,255,255,0.05)" }}>
                <tr>
                  <th style={{ padding: "1rem", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "1rem", textAlign: "left" }}>Office</th>
                  <th style={{ padding: "1rem", textAlign: "center" }}>Tickets</th>
                  <th style={{ padding: "1rem", textAlign: "center" }}>Avg Wait</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {queues.map((q) => (
                  <tr key={q.id} style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <td style={{ padding: "1rem", fontWeight: 600 }}>{q.date}</td>
                    <td style={{ padding: "1rem" }}>{q.service.name}</td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <span style={{ fontWeight: 700 }}>{q._count.tickets}</span> tickets
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      {(q.avgWaitMs / 60000).toFixed(1)} min
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <button 
                        className="btn btn-ghost" 
                        style={{ color: "var(--primary)", marginRight: "0.5rem" }}
                        onClick={() => handleViewQueue(q.id)}
                        title="View details"
                        disabled={viewLoading}
                      >
                        <Eye size={18} />
                      </button>
                      <a 
                        href={`/api/admin/queue/export?serviceId=${q.serviceId}&date=${q.date}`} 
                        className="btn btn-ghost" 
                        style={{ color: "var(--primary)", marginRight: "0.5rem" }}
                        title="Download CSV"
                      >
                        <FileDown size={18} />
                      </a>
                      <button 
                        className="btn btn-ghost" 
                        style={{ color: "var(--error)" }}
                        onClick={() => handleDeleteQueue(q.id)}
                        title="Delete record"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Queue Detail Modal */}
        {selectedQueue && (
          <div className="modal-overlay">
            <div className="modal-content-styled" style={{ maxWidth: "900px", width: "95%", maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
                <div>
                  <h2 style={{ marginBottom: "0.25rem", color: "white" }}>{selectedQueue.service.name}</h2>
                  <p style={{ color: "rgba(255,255,255,0.7)" }}>Records for {selectedQueue.date}</p>
                </div>
                <button 
                  className="btn-close" 
                  onClick={() => setSelectedQueue(null)}
                  style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "12px", padding: "0.5rem" }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ display: "flex", gap: "1.25rem", marginBottom: "2.5rem", flexWrap: "wrap" }}>
                <div className="stat-card">
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</p>
                  <button 
                    className={`btn ${selectedQueue.isOpen ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: "0.875rem", padding: "0.4rem 1rem", borderRadius: "100px" }}
                    onClick={() => handleToggleQueueStatus(!selectedQueue.isOpen)}
                  >
                    {selectedQueue.isOpen ? "Open" : "Closed"}
                  </button>
                </div>
                <div className="stat-card">
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Tickets</p>
                  <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary)" }}>{selectedQueue.tickets.length}</p>
                </div>
                <div className="stat-card">
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Waiting</p>
                  <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--warning)" }}>{selectedQueue.tickets.filter((t: any) => t.status === 'waiting').length}</p>
                </div>
              </div>

              <div className="table-container">
                <table className="admin-table-styled" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "1.25rem", textAlign: "left" }}>#</th>
                      <th style={{ padding: "1.25rem", textAlign: "left" }}>Student / Client</th>
                      <th style={{ padding: "1.25rem", textAlign: "center" }}>Status</th>
                      <th style={{ padding: "1.25rem", textAlign: "center" }}>Created</th>
                      <th style={{ padding: "1.25rem", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQueue.tickets.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                          No tickets found for this day.
                        </td>
                      </tr>
                    ) : (
                      selectedQueue.tickets.map((t: any) => (
                        <tr key={t.id}>
                          <td style={{ padding: "1.25rem", fontWeight: 800, color: "var(--primary)" }}>{t.ticketNumber}</td>
                          <td style={{ padding: "1.25rem" }}>
                            <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{t.customerName || "Anonymous"}</div>
                            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{t.studentNumber || t.customerPhone || "No ID"}</div>
                          </td>
                          <td style={{ padding: "1.25rem", textAlign: "center" }}>
                            <span className={`badge badge-${t.status === 'served' ? 'primary' : t.status === 'waiting' ? 'secondary' : 'error'}`}>
                              {t.status}
                            </span>
                          </td>
                          <td style={{ padding: "1.25rem", textAlign: "center", fontSize: "0.9375rem", fontWeight: 500 }}>
                            {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: "1.25rem", textAlign: "right" }}>
                            <button 
                              className="btn-action-delete"
                              onClick={() => handleDeleteTicket(t.id, t.status)}
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1.5rem;
          animation: fade-in 0.2s ease-out;
        }
        .modal-content-styled {
          width: 100%;
          background: #1e293b;
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .stat-card {
          flex: 1;
          min-width: 180px;
          background: white;
          padding: 1.5rem;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .table-container {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .admin-table-styled thead {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .admin-table-styled th {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .admin-table-styled tr:not(:last-child) {
          border-bottom: 1px solid #f1f5f9;
        }
        .admin-table-styled tr:hover {
          background: #fcfdfe;
        }
        .badge {
          padding: 0.4rem 0.875rem;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .badge-primary { background: #dcfce7; color: #166534; }
        .badge-secondary { background: #dbeafe; color: #1e40af; }
        .badge-error { background: #fee2e2; color: #991b1b; }
        .btn-action-delete {
          background: #fee2e2;
          color: #ef4444;
          border: none;
          padding: 0.6rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-action-delete:hover {
          background: #fecaca;
          transform: scale(1.05);
        }
        .btn-close:hover {
          background: rgba(255,255,255,0.2) !important;
          transform: rotate(90deg);
          transition: all 0.3s;
        }
      `}</style>
    </div>
  );
}
