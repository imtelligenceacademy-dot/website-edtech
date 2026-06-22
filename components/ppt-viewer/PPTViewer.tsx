"use client";

// Mock PPT viewer. Does not render real .pptx files.
//
// Screenshot prevention is not fully possible on the web. This UI uses deterrence:
// watermarking, no download controls, and logging. Real protection must be enforced
// server-side and via the upload pipeline.

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import type { Lesson, Session } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function PPTViewer({
  lesson,
  session,
  requireLinearOrder = true,
  furthestSlideUnlocked = 1,
}: {
  lesson: Lesson;
  session: Session;
  requireLinearOrder?: boolean;
  furthestSlideUnlocked?: number;
}) {
  const [current, setCurrent] = useState(1);
  const total = lesson.slides.length;
  const initialUnlocked = Math.min(total, Math.max(1, furthestSlideUnlocked));
  const [unlockedThrough, setUnlockedThrough] = useState(initialUnlocked);
  const [watermarkTime, setWatermarkTime] = useState("");
  const slide = lesson.slides[current - 1];
  const locked = requireLinearOrder && current > unlockedThrough;

  useEffect(() => {
    setUnlockedThrough(Math.min(total, Math.max(1, furthestSlideUnlocked)));
  }, [furthestSlideUnlocked, total]);

  useEffect(() => {
    setWatermarkTime(new Date().toLocaleString());
  }, []);

  function go(delta: number) {
    const next = current + delta;
    if (next < 1 || next > total) return;
    if (requireLinearOrder && next > unlockedThrough) {
      if (next !== current + 1 || current !== unlockedThrough) return;
      setUnlockedThrough(next);
    }
    setCurrent(next);
  }

  // Mock client IP — in production this comes from the server.
  const mockIp = "91.150.22.14";
  const watermark = `${session.email} · ${mockIp}${watermarkTime ? ` · ${watermarkTime}` : ""}`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-xs text-slate-500">
            {lesson.subject} · Grade {lesson.grade}
          </p>
          <h3 className="text-sm font-semibold text-slate-900">{lesson.title}</h3>
        </div>
        <Badge tone="muted">
          Slide {current} / {total}
        </Badge>
      </div>

      {/* Slide canvas */}
      <div className="relative bg-slate-100" style={{ aspectRatio: "16 / 9" }}>
        {locked ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
            <Lock size={28} />
            <p className="text-sm font-medium">This slide is locked</p>
            <p className="text-xs">Complete slide {furthestSlideUnlocked} to unlock.</p>
          </div>
        ) : (
          <div className="absolute inset-0 p-8 flex flex-col">
            <div className="flex-1 rounded-lg bg-white border border-slate-200 p-6 shadow-sm flex flex-col">
              <p className="text-xs uppercase tracking-wider text-brand-600 font-medium">
                Slide {slide.index}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">
                {slide.title}
              </h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {slide.body}
              </p>
              <div className="mt-auto pt-4">
                <div className="h-32 rounded-md bg-gradient-to-br from-brand-50 to-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                  Slide image placeholder
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Diagonal watermark overlay */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 flex flex-wrap items-center justify-center opacity-[0.08] text-slate-900 select-none"
            style={{ transform: "rotate(-22deg) scale(1.2)" }}
          >
            {Array.from({ length: 18 }).map((_, i) => (
              <span key={i} className="mx-8 my-4 text-[10px] whitespace-nowrap">
                {watermark}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => go(-1)}
          disabled={current === 1}
        >
          <ChevronLeft size={14} />
          Previous
        </Button>
        <p className="text-xs text-slate-500">
          {requireLinearOrder ? "Slides must be viewed in order" : "Free navigation"}
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => go(1)}
          disabled={current === total || locked}
        >
          Next
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}
