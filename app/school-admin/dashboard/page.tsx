"use client";

import { useEffect, useState } from "react";
import { Users, AlertTriangle, BookOpen, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardShell";
import { Badge } from "@/components/ui/Badge";
import { WatchdogBadge } from "@/components/watchdog/WatchdogBadge";
import {
  listLessons,
  listProgress,
  listSchools,
  listSecurityLogs,
  listUsers,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSchoolAdminTheme } from "@/lib/schoolAdminTheme";
import type { Lesson, ProgressEntry, School, SecurityLog, User } from "@/types";

export default function SchoolAdminDashboard() {
  const { theme } = useSchoolAdminTheme();
  const dark = theme === "dark";

  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      listSchools(),
      listUsers(),
      listProgress(),
      listLessons(),
      listSecurityLogs(),
    ])
      .then(([schoolRows, userRows, progressRows, lessonRows, logRows]) => {
        setSchools(schoolRows);
        setTeachers(userRows.filter((u) => u.role === "teacher"));
        setProgress(progressRows);
        setLessons(lessonRows);
        setSecurityLogs(logRows);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  const school = schools[0];
  const lateCount = progress.filter((p) => p.watchdog === "late").length;
  const completion =
    progress.length === 0
      ? 0
      : Math.round(progress.reduce((acc, p) => acc + p.percentComplete, 0) / progress.length);
  const securityForSchool = securityLogs.filter((l) => l.status !== "ok");

  const panel = cn(
    "rounded-2xl border backdrop-blur",
    dark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-white"
  );
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const strong = dark ? "text-white" : "text-slate-900";

  const stats = [
    { label: "Teachers", value: String(teachers.length), icon: Users, delta: undefined },
    { label: "Late lessons", value: String(lateCount), icon: AlertTriangle, delta: undefined },
    { label: "Avg completion", value: `${completion}%`, icon: BookOpen, delta: undefined },
    { label: "AI usage (7d)", value: "312", icon: Sparkles, delta: "12% vs prev. week" },
  ];

  return (
    <>
      <PageHeader
        title={school?.name ?? "School"}
        subtitle="Monitoring view. Read-only access to teacher progress and alerts."
      />

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={cn(panel, "p-4")}>
              <div className="flex items-center justify-between">
                <p className={cn("text-[11px] font-medium uppercase tracking-wider", muted)}>
                  {s.label}
                </p>
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    dark ? "bg-brand/20 text-brand-300" : "bg-brand-50 text-brand-600"
                  )}
                >
                  <Icon size={16} />
                </span>
              </div>
              <p className={cn("mt-3 text-3xl font-semibold", strong)}>{s.value}</p>
              {s.delta && (
                <p className="mt-1 text-[11px] text-emerald-500">{s.delta}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Teacher progress */}
        <div className={cn(panel, "overflow-hidden xl:col-span-2")}>
          <div className={cn("border-b px-5 py-4", dark ? "border-white/5" : "border-slate-100")}>
            <p className={cn("text-sm font-semibold", strong)}>Teacher progress</p>
            <p className={cn("text-xs", muted)}>Across all assigned lessons</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("text-left text-[11px] uppercase tracking-wider", muted)}>
                  <th className="px-5 py-2 font-medium">Teacher</th>
                  <th className="px-5 py-2 font-medium">Lesson</th>
                  <th className="px-5 py-2 font-medium">Progress</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {progress.map((p) => {
                  const teacher = teachers.find((u) => u.id === p.teacherId);
                  const lesson = lessons.find((l) => l.id === p.lessonId);
                  return (
                    <tr
                      key={p.id}
                      className={cn("border-t", dark ? "border-white/5" : "border-slate-100")}
                    >
                      <td className={cn("px-5 py-3 font-medium", strong)}>
                        {teacher?.name ?? p.teacherId}
                      </td>
                      <td className={cn("px-5 py-3", dark ? "text-slate-300" : "text-slate-600")}>
                        {lesson?.title ?? p.lessonId}
                      </td>
                      <td className="w-48 px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-1.5 flex-1 overflow-hidden rounded-full",
                              dark ? "bg-white/10" : "bg-slate-100"
                            )}
                          >
                            <div
                              className="h-full bg-gradient-to-r from-brand to-brand-700"
                              style={{ width: `${p.percentComplete}%` }}
                            />
                          </div>
                          <span className={cn("tabular-nums text-xs", muted)}>
                            {p.percentComplete}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <WatchdogBadge status={p.watchdog} />
                      </td>
                    </tr>
                  );
                })}
                {progress.length === 0 && (
                  <tr>
                    <td colSpan={4} className={cn("px-5 py-6 text-center", muted)}>
                      No progress to show yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security alerts */}
        <div className={cn(panel, "overflow-hidden")}>
          <div className={cn("border-b px-5 py-4", dark ? "border-white/5" : "border-slate-100")}>
            <p className={cn("text-sm font-semibold", strong)}>Security alerts</p>
            <p className={cn("text-xs", muted)}>For this school</p>
          </div>
          <div className="space-y-3 p-5">
            {securityForSchool.length === 0 && (
              <p className={cn("text-sm", muted)}>No alerts in the last 7 days.</p>
            )}
            {securityForSchool.map((l) => (
              <div
                key={l.id}
                className={cn(
                  "rounded-lg border p-3 text-sm",
                  dark ? "border-white/5 bg-white/[0.02]" : "border-slate-100"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("font-medium", strong)}>{l.userName}</span>
                  <Badge tone={l.status === "blocked" ? "danger" : "warning"}>{l.status}</Badge>
                </div>
                <p className={cn("mt-1 text-xs capitalize", muted)}>
                  {l.event.replace(/-/g, " ")} - {l.location.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
