"use client";

import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [tab, setTab] = useState<"login" | "signup">("login");

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-brand flex items-center justify-center font-bold">
              IM
            </div>
            <span className="font-semibold">IM-Telligence</span>
          </div>
        </div>
        <div className="relative z-10 max-w-md">
          <p className="text-[11px] uppercase tracking-widest text-brand-300 mb-3">
            Teacher platform
          </p>
          <h1 className="text-3xl font-semibold leading-tight">
            Assigned lessons, AI assistance, and progress in one place.
          </h1>
          <p className="mt-4 text-slate-300 text-sm leading-relaxed">
            Built for K-12 STEAM classrooms. Super Admin distributes lessons,
            school admins monitor progress, teachers focus on teaching.
          </p>
        </div>
        <div className="relative z-10 text-xs text-slate-500">
          © {new Date().getFullYear()} IM-Telligence
        </div>
        {/* decorative glow */}
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-md bg-brand flex items-center justify-center text-white font-bold">
              IM
            </div>
            <span className="font-semibold text-slate-900">IM-Telligence</span>
          </div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              {tab === "login" ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {tab === "login"
                ? "Sign in to continue to your dashboard."
                : "Request access — Super Admin will approve."}
            </p>
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 mb-6 text-xs">
            <button
              onClick={() => setTab("login")}
              className={cn(
                "px-3 py-1.5 rounded-md font-medium",
                tab === "login"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Sign in
            </button>
            <button
              onClick={() => setTab("signup")}
              className={cn(
                "px-3 py-1.5 rounded-md font-medium",
                tab === "signup"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Sign up
            </button>
          </div>

          {tab === "login" ? <LoginForm /> : <SignupForm />}
        </div>
      </div>
    </div>
  );
}
