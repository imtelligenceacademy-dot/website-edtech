"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { WatchdogBadge } from "@/components/watchdog/WatchdogBadge";
import { mockProgress } from "@/data/mockProgress";
import { mockLessons } from "@/data/mockLessons";
import { getSession } from "@/lib/mockAuth";
import { formatDate } from "@/lib/utils";

export default function TeacherProgressPage() {
  const [userId, setUserId] = useState<string | undefined>();
  useEffect(() => setUserId(getSession()?.userId), []);
  if (!userId) return null;

  const mine = mockProgress.filter((p) => p.teacherId === userId);
  const completed = mine.filter((p) => p.status === "completed").length;
  const late = mine.filter((p) => p.status === "late").length;
  const avg =
    mine.length === 0
      ? 0
      : Math.round(mine.reduce((acc, p) => acc + p.percentComplete, 0) / mine.length);

  return (
    <>
      <PageHeader title="Your progress" subtitle="Across all assigned lessons." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Avg completion" value={`${avg}%`} icon={<Clock size={18} />} />
        <StatCard label="Completed" value={completed} icon={<CheckCircle2 size={18} />} />
        <StatCard label="Late" value={late} icon={<AlertTriangle size={18} />} />
      </div>

      <Card>
        <CardHeader title="Lesson detail" />
        <CardBody className="space-y-3">
          {mine.map((p) => {
            const l = mockLessons.find((x) => x.id === p.lessonId);
            return (
              <div
                key={p.id}
                className="rounded-lg border border-slate-200 p-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900 truncate">
                      {l?.title}
                    </h4>
                    <WatchdogBadge status={p.watchdog} />
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Last opened: {formatDate(p.lastOpenedAt)}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-brand"
                        style={{ width: `${p.percentComplete}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-slate-500 w-10 text-right">
                      {p.percentComplete}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardBody>
      </Card>
    </>
  );
}
