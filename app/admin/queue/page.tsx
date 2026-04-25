/**
 * Manage Queue Page
 * 
 * Real-time operational interface for call center / office staff:
 * - Select an office to manage.
 * - Call the next ticket in line.
 * - Serve, skip, or recall tickets.
 * - Manually override wait times.
 * - Export daily queue data to CSV.
 */

"use client";

import { useState, useEffect } from "react";
import AdminNav from "@/components/AdminNav";
import { useToast } from "@/components/Toast";
import { SkeletonList } from "@/components/Skeleton";

export default function ManageQueue() {
  const [session, setSession] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedServiceName, setSelectedServiceName] = useState("");
  const [queueData, setQueueData] = useState<any>(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [filter, setFilter] = useState("waiting");
  const [actionLoading, setActionLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/admin/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setSession(data);
        if (data?.role === "ADMIN" && data.officeId) {
          setSelectedService(data.officeId);
          // We'll need the name too, let's fetch services first
        }
      });
  }, []);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        setServices(data);
        if (session?.role === "ADMIN" && session.officeId) {
          const office = data.find((s: any) => s.id === session.officeId);
          if (office) setSelectedServiceName(office.name);
        }
      })
      .catch(() => showToast("Failed to load services.", "error"));
  }, [session]);

  const fetchQueue = async () => {
    if (!selectedService) return;
    try {
      const res = await fetch(`/api/admin/queue?serviceId=${selectedService}`);
      const data = await res.json();
      setQueueData(data);
    } catch {
      // silently retry
    }
  };

  useEffect(() => {
    if (!selectedService) return;
    setQueueLoading(true);
    fetchQueue().finally(() => setQueueLoading(false));
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [selectedService]);

  const handleAction = async (action: string, ticketId?: string, extraData?: any) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, serviceId: selectedService, ticketId, ...extraData }),
      });
      if (!res.ok) throw new Error();
      fetchQueue();
      const labels: Record<string, string> = {
        "call-next": "Next ticket called!",
        serve: "Ticket marked as served. ✓",
        skip: "Ticket skipped.",
        recall: "Ticket recalled to queue.",
        "toggle-open": "Queue status updated.",
        "update-wait-time": "Wait time updated.",
      };
      showToast(labels[action] || "Action completed.", "success");
    } catch {
      showToast("Action failed. Please try again.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualWait = (ticketId: string) => {
    const mins = prompt("Enter manual wait time in minutes (leave blank to clear):");
    if (mins === null) return;
    const value = mins.trim() === "" ? null : parseInt(mins);
    handleAction("update-wait-time", ticketId, { minutes: value });
  };

  const handleExportCSV = async () => {
    if (!selectedService) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/queue/export?serviceId=${selectedService}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().split("T")[0];
      a.download = `${selectedServiceName.replace(/\s+/g, "-").toLowerCase()}-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("CSV exported successfully!", "success");
    } catch {
      showToast("Failed to export CSV.", "error");
    } finally {
      setExporting(false);
    }
  };

  const filteredTickets = queueData?.tickets?.filter((t: any) => t.status === filter) || [];

  return (
    <div className="admin-container">
      <AdminNav />

      <main className="admin-main">
        <header className="admin-header">
          <h1>Manage Queue</h1>
          <p>Call, serve, or skip tickets in real time.</p>
        </header>

        {/* Service selector + Export */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: "220px" }}>
              <label htmlFor="serviceSelect">Select Office to Manage</label>
              <select
                id="serviceSelect"
                value={selectedService}
                disabled={session?.role === "ADMIN"}
                onChange={(e) => {
                  const sel = e.target.options[e.target.selectedIndex];
                  setSelectedService(e.target.value);
                  setSelectedServiceName(sel.text);
                  setQueueData(null);
                }}
              >
                {!session || session.role === "SUPER_ADMIN" ? (
                  <>
                    <option value="">-- Choose an office --</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </>
                ) : (
                  <option value={session.officeId}>{selectedServiceName || "Loading..."}</option>
                )}
              </select>
            </div>
            {selectedService && (
              <button
                onClick={handleExportCSV}
                disabled={exporting}
                className="btn"
                style={{
                  background: "var(--success)", opacity: 0.8, color: "#fff", border: "1px solid var(--border)",
                  fontSize: "0.9375rem", padding: "0.75rem 1.25rem", whiteSpace: "nowrap",
                }}
              >
                {exporting ? "Exporting…" : "⬇ Export CSV"}
              </button>
            )}
          </div>
          {selectedService && (
            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Queue Status:</span>
              <button
                onClick={() => handleAction("toggle-open")}
                className={`btn ${queueData?.isOpen ? 'btn-success' : 'btn-danger'}`}
                style={{ 
                  padding: "0.4rem 1rem", 
                  fontSize: "0.875rem",
                  background: queueData?.isOpen ? "var(--success)" : "var(--error)",
                  opacity: 0.9,
                  color: "#fff",
                  border: `1px solid var(--border)`,
                }}
              >
                {queueData?.isOpen ? "● Open (Accepting Tickets)" : "○ Closed (Status Only)"}
              </button>
            </div>
          )}
        </div>

        {selectedService && (
          <>
            {/* Stats row */}
            <div
              className="card"
              style={{
                marginBottom: "1.5rem",
                display: "flex",
                justifyContent: "space-around",
                textAlign: "center",
              }}
            >
              <div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", marginBottom: "0.25rem" }}>Waiting</p>
                <p style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1 }}>{queueData?.waitingCount ?? "0"}</p>
              </div>
              <div style={{ width: "1px", background: "var(--border)" }} />
              <div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", marginBottom: "0.25rem" }}>Calling</p>
                <p style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1, color: "var(--primary)" }}>
                  #{queueData?.currentNumber || "—"}
                </p>
              </div>
              <div style={{ width: "1px", background: "var(--border)" }} />
              <div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", marginBottom: "0.25rem" }}>Served</p>
                <p style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1 }}>
                  {queueData?.tickets?.filter((t: any) => t.status === 'served').length || "0"}
                </p>
              </div>
              <div style={{ width: "1px", background: "var(--border)" }} />
              <div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", marginBottom: "0.25rem" }}>Avg Wait</p>
                <p style={{ fontSize: "1.25rem", fontWeight: 800, lineHeight: 1, padding: "0.375rem 0" }}>
                  {queueData?.avgWaitMs ? `${Math.ceil(queueData.avgWaitMs / 60000)}m` : "—"}
                </p>
              </div>
            </div>

            {/* Sticky "Call Next" */}
            <div className="sticky-action-bar" style={{ marginBottom: "1.5rem", borderRadius: "var(--radius)" }}>
              <button
                onClick={() => handleAction("call-next")}
                className="btn btn-primary"
                style={{ width: "100%", fontSize: "1.125rem", padding: "1rem" }}
                disabled={actionLoading || !queueData || queueData.waitingCount === 0}
              >
                {actionLoading ? "Processing…" : "📢 CALL NEXT TICKET"}
              </button>
            </div>

            {/* Ticket filter tabs */}
            <div className="card">
              <div
                style={{
                  display: "flex",
                  gap: "0.25rem",
                  borderBottom: "1px solid var(--border)",
                  marginBottom: "1rem",
                  overflowX: "auto",
                }}
              >
                {["waiting", "called", "served", "skipped"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    style={{
                      padding: "0.5rem 0.875rem",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      fontWeight: filter === s ? 700 : 400,
                      fontSize: "0.9375rem",
                      color: filter === s ? "var(--primary)" : "var(--text-muted)",
                      borderBottom: filter === s ? "2.5px solid var(--primary)" : "2.5px solid transparent",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                    {s === "waiting" && queueData?.waitingCount > 0 && (
                      <span style={{
                        marginLeft: "0.375rem", background: "var(--primary)", color: "#fff",
                        borderRadius: "10px", fontSize: "0.75rem", padding: "0.05rem 0.45rem", fontWeight: 700,
                      }}>{queueData.waitingCount}</span>
                    )}
                  </button>
                ))}
              </div>

              {queueLoading ? (
                <SkeletonList count={3} />
              ) : filteredTickets.length === 0 ? (
                <p style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                  No tickets in this section.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {filteredTickets.map((t: any) => (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        padding: "1rem",
                        background: "var(--card-bg-light)",
                        borderRadius: "10px",
                        gap: "1rem",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: "1.0625rem" }}>Ticket #{t.ticketNumber}</p>
                        <p style={{ fontWeight: 600, color: "var(--primary)" }}>{t.customerName}</p>
                        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                          {t.studentNumber && `ID: ${t.studentNumber}`}
                          {t.studentNumber && t.department && " · "}
                          {t.department && `${t.department}`}
                        </p>
                        {t.customerPhone && (
                          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                            📞 {t.customerPhone}
                          </p>
                        )}
                        {t.description && (
                          <p
                            style={{
                              marginTop: "0.5rem",
                              fontSize: "0.875rem",
                              fontStyle: "italic",
                              background: "var(--card-bg)",
                              padding: "0.5rem 0.75rem",
                              borderRadius: "6px",
                              border: "1px solid var(--border)",
                              color: "var(--text-muted)",
                            }}
                          >
                            &ldquo;{t.description}&rdquo;
                          </p>
                        )}
                        {t.manualWaitTime && (
                          <p style={{ marginTop: "0.5rem", fontSize: "0.8125rem", color: "var(--primary)", fontWeight: 700 }}>
                            ⏱ Manual Wait: {t.manualWaitTime} mins
                          </p>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", flexShrink: 0 }}>
                        {(t.status === "waiting" || t.status === "called") && (
                          <button
                            onClick={() => handleManualWait(t.id)}
                            className="btn"
                            style={{ background: "var(--secondary)", color: "var(--text-main)", fontSize: "0.8125rem", padding: "0.5rem 0.875rem" }}
                          >
                            ⏱ Edit Wait
                          </button>
                        )}
                        {t.status === "called" && (
                          <>
                            <button
                              onClick={() => handleAction("serve", t.id)}
                              className="btn"
                              style={{ background: "var(--success)", color: "#fff", fontSize: "0.8125rem", padding: "0.5rem 0.875rem", opacity: 0.9 }}
                            >
                              ✓ Serve
                            </button>
                            <button
                              onClick={() => handleAction("skip", t.id)}
                              className="btn"
                              style={{ background: "var(--error)", color: "#fff", fontSize: "0.8125rem", padding: "0.5rem 0.875rem", opacity: 0.9 }}
                            >
                              ✕ Skip
                            </button>
                          </>
                        )}
                        {t.status === "skipped" && (
                          <button
                            onClick={() => handleAction("recall", t.id)}
                            className="btn"
                            style={{ background: "var(--warning)", color: "#fff", fontSize: "0.8125rem", padding: "0.5rem 0.875rem", opacity: 0.9 }}
                          >
                            ↩ Recall
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
