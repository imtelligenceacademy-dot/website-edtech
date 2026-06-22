"use client";

// Mock auth. Stores the current session in localStorage. No real verification.
// TODO: replace with real auth (NextAuth, Clerk, custom JWT, etc.) before production.

import type { Role, Session } from "@/types";
import { mockUsers } from "@/data/mockUsers";

const KEY = "imt_session";

export function signIn(userId: string): Session | null {
  const user = mockUsers.find((u) => u.id === userId);
  if (!user || user.status !== "active") return null;
  const session: Session = {
    userId: user.id,
    role: user.role,
    schoolId: user.schoolId,
    name: user.name,
    email: user.email,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(session));
  }
  return session;
}

export function signOut() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function homePathFor(role: Role): string {
  switch (role) {
    case "super-admin":
      return "/super-admin/dashboard";
    case "school-admin":
      return "/school-admin/dashboard";
    case "teacher":
      return "/teacher/home";
  }
}
