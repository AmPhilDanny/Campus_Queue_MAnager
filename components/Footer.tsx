"use client";

import React from "react";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, MapPin, Globe, ExternalLink } from "lucide-react";

interface FooterProps {
  settings: any;
}

/**
 * Customizable Footer component for FhinovaxSmartQM.
 * Displays 4 columns: Quick Links, Offices (dynamic), Resources, and Contact.
 */
export default function Footer({ settings }: FooterProps) {
  // Parse JSON settings safely
  const parseJSON = (str: string, fallback: any) => {
    try {
      return str ? JSON.parse(str) : fallback;
    } catch (e) {
      return fallback;
    }
  };

  const col1Links = parseJSON(settings.footer_col1_links, []);
  const col2Links = parseJSON(settings.footer_col2_links, []);
  const col3Links = parseJSON(settings.footer_col3_links, []);
  const socials = parseJSON(settings.footer_socials, {});

  const primaryColor = settings.primary_color || "#1e3a8a";

  return (
    <footer className="site-footer" style={{ borderTop: "1px solid var(--border)", background: "#fff", marginTop: "4rem" }}>
      <div className="footer-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 2rem" }}>
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "3rem" }}>
          
          {/* Column 1: Quick Links */}
          <div className="footer-col">
            <h4 style={{ color: primaryColor, marginBottom: "1.5rem", fontWeight: 700, fontSize: "1.1rem" }}>
              {settings.footer_col1_title || "Quick Links"}
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {col1Links.map((link: any, i: number) => (
                <li key={i} style={{ marginBottom: "0.75rem" }}>
                  <Link href={link.url} style={{ color: "var(--text-muted)", textDecoration: "none", transition: "color 0.2s", fontSize: "0.9375rem" }} className="hover-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
              {col1Links.length === 0 && <li style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No links configured.</li>}
            </ul>
          </div>

          {/* Column 2: Offices (Dynamic/Configurable) */}
          <div className="footer-col">
            <h4 style={{ color: primaryColor, marginBottom: "1.5rem", fontWeight: 700, fontSize: "1.1rem" }}>
              {settings.footer_col2_title || "Our Offices"}
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {col2Links.map((link: any, i: number) => (
                <li key={i} style={{ marginBottom: "0.75rem" }}>
                  <Link href={link.url} style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9375rem" }} className="hover-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
              {col2Links.length === 0 && <li style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Manage offices in the admin panel.</li>}
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="footer-col">
            <h4 style={{ color: primaryColor, marginBottom: "1.5rem", fontWeight: 700, fontSize: "1.1rem" }}>
              {settings.footer_col3_title || "Resources"}
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {col3Links.map((link: any, i: number) => (
                <li key={i} style={{ marginBottom: "0.75rem" }}>
                  <Link href={link.url} style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9375rem" }} className="hover-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Address & Contact */}
          <div className="footer-col">
            <h4 style={{ color: primaryColor, marginBottom: "1.5rem", fontWeight: 700, fontSize: "1.1rem" }}>
              {settings.footer_col4_title || "Contact Us"}
            </h4>
            <div style={{ display: "flex", gap: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              <MapPin size={20} style={{ flexShrink: 0, color: primaryColor }} />
              <p style={{ fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                {settings.footer_address || "Set your institution address in settings."}
              </p>
            </div>
            
            {/* Social Icons */}
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              {socials.facebook && (
                <a href={socials.facebook} target="_blank" rel="noopener noreferrer" style={{ color: primaryColor }} aria-label="Facebook">
                  <Facebook size={20} />
                </a>
              )}
              {socials.twitter && (
                <a href={socials.twitter} target="_blank" rel="noopener noreferrer" style={{ color: primaryColor }} aria-label="Twitter">
                  <Twitter size={20} />
                </a>
              )}
              {socials.instagram && (
                <a href={socials.instagram} target="_blank" rel="noopener noreferrer" style={{ color: primaryColor }} aria-label="Instagram">
                  <Instagram size={20} />
                </a>
              )}
              {socials.linkedin && (
                <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: primaryColor }} aria-label="LinkedIn">
                  <Linkedin size={20} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div style={{ borderTop: "1px solid var(--border)", marginTop: "4rem", paddingTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
            {settings.footer_copyright || `© ${new Date().getFullYear()} ${settings.campus_name || 'FhinovaxSmartQM'}. All rights reserved.`}
          </p>
          <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.8125rem" }}>
            <Link href="/admin/login" style={{ color: "var(--text-muted)", textDecoration: "none" }} className="hover-primary">
              Admin Login
            </Link>
            <a href="#" style={{ color: "var(--text-muted)", textDecoration: "none" }} className="hover-primary">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .hover-primary:hover {
          color: ${primaryColor} !important;
          text-decoration: underline !important;
        }
      `}</style>
    </footer>
  );
}
