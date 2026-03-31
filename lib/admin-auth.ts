/**
 * Admin Authentication & Session Utility
 * 
 * Provides centralized logic for:
 * - JWT cookie management (creation and deletion).
 * - Middleware-based authentication checks.
 * - Role-based session retrieval (Admin vs. Super Admin).
 */

import { cookies } from "next/headers";

export interface AdminSession {
  id: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN";
  officeId?: string | null;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("cqm_session");
    
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    // Since it's currently a simple JSON string in the cookie (MVP)
    // In a real production app, this should be a signed JWT.
    const session = JSON.parse(sessionCookie.value) as AdminSession;
    return session;
  } catch (error) {
    return null;
  }
}

export async function isSuperAdmin(): Promise<boolean> {
  const session = await getAdminSession();
  return session?.role === "SUPER_ADMIN";
}

export async function getAdminOfficeId(): Promise<string | null | undefined> {
  const session = await getAdminSession();
  return session?.officeId;
}
