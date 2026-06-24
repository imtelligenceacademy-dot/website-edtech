"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  School,
  Users,
  FileUp,
  ShieldCheck,
  FileBarChart2,
  KeyRound,
  Home,
  BookOpen,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  X,
} from "lucide-react";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";

import type { LucideIcon } from "lucide-react";
type NavItem = { href: string; label: string; icon: LucideIcon };

const navByRole: Record<Role, NavItem[]> = {
  "super-admin": [
    { href: "/super-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/super-admin/schools", label: "Schools", icon: School },
    { href: "/super-admin/accounts", label: "Accounts", icon: Users },
    { href: "/super-admin/files", label: "Files", icon: FileUp },
    { href: "/super-admin/access", label: "Access Control", icon: KeyRound },
    { href: "/super-admin/ai", label: "AI Assistant", icon: Sparkles },
    { href: "/super-admin/reports", label: "Reports", icon: FileBarChart2 },
    { href: "/super-admin/security", label: "Security Logs", icon: ShieldCheck },
  ],
  "school-admin": [
    { href: "/school-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/school-admin/ai", label: "AI Assistant", icon: Sparkles },
    { href: "/school-admin/reports", label: "Reports", icon: FileBarChart2 },
    { href: "/school-admin/security", label: "Security Alerts", icon: AlertTriangle },
  ],
  teacher: [
    { href: "/teacher/home", label: "Home", icon: Home },
    { href: "/teacher/lessons", label: "My Lessons", icon: BookOpen },
    { href: "/teacher/ai", label: "AI Assistant", icon: Sparkles },
    { href: "/teacher/progress", label: "Progress", icon: TrendingUp },
  ],
};

export function Sidebar({
  role,
  mobile = false,
  onNavigate,
}: {
  role: Role;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = navByRole[role];

  return (
    <aside
      className={cn(
        "flex flex-col w-60 bg-slate-900 text-slate-200 min-h-screen sidebar-scroll",
        mobile ? "fixed inset-y-0 left-0 z-50 shadow-2xl" : "hidden md:flex"
      )}
    >
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2" onClick={onNavigate}>
            <div className="h-8 w-8 rounded-md bg-brand flex items-center justify-center text-white font-bold">
              IM
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">IM-Telligence</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">
                {role.replace("-", " ")}
              </p>
            </div>
          </Link>
          {mobile && (
            <button
              type="button"
              onClick={onNavigate}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-brand text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-[11px] text-slate-500 border-t border-slate-800">
        v0.1 · Mock build
      </div>
    </aside>
  );
}
