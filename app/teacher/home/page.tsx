"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, AlertTriangle, ChevronRight, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { WatchdogBadge } from "@/components/watchdog/WatchdogBadge";
import { mockLessons } from "@/data/mockLessons";
import { mockProgress } from "@/data/mockProgress";
import { getSession } from "@/lib/mockAuth";
import { formatDateOnly } from "@/lib/utils";

export default function TeacherHome() {
  const [userId, setUserId] = useState<string | undefined>();
  const [name, setName] = useState<string>("");
  useEffect(() => {
    const s = getSession();
    setUserId(s?.userId);
    setName(s?.name ?? "");
  }, []);
  if (!userId) return null;

  const assigned = mockLessons.filter((l) => l.assignedTeacherIds.includes(userId));
  const myProgress = mockProgress.filter((p) => p.teacherId === userId);
  const current = assigned.find((l) => {
    const p = myProgress.find((x) => x.lessonId === l.id);
    return p && p.status === "in-progress";
  }) ?? assigned[0];
  const currentProgress = current
    ? myProgress.find((p) => p.lessonId === current.id)
    : undefined;
  const warnings = myProgress.filter((p) => p.watchdogMessage);

  return (
    <>
      <PageHeader
        title={`Welcome, ${name.split(" ")[0] ?? "Teacher"}`}
        subtitle="Your assigned lessons and current focus."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Current lesson */}
        <Card className="lg:col-span-2">
          <CardHeader title="Current lesson" subtitle="Pick up where you left off." />
          <CardBody>
            {current ? (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500">
                    {current.subject} · Grade {current.grade} · Due{" "}
                    {formatDateOnly(current.dueDate)}
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900 mt-1">
                    {current.title}
                  </h3>
                  {currentProgress && (
                    <div className="mt-3 w-72">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Progress</span>
                        <span className="tabular-nums">
                          {currentProgress.percentComplete}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-brand"
                          style={{ width: `${currentProgress.percentComplete}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <Link href={`/teacher/lessons/${current.id}`}>
                  <Button>
                    Open <ChevronRight size={14} />
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No lessons assigned to you yet.
              </p>
            )}
          </CardBody>
        </Card>

        {/* Watchdog */}
        <Card>
          <CardHeader title="Watchdog" subtitle="Things to keep an eye on." />
          <CardBody className="space-y-2">
            {warnings.length === 0 && (
              <p className="text-sm text-slate-500">All clear.</p>
            )}
            {warnings.map((w) => (
              <div
                key={w.id}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3"
              >
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle size={14} />
                  <WatchdogBadge status={w.watchdog} />
                </div>
                <p className="mt-1 text-xs text-amber-900">{w.watchdogMessage}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Assigned lessons"
          subtitle={`${assigned.length} total`}
          action={
            <Link href="/teacher/ai">
              <Button variant="secondary" size="sm">
                <Sparkles size={12} /> Ask AI
              </Button>
            </Link>
          }
        />
        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {assigned.map((l) => {
            const p = myProgress.find((x) => x.lessonId === l.id);
            return (
              <Link
                key={l.id}
                href={`/teacher/lessons/${l.id}`}
                className="rounded-lg border border-slate-200 hover:border-brand p-4 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500">
                      Grade {l.grade} · {l.subject}
                    </p>
                    <h4 className="font-medium text-slate-900 mt-1">{l.title}</h4>
                  </div>
                  <BookOpen size={16} className="text-slate-400" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge tone="muted">{l.slides.length} slides</Badge>
                  {p && <WatchdogBadge status={p.watchdog} />}
                </div>
              </Link>
            );
          })}
        </CardBody>
      </Card>
    </>
  );
}
