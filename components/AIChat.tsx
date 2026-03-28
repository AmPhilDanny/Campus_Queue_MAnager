"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";

export default function AIChat({ settings }: { settings: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "model", text: string }[]>([]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const botName = settings.ai_bot_name || "Campus Assistant";
  const primaryColor = settings.primary_color || "#1e40af";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map(m => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.text }]
          }))
        }),
      });

      const data = await res.json();
      if (data.text) {
        setMessages(prev => [...prev, { role: "model", text: data.text }]);
      } else if (data.error) {
        setMessages(prev => [...prev, { role: "model", text: "⚠️ " + data.error }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "model", text: "❌ Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (settings.ai_chat_enabled !== "true") return null;

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          width: "60px",
          height: "60px",
          borderRadius: "30px",
          background: `linear-gradient(135deg, ${primaryColor}, #3b82f6)`,
          color: "white",
          border: "none",
          boxShadow: "0 10px 25px -5px rgba(30, 64, 175, 0.4)",
          cursor: "pointer",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isOpen ? (
          <X size={28} />
        ) : (
          <div style={{ position: "relative" }}>
            <Bot size={32} strokeWidth={2.5} />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                width: "12px",
                height: "12px",
                background: "#10b981",
                borderRadius: "50%",
                border: "2px solid white",
              }}
            />
          </div>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: "fixed",
              bottom: isMobile ? "0" : "6.5rem",
              right: isMobile ? "0" : "2rem",
              width: isMobile ? "100%" : "380px",
              height: isMobile ? "100%" : "550px",
              background: "white",
              borderRadius: isMobile ? "0" : "20px",
              boxShadow: "0 20px 50px -10px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              zIndex: 1000,
              border: isMobile ? "none" : "1px solid #e2e8f0",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "1.25rem",
                background: `linear-gradient(135deg, ${primaryColor}, #3b82f6)`,
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                paddingTop: isMobile ? "env(safe-area-inset-top, 1.25rem)" : "1.25rem",
              }}
            >
              <div style={{ background: "rgba(255,255,255,0.2)", padding: "0.5rem", borderRadius: "12px" }}>
                <Bot size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, color: "white", fontSize: "1rem" }}>{botName}</h4>
                <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.8 }}>Online · AI Assistant</p>
              </div>
              {isMobile && (
                <button 
                  onClick={() => setIsOpen(false)}
                  style={{ background: "none", border: "none", color: "white", padding: "0.5rem" }}
                >
                  <X size={24} />
                </button>
              )}
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                background: "#f8fafc",
              }}
            >
              {messages.length === 0 && (
                <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#64748b" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👋</div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.25rem" }}>
                    How can I help you?
                  </p>
                  <p style={{ fontSize: "0.8125rem" }}>
                    Ask me about office hours, requirements, or queue status.
                  </p>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                    gap: "0.5rem",
                  }}
                >
                  {m.role === "model" && (
                    <div style={{ width: "28px", height: "28px", background: "#e2e8f0", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Bot size={14} color={primaryColor} />
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "0.75rem 1rem",
                      borderRadius: m.role === "user" ? "18px 18px 2px 18px" : "18px 18px 18px 2px",
                      background: m.role === "user" ? primaryColor : "white",
                      color: m.role === "user" ? "white" : "#1e293b",
                      fontSize: "0.875rem",
                      boxShadow: m.role === "model" ? "0 2px 5px rgba(0,0,0,0.05)" : "none",
                      border: m.role === "model" ? "1px solid #e2e8f0" : "none",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div style={{ width: "28px", height: "28px", background: "#e2e8f0", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Bot size={14} color={primaryColor} />
                  </div>
                  <div style={{ padding: "0.75rem 1rem", borderRadius: "18px 18px 18px 2px", background: "white", border: "1px solid #e2e8f0" }}>
                    <Loader2 size={16} className="animate-spin" color="#64748b" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSend}
              style={{
                padding: "1rem",
                paddingBottom: isMobile ? "calc(env(safe-area-inset-bottom, 1rem) + 0.5rem)" : "1rem",
                background: "white",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                gap: "0.5rem",
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  padding: "0.6rem 1rem",
                  borderRadius: "20px",
                  border: "1px solid #e2e8f0",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "20px",
                  background: input.trim() ? primaryColor : "#f1f5f9",
                  color: input.trim() ? "white" : "#94a3b8",
                  border: "none",
                  cursor: input.trim() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
