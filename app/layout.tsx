import "./globals.css";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/Toast";
import type { Metadata } from "next";
import prisma from "@/lib/db";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const settingsArray = await (prisma as any).setting.findMany();
  const settings = Object.fromEntries(settingsArray.map((s: any) => [s.key, s.value]));
  
  return {
    title: settings.campus_name || "Campus Queue Manager",
    description: "Skip the wait. Get your digital ticket now.",
    icons: {
      icon: settings.favicon_url || "/favicon.ico",
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
