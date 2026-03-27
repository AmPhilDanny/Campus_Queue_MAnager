"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { useToast } from "@/components/Toast";

const DEFAULT_TEMPLATE = `Hello {customerName},

Your ticket #{ticketNumber} for {service} has been received.
📍 Position in queue: {position}
⏱ Estimated wait: {etaMinutes} minutes

Thank you for your patience.
— Campus Queue Manager`;

export default function AdminSettings() {
  const [settings, setSettings] = useState<any>({
    campus_name: "",
    primary_color: "#1e3a8a",
    secondary_color: "#ffffff",
    logo_text: "CQM",
    logo_url: "",
    favicon_url: "",
    notification_template: DEFAULT_TEMPLATE,
    notification_enabled: "true",
    sms_webhook_url: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"branding" | "templates">("branding");
  const [session, setSession] = useState<any>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/admin/me")
      .then(r => r.ok ? r.json() : null)
      .then(setSession);
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) =>
        setSettings((prev: any) => ({
          ...prev,
          ...data,
          notification_template: data.notification_template || DEFAULT_TEMPLATE,
        }))
      )
      .catch(() => showToast("Failed to load settings.", "error"));
  }, []);

  const handleUpload = async (file: File, type: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedSettings = { ...settings };
      
      if (logoFile) {
        updatedSettings.logo_url = await handleUpload(logoFile, "logo");
      }
      if (faviconFile) {
        updatedSettings.favicon_url = await handleUpload(faviconFile, "favicon");
      }

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings),
      });
      if (res.ok) {
        setSettings(updatedSettings);
        setLogoFile(null);
        setFaviconFile(null);
        showToast("Settings saved successfully!", "success");
      } else {
        showToast("Failed to save settings.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, value: string) =>
    setSettings((prev: any) => ({ ...prev, [key]: value }));

  const placeholders = [
    { tag: "{service}", desc: "Office / service name" },
    { tag: "{ticketNumber}", desc: "Student's ticket number" },
    { tag: "{position}", desc: "Current queue position" },
    { tag: "{etaMinutes}", desc: "Estimated wait time" },
    { tag: "{customerName}", desc: "Student's full name" },
  ];

  const insertPlaceholder = (tag: string) => {
    set("notification_template", settings.notification_template + tag);
  };

  return (
    <div className="admin-container">
      <AdminNav />

      <main className="admin-main">
        <header className="admin-header">
          <div style={{ marginBottom: "0.5rem" }}>
            <Link href="/admin/dashboard" className="btn btn-ghost" style={{ padding: "0.4rem 0.75rem", fontSize: "0.875rem", gap: "0.4rem" }}>
              ← Return to Dashboard
            </Link>
          </div>
          <h1>System Settings</h1>
          <p>Customize university branding and notification templates.</p>
        </header>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0", marginBottom: "1.5rem", borderBottom: "2px solid var(--border)" }}>
          {(["branding", "templates"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.75rem 1.5rem",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontWeight: activeTab === tab ? 700 : 500,
                fontSize: "1rem",
                color: activeTab === tab ? "var(--primary)" : "var(--text-muted)",
                borderBottom: activeTab === tab ? "2.5px solid var(--primary)" : "2.5px solid transparent",
                marginBottom: "-2px",
              }}
            >
              {tab === "branding" ? "🎨 Branding" : "📝 Notification Template"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* ── BRANDING TAB ── */}
          {activeTab === "branding" && (
            <>
              <div className="card" style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ marginBottom: "1.25rem" }}>University Identity</h3>

                <div className="form-group">
                  <label>University / College Name</label>
                  <input
                    type="text"
                    value={settings.campus_name}
                    onChange={(e) => set("campus_name", e.target.value)}
                    placeholder="e.g. University of Lagos"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Logo Text / Label</label>
                  <input
                    type="text"
                    value={settings.logo_text}
                    onChange={(e) => set("logo_text", e.target.value)}
                    placeholder="CQM"
                  />
                </div>

                <div className="form-group" style={{ maxWidth: "200px" }}>
                  <label>Default Wait Time (min) *</label>
                  <input
                    type="number"
                    value={settings.default_wait_min || "5"}
                    onChange={(e) => set("default_wait_min", e.target.value)}
                    min="1"
                    max="60"
                  />
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                    Used for ETA when no historical data exists.
                  </p>
                </div>

                <div className="form-group">
                  <label>University Logo (Upload)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    style={{ padding: "0.5rem 0", border: "none" }}
                  />
                  {(logoFile || settings.logo_url) && (
                    <img
                      src={logoFile ? URL.createObjectURL(logoFile) : settings.logo_url}
                      alt="logo preview"
                      style={{ marginTop: "0.75rem", maxHeight: "60px", maxWidth: "180px", objectFit: "contain", borderRadius: "6px" }}
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                  )}
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                    Recommended height: 60px.
                  </p>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Favicon (Upload)</label>
                  <input
                    type="file"
                    accept="image/png, image/x-icon, image/svg+xml"
                    onChange={(e) => setFaviconFile(e.target.files?.[0] || null)}
                    style={{ padding: "0.5rem 0", border: "none" }}
                  />
                  {(faviconFile || settings.favicon_url) && (
                    <img
                      src={faviconFile ? URL.createObjectURL(faviconFile) : settings.favicon_url}
                      alt="favicon preview"
                      style={{ marginTop: "0.75rem", maxHeight: "32px", maxWidth: "32px", objectFit: "contain", borderRadius: "4px" }}
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                  )}
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                    Standard size: 32x32px.
                  </p>
                </div>
              </div>

              <div className="card" style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ marginBottom: "1.25rem" }}>Brand Colors</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Primary Brand Color</label>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input
                        type="color"
                        value={settings.primary_color}
                        onChange={(e) => set("primary_color", e.target.value)}
                        style={{ height: "44px", width: "60px", padding: "2px", cursor: "pointer" }}
                      />
                      <input
                        type="text"
                        value={settings.primary_color}
                        onChange={(e) => set("primary_color", e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Secondary / Text Color</label>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input
                        type="color"
                        value={settings.secondary_color}
                        onChange={(e) => set("secondary_color", e.target.value)}
                        style={{ height: "44px", width: "60px", padding: "2px", cursor: "pointer" }}
                      />
                      <input
                        type="text"
                        value={settings.secondary_color}
                        onChange={(e) => set("secondary_color", e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="card" style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ marginBottom: "1rem" }}>Live Preview</h3>
                <div
                  style={{
                    padding: "1.5rem",
                    borderRadius: "var(--radius)",
                    background: "white",
                    border: `2px solid ${settings.primary_color}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.875rem",
                  }}
                >
                  {settings.logo_url && (
                    <img
                      src={settings.logo_url}
                      alt="Logo"
                      style={{ maxHeight: "60px", maxWidth: "100%", objectFit: "contain" }}
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                  )}
                  <h4 style={{ color: settings.primary_color, margin: 0 }}>
                    {settings.campus_name || "University Name"}
                  </h4>
                  <button
                    type="button"
                    style={{
                      background: settings.primary_color,
                      color: settings.secondary_color,
                      padding: "0.5rem 1.25rem",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 600,
                    }}
                  >
                    Sample Button
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── TEMPLATE TAB ── */}
          {activeTab === "templates" && (
            <>
              <div className="card" style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ marginBottom: "0.5rem" }}>Notification Template</h3>
                <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                  This template is used for email confirmations and webhook payloads. Use the placeholders below.
                </p>

                <div style={{ display: "flex", gap: "2rem", marginBottom: "1.5rem", background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={settings.notification_enabled === "true"}
                        onChange={(e) => set("notification_enabled", e.target.checked ? "true" : "false")}
                        style={{ width: "18px", height: "18px" }}
                      />
                      <span style={{ fontWeight: 600 }}>Enable Notifications Globally</span>
                    </label>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label>SMS / Webhook URL (POST)</label>
                  <input
                    type="text"
                    value={settings.sms_webhook_url}
                    onChange={(e) => set("sms_webhook_url", e.target.value)}
                    placeholder="https://your-webhook-endpoint.com/sms"
                  />
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                    If provided, we will POST a JSON payload to this URL when a ticket is called.
                  </p>
                </div>

                {/* Placeholder chips */}
                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.5rem", color: "var(--text-main)" }}>
                    Insert Placeholder:
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {placeholders.map((p) => (
                      <button
                        key={p.tag}
                        type="button"
                        onClick={() => insertPlaceholder(p.tag)}
                        title={p.desc}
                        style={{
                          padding: "0.3rem 0.75rem",
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          borderRadius: "20px",
                          color: "#1d4ed8",
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "monospace",
                        }}
                      >
                        {p.tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Template Body</label>
                  <textarea
                    value={settings.notification_template}
                    onChange={(e) => set("notification_template", e.target.value)}
                    rows={12}
                    style={{ fontFamily: "monospace", fontSize: "0.9375rem", lineHeight: 1.65 }}
                    placeholder={DEFAULT_TEMPLATE}
                  />
                </div>

                <div
                  style={{
                    marginTop: "1rem",
                    padding: "0.75rem 1rem",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "0.5rem" }}>
                    Available Placeholders:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    {placeholders.map((p) => (
                      <p key={p.tag} style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                        <code style={{ fontWeight: 700, color: "#1d4ed8" }}>{p.tag}</code> — {p.desc}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live preview of template */}
              <div className="card" style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ marginBottom: "1rem" }}>Template Preview</h3>
                <div
                  style={{
                    padding: "1.25rem",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                    lineHeight: 1.75,
                    whiteSpace: "pre-wrap",
                    color: "var(--text-main)",
                  }}
                >
                  {settings.notification_template
                    .replace("{service}", settings.campus_name || "Registrar's Office")
                    .replace("{ticketNumber}", "042")
                    .replace("{position}", "3")
                    .replace("{etaMinutes}", "15")
                    .replace("{customerName}", "Amara Osei")}
                </div>
              </div>
            </>
          )}

          {session?.role === "SUPER_ADMIN" && (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: "100%", fontSize: "1.0625rem", padding: "0.875rem" }}
            >
              {loading ? "Saving…" : "💾 Save All Settings"}
            </button>
          )}
        </form>
      </main>
    </div>
  );
}
