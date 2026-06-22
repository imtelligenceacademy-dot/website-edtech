"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mockLessons } from "@/data/mockLessons";
import { mockSchools } from "@/data/mockSchools";
import { mockUsers } from "@/data/mockUsers";

export default function AccessControlPage() {
  const [lessonId, setLessonId] = useState(mockLessons[0].id);
  const [schoolId, setSchoolId] = useState(mockSchools[0].id);
  const [assignments, setAssignments] = useState<Record<string, string[]>>(
    Object.fromEntries(mockLessons.map((lesson) => [lesson.id, lesson.assignedTeacherIds]))
  );
  const [saved, setSaved] = useState(false);

  const schoolTeachers = mockUsers.filter(
    (u) => u.role === "teacher" && u.schoolId === schoolId && u.status === "active"
  );
  const schoolTeacherIds = new Set(schoolTeachers.map((teacher) => teacher.id));
  const selected = (assignments[lessonId] ?? []).filter((id) => schoolTeacherIds.has(id));

  function toggle(id: string) {
    setAssignments((current) => {
      const lessonAssignments = current[lessonId] ?? [];
      return {
        ...current,
        [lessonId]: lessonAssignments.includes(id)
          ? lessonAssignments.filter((teacherId) => teacherId !== id)
          : [...lessonAssignments, id],
      };
    });
    setSaved(false);
  }

  function save() {
    // TODO: PATCH /api/lessons/:id/assignments
    setSaved(true);
  }

  return (
    <>
      <PageHeader
        title="Access Control"
        subtitle="Assign lessons to schools, grades, and teachers."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader title="1. Lesson" />
          <CardBody className="space-y-2">
            {mockLessons.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setLessonId(l.id);
                  setSaved(false);
                }}
                className={
                  "w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors " +
                  (lessonId === l.id
                    ? "border-brand bg-brand-50"
                    : "border-slate-200 hover:bg-slate-50")
                }
              >
                <div className="font-medium text-slate-900">{l.title}</div>
                <div className="text-xs text-slate-500">
                  Grade {l.grade} · {l.subject}
                </div>
              </button>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="2. School" />
          <CardBody className="space-y-2">
            {mockSchools.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSchoolId(s.id);
                  setSaved(false);
                }}
                className={
                  "w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors " +
                  (schoolId === s.id
                    ? "border-brand bg-brand-50"
                    : "border-slate-200 hover:bg-slate-50")
                }
              >
                <div className="font-medium text-slate-900">{s.name}</div>
                <div className="text-xs text-slate-500">
                  {s.teacherCount} teachers
                </div>
              </button>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="3. Teachers"
            subtitle={`${selected.length} selected`}
          />
          <CardBody className="space-y-2">
            {schoolTeachers.length === 0 && (
              <p className="text-xs text-slate-500">
                No active teachers in this school.
              </p>
            )}
            {schoolTeachers.map((t) => {
              const on = selected.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  className={
                    "w-full text-left rounded-lg border px-3 py-2 text-sm flex items-center justify-between transition-colors " +
                    (on
                      ? "border-brand bg-brand-50"
                      : "border-slate-200 hover:bg-slate-50")
                  }
                >
                  <span>
                    <span className="font-medium text-slate-900 block">{t.name}</span>
                    <span className="text-xs text-slate-500">{t.email}</span>
                  </span>
                  {on && <Check size={14} className="text-brand" />}
                </button>
              );
            })}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        {saved && (
          <Badge tone="success">
            <Check size={12} /> Assignment saved
          </Badge>
        )}
        <Button onClick={save}>
          Save assignment
        </Button>
      </div>
    </>
  );
}
