"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Table, THead, TR, TH, TD } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { WatchdogBadge } from "@/components/watchdog/WatchdogBadge";
import { mockLessons } from "@/data/mockLessons";
import { mockProgress } from "@/data/mockProgress";
import { getSession } from "@/lib/mockAuth";
import type { LessonStatus } from "@/types";
import { formatDateOnly } from "@/lib/utils";

const statusTone: Record<LessonStatus, Parameters<typeof Badge>[0]["tone"]> = {
  "not-started": "muted",
  "in-progress": "info",
  completed: "success",
  late: "danger",
};

export default function MyLessonsPage() {
  const [userId, setUserId] = useState<string | undefined>();
  useEffect(() => setUserId(getSession()?.userId), []);
  if (!userId) return null;

  const lessons = mockLessons.filter((l) => l.assignedTeacherIds.includes(userId));

  return (
    <>
      <PageHeader title="My Lessons" subtitle="Lessons assigned to you by Super Admin." />
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Lesson</TH>
              <TH>Grade</TH>
              <TH>Slides</TH>
              <TH>Due</TH>
              <TH>Status</TH>
              <TH>Watchdog</TH>
            </TR>
          </THead>
          <tbody>
            {lessons.map((l) => {
              const p = mockProgress.find(
                (x) => x.teacherId === userId && x.lessonId === l.id
              );
              const status: LessonStatus = p?.status ?? "not-started";
              return (
                <TR key={l.id}>
                  <TD>
                    <Link
                      href={`/teacher/lessons/${l.id}`}
                      className="font-medium text-slate-900 hover:text-brand"
                    >
                      {l.title}
                    </Link>
                    <div className="text-xs text-slate-500">{l.subject}</div>
                  </TD>
                  <TD>{l.grade}</TD>
                  <TD>{l.slides.length}</TD>
                  <TD>{formatDateOnly(l.dueDate)}</TD>
                  <TD>
                    <Badge tone={statusTone[status]} className="capitalize">
                      {status.replace("-", " ")}
                    </Badge>
                  </TD>
                  <TD>{p ? <WatchdogBadge status={p.watchdog} /> : "—"}</TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
