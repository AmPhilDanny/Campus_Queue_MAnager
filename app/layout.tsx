/**
 * Root Layout Component
 * 
 * This is the main wrapper for the entire application.
 * It handles:
 * 1. Global SEO metadata generation (dynamic).
 * 2. Theme injection via CSS variables (Primary color, Typography).
 * 3. Dynamic Google Font loading.
 * 4. Application-wide providers (Toast, etc.).
 * 5. Global layout structure (Sticky footer).
 */

import "./globals.css";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/components/ThemeContext";
import Footer from "@/components/Footer";
import type { Metadata } from "next";
import prisma from "@/lib/db";

// Fallback font for the application
const inter = Inter({ subsets: ["latin"] });

/**
 * Generates metadata for the page by fetching institutional branding from the database.
 */
export async function generateMetadata(): Promise<Metadata> {
  // Fetch all settings from the database
  const settingsArray = await (prisma as any).setting.findMany();
  const settings = Object.fromEntries(settingsArray.map((s: any) => [s.key, s.value]));
  
  return {
    title: settings.campus_name || "FhinovaxSmartQM",
    description: "Skip the wait. Get your digital ticket now.",
    icons: {
      icon: settings.favicon_url || "/favicon.ico",
    },
  };
}

/**
 * Root Layout Server Component
 * 
 * Fetches settings directly from Prisma to ensure theme and branding are applied 
 * during server-side rendering, preventing "flicker" of unstyled content.
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch institutional settings for theme and branding
  const settingsArray = await (prisma as any).setting.findMany();
  const settings = Object.fromEntries(settingsArray.map((s: any) => [s.key, s.value]));
  
  const primaryColor = settings.primary_color || "#1e3a8a";
  const fontFamily = settings.font_family || "Inter";

  return (
    <html lang="en">
      <head>
        {/* Dynamically load the selected Google Font if it's not the default Inter */}
        {fontFamily !== "Inter" && (
          <link
            href={`https://fonts.googleapis.com/css2?family=${fontFamily.replace(/'/g, "").replace(/ /g, "+")}:wght@400;500;600;700;800&display=swap`}
            rel="stylesheet"
          />
        )}
      </head>
      <body 
        className={fontFamily === "Inter" ? inter.className : ""}
        style={{ 
          // Inject brand variables into the CSS scope
          "--brand-primary": primaryColor,
          "--font-family": fontFamily
        } as any}
      >
        <ThemeProvider>
          <ToastProvider>
            {/* Main application container with sticky footer flexbox pattern */}
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1 }}>
                {children}
              </div>
              {/* Customizable footer shown on all pages */}
              <Footer settings={settings} />
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
