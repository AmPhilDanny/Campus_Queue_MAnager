"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SkeletonText, SkeletonBlock } from "@/components/Skeleton";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";

export default function TicketStatus() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ticketRes, settingsRes] = await Promise.all([
          fetch(`/api/tickets/${id}`),
          fetch("/api/settings"),
        ]);
        const [ticketData, settingsData] = await Promise.all([
          ticketRes.json(),
          settingsRes.json(),
        ]);
        setTicket(ticketData);
        setSettings(settingsData);
      } catch {
        // silently retry on next poll
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tickets/${id}`);
        setTicket(await res.json());
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (ticket && (ticket.error || ticket.status === "served" || ticket.status === "skipped")) {
      const savedId = localStorage.getItem("cqm_active_ticket_id");
      if (savedId === id || ticket.error) {
        localStorage.removeItem("cqm_active_ticket_id");
      }
    }
  }, [id, ticket]);

  const primaryColor = settings.primary_color || "var(--primary)";

  /* ---- Skeleton ---- */
  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <SkeletonBlock />
            <SkeletonText width="medium" />
          </div>
          <div style={{ marginBottom: "2rem" }}>
            <SkeletonText width="short" />
            <SkeletonBlock />
            <SkeletonText width="medium" />
          </div>
          <SkeletonBlock />
        </div>
      </div>
    );
  }

  if (!ticket || ticket.error) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: "center" }}>
          <h1>Oops!</h1>
          <p style={{ color: "var(--text-muted)", margin: "1rem 0" }}>
            {ticket?.error || "Ticket not found."}
          </p>
          <a href="/" className="btn btn-primary">Go Home</a>
        </div>
      </div>
    );
  }

  const isCompleted = ticket.status === "served" || ticket.status === "skipped";
  const waitPerPersonMs = ticket.queue?.avgWaitMs || (Number(settings.default_wait_min) || 5) * 60000;
  const isManualWait = ticket.manualWaitTime !== null && ticket.manualWaitTime !== undefined;
  const eta = isManualWait ? ticket.manualWaitTime : (ticket.position * waitPerPersonMs / 60000);

  return (
    <div className="container" style={{ "--brand-primary": primaryColor, position: "relative" } as any}>
      <div style={{ position: "absolute", top: "1.5rem", right: "1.5rem", zIndex: 10 }}>
        <ThemeToggle />
      </div>
      <div
        className="card"
        style={{
          textAlign: "center",
          borderTop: `6px solid ${primaryColor}`,
          paddingTop: "2rem",
        }}
      >
        {/* Header / Branding */}
        <header style={{ marginBottom: "2rem" }}>
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt="Logo"
              style={{ maxHeight: "60px", maxWidth: "100%", objectFit: "contain", marginBottom: "1rem" }}
            />
          ) : settings.logo_text ? (
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: primaryColor, marginBottom: "1rem" }}>
              {settings.logo_text}
            </div>
          ) : null}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "0.5rem" }}>
            <span className="live-dot" />
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#059669", letterSpacing: "0.06em" }}>
              LIVE STATUS
            </span>
          </div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem", color: "var(--text-main)" }}>{ticket.service.name}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem", fontWeight: 500 }}>Ticket #{ticket.ticketNumber}</p>
        </header>

        {/* Status */}
        <div style={{ margin: "2.5rem 0" }}>
          {isCompleted ? (
            <div style={{ animation: "fade-in 0.5s ease" }}>
              <span
                className={`status-badge status-${ticket.status}`}
                style={{ fontSize: "1.25rem", padding: "0.6rem 2rem", borderRadius: "100px" }}
              >
                {ticket.status.toUpperCase()}
              </span>
              <p style={{ marginTop: "1.25rem", color: "var(--text-muted)", fontWeight: 500 }}>
                {ticket.status === "served"
                  ? "Thank you for visiting! Your request was completed."
                  : "You missed your turn. Please see the office if you need a recall."}
              </p>
            </div>
          ) : (
            <div style={{ animation: "scale-up 0.5s ease" }}>
              <p style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 500, marginBottom: "0.5rem" }}>Your Position in Queue</p>
              <div style={{ position: "relative", display: "inline-block" }}>
                <h2
                  style={{
                    fontSize: "6.5rem",
                    fontWeight: 900,
                    lineHeight: 1,
                    margin: "0",
                    color: primaryColor,
                    letterSpacing: "-0.05em",
                  }}
                >
                  {ticket.position}
                </h2>
                <span style={{ position: "absolute", top: "1.5rem", left: "-1.25rem", fontSize: "2rem", fontWeight: 800, color: primaryColor }}>#</span>
              </div>
              
              <div style={{ marginTop: "2rem" }}>
                {ticket.status === "called" ? (
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "1.125rem",
                      color: "#fff",
                      background: "linear-gradient(135deg, #059669, #10b981)",
                      padding: "1rem 1.5rem",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.3)",
                      display: "inline-block",
                      animation: "pulse-green 2s infinite"
                    }}
                  >
                    🎉 IT'S YOUR TURN! PROCEED NOW.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "1.125rem", fontWeight: 600 }}>
                      {ticket.position - 1 > 0
                        ? `${ticket.position - 1} person${ticket.position - 1 > 1 ? "s" : ""} ahead of you`
                        : "You're next in line!"}
                    </p>
                    {ticket.position > 1 && (
                      <div style={{ width: "100px", height: "4px", background: "#e2e8f0", borderRadius: "2px", margin: "0.75rem auto" }}>
                        <div style={{ 
                          width: `${Math.max(10, 100 / ticket.position)}%`, 
                          height: "100%", 
                          background: primaryColor, 
                          borderRadius: "2px",
                          transition: "width 0.5s ease"
                        }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Student Details */}
        <div
          style={{
            background: "var(--card-bg-light)",
            padding: "1.25rem",
            borderRadius: "10px",
            marginBottom: "1.25rem",
            textAlign: "left",
          }}
        >
          <h4 style={{ marginBottom: "0.75rem", fontSize: "0.75rem", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
            STUDENT DETAILS
          </h4>
          <p style={{ fontWeight: 600, fontSize: "1rem" }}>
            {ticket.customerName}
            {ticket.studentNumber && (
              <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                ({ticket.studentNumber})
              </span>
            )}
          </p>
          {(ticket.department || ticket.course) && (
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {[ticket.department, ticket.course].filter(Boolean).join(" · ")}
            </p>
          )}
          {ticket.description && (
            <p style={{ marginTop: "0.75rem", fontSize: "0.875rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              "{ticket.description}"
            </p>
          )}
        </div>

        {/* ETA */}
        {!isCompleted && (
          <div
            style={{
              background: "var(--card-bg-light)",
              padding: "1rem",
              borderRadius: "10px",
              marginBottom: "1.75rem",
            }}
          >
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
              Estimated Wait Time
            </p>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, color: primaryColor }}>
              {waitPerPersonMs || isManualWait
                ? `~${Math.ceil(eta)} min${eta > 1 ? "s" : ""}${isManualWait ? " (Manual Estimate)" : ""}` 
                : "Calculating..."}
            </p>
          </div>
        )}

        {/* Footer */}
        <footer style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1.25rem" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
            Reference: {ticket.id}
          </p>
          <button
            onClick={() => window.print()}
            className="btn"
            style={{ background: "var(--card-bg-light)", color: "var(--text-main)", fontSize: "0.9375rem" }}
          >
            🖨 Print Ticket
          </button>
        </footer>
      </div>
    </div>
  );
}
