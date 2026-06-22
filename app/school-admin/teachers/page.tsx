"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Table, THead, TR, TH, TD } from "@/components/ui/Table";
import { WatchdogBadge } from "@/components/watchdog/WatchdogBadge";
import { Badge } from "@/components/ui/Badge";
import { mockUsers } from "@/data/mockUsers";
import { mockProgress } from "@/data/mockProgress";
import { mockLessons } from "@/data/mockLessons";
import { getSession } from "@/lib/mockAuth";
import { formatDate } from "@/lib/utils";

export default function TeachersProgressPage() {
  const [schoolId, setSchoolId] = useState<string | undefined>();
  useEffect(() => setSchoolId(getSession()?.schoolId), []);
  if (!schoolId) return null;

  const teachers = mockUsers.filter(
    (u) => u.role === "teacher" && u.schoolId === schoolId
  );

  return (
    <>
      <PageHeader
        title="Teacher Progress"
        subtitle="Read-only view of all assigned lessons and watchdog signals."
      />
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Teacher</TH>
              <TH>Lesson</TH>
              <TH>Grade</TH>
              <TH>Progress</TH>
              <TH>Last opened</TH>
              <TH>Watchdog</TH>
              <TH>Note</TH>
            </TR>
          </THead>
          <tbody>
            {teachers.flatMap((t) => {
              const entries = mockProgress.filter((p) => p.teacherId === t.id);
              if (entries.length === 0)
                return [
                  <TR key={t.id}>
                    <TD className="font-medium text-slate-900">{t.name}</TD>
                    <TD className="text-slate-500" >No assignments</TD>
                    <TD>—</TD>
                    <TD>—</TD>
                    <TD>—</TD>
                    <TD>—</TD>
                    <TD>—</TD>
                  </TR>,
                ];
              return entries.map((p) => {
                const lesson = mockLessons.find((l) => l.id === p.lessonId);
                return (
                  <TR key={p.id}>
                    <TD className="font-medium text-slate-900">{t.name}</TD>
                    <TD>{lesson?.title}</TD>
                    <TD>{lesson?.grade}</TD>
                    <TD className="w-44">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-brand"
                            style={{ width: `${p.percentComplete}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-slate-500">
                          {p.percentComplete}%
                        </span>
                      </div>
                    </TD>
                    <TD className="text-xs">{formatDate(p.lastOpenedAt)}</TD>
                    <TD>
                      <WatchdogBadge status={p.watchdog} />
                    </TD>
                    <TD className="text-xs text-slate-600 max-w-xs">
                      {p.watchdogMessage ? (
                        <Badge tone="warning">{p.watchdogMessage}</Badge>
                      ) : (
                        "—"
                      )}
                    </TD>
                  </TR>
                );
              });
            })}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
