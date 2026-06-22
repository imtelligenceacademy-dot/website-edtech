"use client";

import { useRouter } from "next/navigation";
import { LogOut, Menu, Search } from "lucide-react";
import type { Session } from "@/types";
import { mockSchools } from "@/data/mockSchools";
import { signOut } from "@/lib/mockAuth";
import { initials } from "@/lib/utils";

export function Topbar({
  session,
  onOpenNavigation,
}: {
  session: Session;
  onOpenNavigation: () => void;
}) {
  const router = useRouter();
  const school = session.schoolId
    ? mockSchools.find((s) => s.id === session.schoolId)?.name
    : "All schools";

  function handleSignOut() {
    signOut();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 h-14">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <button
          type="button"
          onClick={onOpenNavigation}
          className="mr-1 rounded-md p-1 text-slate-500 hover:bg-slate-100 md:hidden"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
        <Search size={14} />
        <span>{school}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-medium text-slate-900 leading-tight">
            {session.name}
          </p>
          <p className="text-[11px] text-slate-500 leading-tight">
            {session.role.replace("-", " ")}
          </p>
        </div>
        <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
          {initials(session.name)}
        </div>
        <button
          onClick={handleSignOut}
          className="text-slate-400 hover:text-slate-700 p-1"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
