"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, Search, Sun, Moon } from "lucide-react";
import type { Session } from "@/types";
import { listSchools, logout } from "@/lib/api";
import { cn, initials } from "@/lib/utils";
import { useSchoolAdminTheme } from "@/lib/schoolAdminTheme";

export function Topbar({
  session,
  onOpenNavigation,
}: {
  session: Session;
  onOpenNavigation: () => void;
}) {
  const router = useRouter();
  const { theme, toggle } = useSchoolAdminTheme();
  const dark = theme === "dark";
  const themeable = session.role === "school-admin";
  const [school, setSchool] = useState(session.schoolId ? "School" : "All schools");

  useEffect(() => {
    if (!session.schoolId) {
      setSchool("All schools");
      return;
    }
    listSchools()
      .then((schools) => {
        setSchool(schools.find((s) => s.id === session.schoolId)?.name ?? "School");
      })
      .catch(() => setSchool("School"));
  }, [session.schoolId]);

  async function handleSignOut() {
    await logout();
    router.push("/");
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 items-center justify-between border-b px-6 backdrop-blur-xl",
        dark ? "border-white/5 bg-slate-950/40" : "border-slate-200 bg-white"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 text-sm",
          dark ? "text-slate-400" : "text-slate-500"
        )}
      >
        <button
          type="button"
          onClick={onOpenNavigation}
          className={cn(
            "mr-1 rounded-md p-1 md:hidden",
            dark ? "hover:bg-white/10" : "hover:bg-slate-100"
          )}
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
        <Search size={14} />
        <span>{school}</span>
      </div>
      <div className="flex items-center gap-3">
        {themeable && (
          <button
            onClick={toggle}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border transition",
              dark
                ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            )}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        )}
        <div className="hidden text-right sm:block">
          <p
            className={cn(
              "text-xs font-medium leading-tight",
              dark ? "text-white" : "text-slate-900"
            )}
          >
            {session.name}
          </p>
          <p
            className={cn(
              "text-[11px] capitalize leading-tight",
              dark ? "text-slate-400" : "text-slate-500"
            )}
          >
            {session.role.replace("-", " ")}
          </p>
        </div>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
            dark
              ? "bg-gradient-to-br from-brand to-brand-700 text-white"
              : "bg-brand-100 text-brand-700"
          )}
        >
          {initials(session.name)}
        </div>
        <button
          onClick={handleSignOut}
          className={cn(
            "p-1",
            dark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"
          )}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
