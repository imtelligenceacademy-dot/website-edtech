"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardShell";
import { PPTViewer } from "@/components/ppt-viewer/PPTViewer";
import { Chatbot } from "@/components/ai/Chatbot";
import { Button } from "@/components/ui/Button";
import { mockLessons } from "@/data/mockLessons";
import { mockProgress } from "@/data/mockProgress";
import { getSession } from "@/lib/mockAuth";
import type { Session } from "@/types";

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => setSession(getSession()), []);
  if (!session) return null;

  const lesson = mockLessons.find((l) => l.id === id);
  if (!lesson) {
    return (
      <p className="text-sm text-slate-500">Lesson not found.</p>
    );
  }

  const progress = mockProgress.find(
    (p) => p.teacherId === session.userId && p.lessonId === lesson.id
  );
  // Mock: unlock slides up to current progress, minimum 1.
  const unlocked = Math.max(
    1,
    Math.ceil(((progress?.percentComplete ?? 0) / 100) * lesson.slides.length)
  );

  return (
    <>
      <PageHeader
        title={lesson.title}
        subtitle={`Grade ${lesson.grade} · ${lesson.subject}`}
        actions={
          <Button variant="secondary" size="sm" onClick={() => router.back()}>
            <ArrowLeft size={14} /> Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <PPTViewer
            lesson={lesson}
            session={session}
            requireLinearOrder={true}
            furthestSlideUnlocked={unlocked}
          />
        </div>
        <div className="h-[640px]">
          <Chatbot />
        </div>
      </div>
    </>
  );
}
