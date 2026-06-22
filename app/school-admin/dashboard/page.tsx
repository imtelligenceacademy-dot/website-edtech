"use client";

import { useEffect, useState } from "react";
import { Users, AlertTriangle, BookOpen, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Table, THead, TR, TH, TD } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { WatchdogBadge } from "@/components/watchdog/WatchdogBadge";
import { mockUsers } from "@/data/mockUsers";
import { mockProgress } from "@/data/mockProgress";
import { mockLessons } from "@/data/mockLessons";
import { mockSecurityLogs } from "@/data/mockSecurityLogs";
import { mockSchools } from "@/data/mockSchools";
import { getSession } from "@/lib/mockAuth";

export default function SchoolAdminDashboard() {
  const [schoolId, setSchoolId] = useState<string | undefined>(undefined);
  useEffect(() => setSchoolId(getSession()?.schoolId), []);

  if (!schoolId) return null;
  const school = mockSchools.find((s) => s.id === schoolId);
  const teachers = mockUsers.filter((u) => u.role === "teacher" && u.schoolId === schoolId);
  const teacherIds = new Set(teachers.map((t) => t.id));
  const progress = mockProgress.filter((p) => teacherIds.has(p.teacherId));
  const lateCount = progress.filter((p) => p.watchdog === "late").length;
  const completion =
    progress.length === 0
      ? 0
      : Math.round(progress.reduce((acc, p) => acc + p.percentComplete, 0) / progress.length);
  const securityForSchool = mockSecurityLogs.filter(
    (l) => l.schoolId === schoolId && l.status !== "ok"
  );

  return (
    <>
      <PageHeader
        title={school?.name ?? "School"}
        subtitle="Monitoring view. Read-only access to teacher progress and alerts."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Teachers" value={teachers.length} icon={<Users size={18} />} />
        <StatCard
          label="Late lessons"
          value={lateCount}
          icon={<AlertTriangle size={18} />}
        />
        <StatCard
          label="Avg completion"
          value={`${completion}%`}
          icon={<BookOpen size={18} />}
        />
        <StatCard
          label="AI usage (7d)"
          value="312"
          delta="↑ 12% vs prev. week"
          icon={<Sparkles size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Teacher progress"
            subtitle="Across all assigned lessons"
          />
          <Table>
            <THead>
              <TR>
                <TH>Teacher</TH>
                <TH>Lesson</TH>
                <TH>Progress</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <tbody>
              {progress.map((p) => {
                const teacher = mockUsers.find((u) => u.id === p.teacherId);
                const lesson = mockLessons.find((l) => l.id === p.lessonId);
                return (
                  <TR key={p.id}>
                    <TD className="font-medium text-slate-900">{teacher?.name}</TD>
                    <TD>{lesson?.title}</TD>
                    <TD className="w-48">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-brand"
                            style={{ width: `${p.percentComplete}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 tabular-nums">
                          {p.percentComplete}%
                        </span>
                      </div>
                    </TD>
                    <TD>
                      <WatchdogBadge status={p.watchdog} />
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        </Card>

        <Card>
          <CardHeader title="Security alerts" subtitle="For this school" />
          <CardBody className="space-y-3">
            {securityForSchool.length === 0 && (
              <p className="text-sm text-slate-500">No alerts in the last 7 days.</p>
            )}
            {securityForSchool.map((l) => (
              <div
                key={l.id}
                className="rounded-lg border border-slate-100 p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{l.userName}</span>
                  <Badge tone={l.status === "blocked" ? "danger" : "warning"}>
                    {l.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1 capitalize">
                  {l.event.replace(/-/g, " ")} · {l.location.label}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
