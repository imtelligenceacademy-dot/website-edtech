"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Role, Session } from "@/types";
import { getSession } from "@/lib/mockAuth";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function DashboardShell({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== role) {
      router.replace("/");
      return;
    }
    setSession(s);
    setChecked(true);
  }, [role, router]);

  if (!checked || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar role={role} />
      {navigationOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/50 md:hidden"
            onClick={() => setNavigationOpen(false)}
            aria-label="Close navigation"
          />
          <div className="md:hidden">
            <Sidebar
              role={role}
              mobile
              onNavigate={() => setNavigationOpen(false)}
            />
          </div>
        </>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          session={session}
          onOpenNavigation={() => setNavigationOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1400px] w-full">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
