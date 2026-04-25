/**
 * Landing Page Component
 * 
 * Provides the public-facing interface for institutional users:
 * 1. Create a new digital ticket for a specific office.
 * 2. Track an existing ticket using a ticket number and identifier.
 * 3. Chat with an AI assistant for FAQ and guidance.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { SkeletonText, SkeletonBlock } from "@/components/Skeleton";
import AIChat from "@/components/AIChat";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  const [services, setServices] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [servicesLoading, setServicesLoading] = useState(true);
  const [formFields, setFormFields] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"new" | "track">("new");
  const [trackData, setTrackData] = useState({ ticketNumber: "", identifier: "" });
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    // Check for active ticket in localStorage
    const savedId = localStorage.getItem("cqm_active_ticket_id");
    if (savedId) {
      // Verify the ticket still exists
      fetch(`/api/tickets/${savedId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.error && data.status !== "served" && data.status !== "skipped") {
            setActiveTicketId(savedId);
          } else {
            localStorage.removeItem("cqm_active_ticket_id");
            setActiveTicketId(null);
          }
        })
        .catch(() => {
          // If we can't reach the server, keep it just in case
          setActiveTicketId(savedId);
        });
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/services").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/admin/form-fields").then((r) => r.json()),
    ]).then(([svcData, settingsData, fieldsData]) => {
      setServices(svcData); // Already filtered by isActive in API
      setSettings(settingsData);
      setFormFields(fieldsData);
      setServicesLoading(false);
    }).catch(() => {
      showToast("Failed to load page data.", "error");
      setServicesLoading(false);
    });
  }, []);

  const selectedSvcStatus = services.find(s => s.id === formData.serviceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serviceId) {
      showToast("Please select an office to continue.", "error");
      return;
    }
    setLoading(true);
    try {
      // Split core fields from additional data
      const { name, email, description, studentNumber, department, course, ...additionalData } = formData;
      
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: formData.serviceId,
          customerName: name,
          studentNumber,
          department,
          course,
          email,
          description,
          additionalData
        }),
      });
      const ticket = await res.json();
      if (ticket.id) {
        localStorage.setItem("cqm_active_ticket_id", ticket.id);
        showToast("Ticket created! Redirecting...", "success");
        setTimeout(() => router.push(`/ticket/${ticket.id}`), 800);
      } else {
        showToast(ticket.error || "Failed to get ticket.", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackData.ticketNumber || !trackData.identifier) {
      showToast("Please enter both ticket number and identifier.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tickets/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackData),
      });
      const data = await res.json();
      if (data.id) {
        localStorage.setItem("cqm_active_ticket_id", data.id);
        showToast("Ticket found!", "success");
        router.push(`/ticket/${data.id}`);
      } else {
        showToast(data.error || "Ticket not found.", "error");
      }
    } catch {
      showToast("Network error searching for ticket.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ "--brand-primary": settings.primary_color || "#1e3a8a", position: 'relative' } as any}>
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}>
        <ThemeToggle />
      </div>
      <div className="card">
        <header style={{ textAlign: "center", marginBottom: "2rem" }}>
          {settings.display_mode !== "name" && settings.logo_url && (
            <img
              src={settings.logo_url}
              alt="Logo"
              style={{ maxHeight: "90px", maxWidth: "180px", objectFit: "contain", marginBottom: "1rem" }}
            />
          )}
          {settings.display_mode !== "logo" && (
            <h1 style={{ fontSize: "1.875rem", marginBottom: "0.4rem" }}>
              {settings.campus_name || "FhinovaxSmartQM"}
            </h1>
          )}
          <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
            Skip the wait. Get your digital ticket now.
          </p>
        </header>

        {activeTicketId && (
          <div 
            style={{ 
              background: "linear-gradient(135deg, var(--primary), var(--primary-hover))",
              padding: "1.25rem",
              borderRadius: "12px",
              marginBottom: "2rem",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 10px 15px -3px rgba(30, 64, 175, 0.2)"
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "0.8125rem", opacity: 0.9, marginBottom: "0.2rem" }}>You have an active ticket</p>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Keep tracking your place
              </h3>
            </div>
            <Link 
              href={`/ticket/${activeTicketId}`}
              className="btn"
              style={{ background: "white", color: "var(--primary)", padding: "0.6rem 1rem", fontWeight: 700, fontSize: "0.875rem" }}
            >
              View Ticket →
            </Link>
          </div>
        )}

        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid var(--border)" }}>
          <button
            onClick={() => setActiveTab("new")}
            style={{
              padding: "0.75rem 1rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "new" ? "3px solid var(--primary)" : "3px solid transparent",
              color: activeTab === "new" ? "var(--primary)" : "var(--text-muted)",
              fontWeight: 700,
              fontSize: "0.9375rem",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            New Ticket
          </button>
          <button
            onClick={() => setActiveTab("track")}
            style={{
              padding: "0.75rem 1rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "track" ? "3px solid var(--primary)" : "3px solid transparent",
              color: activeTab === "track" ? "var(--primary)" : "var(--text-muted)",
              fontWeight: 700,
              fontSize: "0.9375rem",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Track Existing
          </button>
        </div>

        {servicesLoading ? (
          <div>
            <SkeletonBlock />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <SkeletonBlock />
              <SkeletonBlock />
            </div>
            <SkeletonBlock />
          </div>
        ) : activeTab === "new" ? (
          <form onSubmit={handleSubmit} style={{ animation: "fade-in 0.3s ease" }}>
            <div className="form-group">
              <label htmlFor="service">Select Office *</label>
                <select
                  id="service"
                  value={formData.serviceId || ""}
                  onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                  required
                >
                  <option value="">-- Choose an office --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {!s.isOpen && "(Closed)"}
                    </option>
                  ))}
                </select>
                {formData.serviceId && !selectedSvcStatus?.isOpen && (
                  <p style={{ color: "var(--error)", fontSize: "0.8125rem", marginTop: "0.4rem", fontWeight: 600 }}>
                    ⚠ This office is currently not accepting new tickets.
                  </p>
                )}
              </div>

            <div className="dynamic-fields" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {formFields.map((field) => (
                <div key={field.id} className="form-group" style={{ 
                  gridColumn: (field.type === "textarea" || field.type === "select") ? "span 2" : "auto" 
                }}>
                  <label htmlFor={field.name}>
                    {field.label} {field.required && "*"}
                  </label>
                  
                  {field.type === "textarea" ? (
                    <textarea
                      id={field.name}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ""}
                      onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                      required={field.required}
                      rows={3}
                    />
                  ) : field.type === "select" ? (
                    <select
                      id={field.name}
                      value={formData[field.name] || ""}
                      onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                      required={field.required}
                    >
                      <option value="">-- Select {field.label} --</option>
                      {field.options?.split(",").map((opt: string) => (
                        <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      id={field.name}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ""}
                      onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ 
                width: "100%", 
                marginTop: "0.5rem", 
                padding: "1rem",
                background: (!!formData.serviceId && !selectedSvcStatus?.isOpen) ? "var(--border)" : "var(--primary)"
              }}
              disabled={loading || (!!formData.serviceId && !selectedSvcStatus?.isOpen)}
            >
              {loading ? "Processing..." : (!!formData.serviceId && !selectedSvcStatus?.isOpen) ? "Queue is Closed" : "Get My Ticket"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTrack} style={{ animation: "fade-in 0.3s ease" }}>
            <div className="form-group">
              <label>Ticket Number</label>
              <input
                type="number"
                placeholder="e.g. 42"
                value={trackData.ticketNumber}
                onChange={(e) => setTrackData({ ...trackData, ticketNumber: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Student ID or Email</label>
              <input
                type="text"
                placeholder="The identifier used for the ticket"
                value={trackData.identifier}
                onChange={(e) => setTrackData({ ...trackData, identifier: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "1rem", padding: "1rem" }}
              disabled={loading}
            >
              {loading ? "Searching..." : "Track My Ticket →"}
            </button>
            <p style={{ marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-muted)", textAlign: "center" }}>
              Can't find your details? Please visit the office in person.
            </p>
          </form>
        )}

        <footer style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          <p>© {new Date().getFullYear()} {settings.campus_name || "FSQM"}</p>
          <a href="/admin/login" style={{ color: "var(--primary-light)", textDecoration: "none", marginTop: "0.25rem", display: "inline-block" }}>
            Admin Portal →
          </a>
        </footer>
      </div>
      <AIChat settings={settings} />
    </div>
  );
}
