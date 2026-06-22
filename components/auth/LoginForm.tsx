"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, homePathFor } from "@/lib/mockAuth";
import { demoAccounts, mockUsers } from "@/data/mockUsers";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    // TODO: replace with real credential verification.
    const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      setError("No account with that email.");
      return;
    }
    if (user.status === "pending") {
      setError("Your account is pending approval by Super Admin.");
      return;
    }
    if (user.status !== "active") {
      setError("Account is not active. Contact your administrator.");
      return;
    }
    const session = signIn(user.id);
    if (!session) {
      setError("Sign-in failed.");
      return;
    }
    router.push(homePathFor(session.role));
  }

  function loginAs(userId: string) {
    const s = signIn(userId);
    if (s) router.push(homePathFor(s.role));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleLogin} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
            className="mt-1 w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            required
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
          <span className="bg-white px-2 text-slate-500">Demo · role selection</span>
        </div>
      </div>

      <div className="space-y-2">
        {demoAccounts.map((a) => (
          <button
            key={a.userId}
            onClick={() => loginAs(a.userId)}
            className="w-full text-left text-sm border border-slate-200 hover:border-brand hover:bg-brand-50 rounded-lg px-3 py-2 transition-colors"
          >
            <span className="font-medium text-slate-900">Sign in as </span>
            <span className="text-brand-700">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
