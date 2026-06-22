"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { mockSchools } from "@/data/mockSchools";

export function SignupForm() {
  const [submitted, setSubmitted] = useState(false);
  const [role, setRole] = useState<"teacher" | "school-admin">("teacher");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: POST signup to backend. For now, show pending-approval message.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-brand-100 bg-brand-50 p-4 text-sm text-brand-800">
        <p className="font-medium">Account requested.</p>
        <p className="mt-1 text-brand-700">
          Your account is pending approval by Super Admin. You&apos;ll receive an
          email once it has been reviewed.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs font-medium text-slate-700">Full name</label>
        <input
          required
          className="mt-1 w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-700">Email</label>
        <input
          type="email"
          required
          className="mt-1 w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-700">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="mt-1 w-full h-10 rounded-lg border border-slate-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="teacher">Teacher</option>
            <option value="school-admin">School Admin</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700">School</label>
          <select
            required
            className="mt-1 w-full h-10 rounded-lg border border-slate-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {mockSchools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit" className="w-full">
        Request account
      </Button>
      <p className="text-[11px] text-slate-500 text-center">
        Accounts must be approved by Super Admin before sign-in.
      </p>
    </form>
  );
}
