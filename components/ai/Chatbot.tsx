"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  Sparkles,
  FileText,
  CheckCircle2,
  HelpCircle,
  Bot,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Presentation,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { getSession, signOut } from "@/lib/mockAuth";
import type { AIMessage, Lesson, Session } from "@/types";
import {
  mockAIResponses,
  fallbackAIReply,
} from "@/data/mockAIMessages";
import { mockLessons } from "@/data/mockLessons";

// --- Workflow state (per Image 2) -------------------------------------------
const currentLesson = mockLessons[0];
const lightSensorLesson =
  mockLessons.find((l) => l.id === "les_g7_l04") ?? mockLessons[0];

type ReportEntry = {
  id: string;
  kind: "ppt" | "question";
  summary: string;
  at: string;
};

const PPT_KEYWORDS = [
  "next",
  "ppt",
  "slide",
  "presentation",
  "continue",
  "move on",
  "next one",
  "done",
  "finished",
  "complete",
  "accomplished",
  "mark",
];

function isPPTRequest(input: string): boolean {
  const lower = input.toLowerCase();
  return PPT_KEYWORDS.some((k) => lower.includes(k));
}

function isCompletionConfirmation(input: string): boolean {
  const lower = input.toLowerCase();
  return /\b(yes|yep|done|finished|complete|accomplished|mark it|i did)\b/.test(
    lower
  );
}

function pickQuestionReply(input: string): AIMessage {
  const lower = input.toLowerCase();
  const hit = mockAIResponses.find((r) => lower.includes(r.match));
  if (hit)
    return {
      ...hit.reply,
      id: `${hit.reply.id}_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  return {
    ...fallbackAIReply,
    id: `r_fallback_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
}

const SUGGESTIONS = [
  { label: "Show me the next slide", icon: FileText },
  { label: "Explain robots to Grade 5", icon: Sparkles },
  { label: "Open Grade 7 Lesson 4 — Light Sensor", icon: Presentation },
  { label: "Mark current slide as done", icon: CheckCircle2 },
];

// Detects requests to open a specific lesson pptx (currently only the Grade 7
// Light Sensor lesson is wired up; in production, an LLM + Lessons DB lookup
// would resolve any grade/lesson combination).
function detectOpenLesson(input: string): Lesson | null {
  const lower = input.toLowerCase();
  const mentionsLightSensor = lower.includes("light sensor");
  const mentionsG7L4 =
    (lower.includes("grade 7") || lower.includes("grade7") || lower.includes("g7")) &&
    (lower.includes("lesson 4") || lower.includes("lesson 04") || lower.includes("lesson four"));
  if (mentionsLightSensor || mentionsG7L4) return lightSensorLesson;
  return null;
}

export function Chatbot() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [currentSlideDone, setCurrentSlideDone] = useState(false);
  const [awaitingCompletion, setAwaitingCompletion] = useState(false);
  const [report, setReport] = useState<ReportEntry[]>([]);
  const [openedLesson, setOpenedLesson] = useState<Lesson | null>(null);
  const [openedSlide, setOpenedSlide] = useState(1);
  const [session, setSession] = useState<Session | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height =
        Math.min(inputRef.current.scrollHeight, 180) + "px";
    }
  }, [input]);

  function pushAssistant(content: string, extras: Partial<AIMessage> = {}) {
    setMessages((prev) => [
      ...prev,
      {
        id: `a_${Date.now()}`,
        role: "assistant",
        content,
        timestamp: new Date().toISOString(),
        ...extras,
      },
    ]);
  }

  function logReport(entry: Omit<ReportEntry, "id" | "at">) {
    setReport((prev) => [
      ...prev,
      { ...entry, id: `r_${Date.now()}`, at: new Date().toISOString() },
    ]);
  }

  function handlePPTBranch(text: string) {
    const slide = currentLesson.slides[slideIndex];
    const isLast = slideIndex >= currentLesson.slides.length - 1;

    if (awaitingCompletion) {
      if (isCompletionConfirmation(text)) {
        setCurrentSlideDone(true);
        setAwaitingCompletion(false);
        if (isLast) {
          pushAssistant(
            `Great — "${slide.title}" marked accomplished. That was the final slide of "${currentLesson.title}". Lesson complete.`,
            { sourceRef: `${currentLesson.title}, Slide ${slide.index}` }
          );
          logReport({
            kind: "ppt",
            summary: `Marked slide ${slide.index} done — lesson "${currentLesson.title}" completed.`,
          });
        } else {
          const next = currentLesson.slides[slideIndex + 1];
          setSlideIndex(slideIndex + 1);
          setCurrentSlideDone(false);
          pushAssistant(
            `Marked "${slide.title}" accomplished. Next up: Slide ${next.index} — "${next.title}".\n\n${next.body}`,
            { sourceRef: `${currentLesson.title}, Slide ${next.index}` }
          );
          logReport({
            kind: "ppt",
            summary: `Advanced from slide ${slide.index} → ${next.index} ("${next.title}").`,
          });
        }
      } else {
        pushAssistant(
          `No problem — finish "${slide.title}" first, then tell me when it's done and I'll send the next slide.`
        );
        logReport({
          kind: "ppt",
          summary: `Teacher did not yet complete slide ${slide.index} ("${slide.title}").`,
        });
      }
      return;
    }

    if (currentSlideDone) {
      if (isLast) {
        pushAssistant(
          `You've already finished the last slide of "${currentLesson.title}". Lesson complete.`
        );
        logReport({
          kind: "ppt",
          summary: `PPT request — lesson "${currentLesson.title}" already complete.`,
        });
      } else {
        const next = currentLesson.slides[slideIndex + 1];
        setSlideIndex(slideIndex + 1);
        setCurrentSlideDone(false);
        pushAssistant(
          `Here's the next one — Slide ${next.index}: "${next.title}".\n\n${next.body}`,
          { sourceRef: `${currentLesson.title}, Slide ${next.index}` }
        );
        logReport({
          kind: "ppt",
          summary: `Served next slide ${next.index} ("${next.title}").`,
        });
      }
    } else {
      setAwaitingCompletion(true);
      pushAssistant(
        `Before moving on — have you accomplished the current slide ("${slide.title}", Slide ${slide.index} of ${currentLesson.title})? Reply "yes" to mark it done and I'll send the next one.`,
        { sourceRef: `${currentLesson.title}, Slide ${slide.index}` }
      );
      logReport({
        kind: "ppt",
        summary: `Asked teacher to confirm completion of slide ${slide.index}.`,
      });
    }
  }

  function handleQuestionBranch(text: string) {
    const reply = pickQuestionReply(text);
    setMessages((prev) => [...prev, reply]);
    logReport({
      kind: "question",
      summary: `Q&A — "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`,
    });
  }

  function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text) return;
    const userMsg: AIMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    setTimeout(() => {
      const lessonToOpen = !awaitingCompletion ? detectOpenLesson(text) : null;
      if (lessonToOpen) {
        setOpenedLesson(lessonToOpen);
        setOpenedSlide(1);
        pushAssistant(
          `Opening "${lessonToOpen.title}" — Grade ${lessonToOpen.grade}, ${lessonToOpen.slides.length} slides. The deck is open on the left; ask me anything about a slide and I'll explain it here.`,
          { sourceRef: `${lessonToOpen.title}, Slide 1` }
        );
        logReport({
          kind: "ppt",
          summary: `Opened lesson "${lessonToOpen.title}" (Grade ${lessonToOpen.grade}).`,
        });
      } else if (awaitingCompletion || isPPTRequest(text)) {
        handlePPTBranch(text);
      } else {
        handleQuestionBranch(text);
      }
      setThinking(false);
    }, 600);
  }

  const slide = currentLesson.slides[slideIndex];
  const isEmpty = messages.length === 0;

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora-blob absolute -top-32 -left-24 h-96 w-96 rounded-full bg-brand/30 blur-3xl" />
        <div className="aurora-blob delay-1 absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="aurora-blob delay-2 absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.7)_100%)]" />
      </div>

      {/* PPTX viewer pane — shown to the left of the chat when a lesson is open */}
      {openedLesson && (
        <PPTXPane
          lesson={openedLesson}
          current={openedSlide}
          onPrev={() => setOpenedSlide((s) => Math.max(1, s - 1))}
          onNext={() =>
            setOpenedSlide((s) => Math.min(openedLesson.slides.length, s + 1))
          }
          onClose={() => setOpenedLesson(null)}
        />
      )}

      {/* Chat column */}
      <div className="relative z-10 flex h-full flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/5 px-6 py-4 backdrop-blur-xl">
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-fuchsia-500 shadow-lg shadow-brand/30">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">IM-Telligence AI</p>
            <p className="text-[11px] text-slate-400">
              Lesson copilot · routes PPT requests and questions
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-slate-300 sm:flex">
            {currentSlideDone ? (
              <>
                <CheckCircle2 size={12} className="text-emerald-400" />
                Slide {slide.index} done
              </>
            ) : (
              <>
                <FileText size={12} className="text-brand-300" />
                Slide {slide.index} of {currentLesson.slides.length}
              </>
            )}
          </div>
          <UserMenu session={session} />
        </div>

        {/* Messages or welcome */}
        <div
          ref={scrollRef}
          className="chat-scroll flex-1 overflow-y-auto px-4 py-6 sm:px-8"
        >
          {isEmpty ? (
            <WelcomeScreen
              lessonTitle={currentLesson.title}
              onPick={(s) => send(s)}
            />
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-6">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {thinking && <TypingIndicator />}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-white/5 bg-slate-950/40 px-4 py-4 backdrop-blur-xl sm:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="group relative flex items-end gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 shadow-lg shadow-black/30 transition focus-within:border-brand/60 focus-within:shadow-brand/20">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder={
                  awaitingCompletion
                    ? `Did you finish "${slide.title}"? yes / no`
                    : "Message IM-Telligence AI…"
                }
                className="max-h-[180px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim()}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition",
                  input.trim()
                    ? "bg-gradient-to-br from-brand to-fuchsia-500 text-white shadow-lg shadow-brand/40 hover:brightness-110"
                    : "bg-white/5 text-slate-500"
                )}
                aria-label="Send"
              >
                <ArrowUp size={16} />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-500">
              Press <kbd className="rounded bg-white/5 px-1 py-0.5">Enter</kbd>{" "}
              to send · <kbd className="rounded bg-white/5 px-1 py-0.5">Shift+Enter</kbd> for newline
            </p>
          </div>
        </div>
      </div>

      {/* Report rail — hidden while a pptx is open so the deck + chat get the space */}
      <aside
        className={cn(
          "relative z-10 hidden w-80 shrink-0 flex-col border-l border-white/5 bg-slate-950/40 backdrop-blur-xl",
          openedLesson ? "" : "xl:flex"
        )}
      >
        <div className="flex items-center gap-2 border-b border-white/5 px-5 py-4">
          <FileText size={14} className="text-slate-400" />
          <p className="text-sm font-semibold text-white">Session report</p>
          <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
            {report.length}
          </span>
        </div>
        <div className="chat-scroll flex-1 space-y-2 overflow-y-auto px-4 py-4">
          {report.length === 0 ? (
            <p className="px-1 text-xs text-slate-500">
              Each PPT step and Q&A will appear here, in real time.
            </p>
          ) : (
            report.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 backdrop-blur"
              >
                <div className="mb-1 flex items-center gap-1.5">
                  {r.kind === "ppt" ? (
                    <FileText size={11} className="text-brand-300" />
                  ) : (
                    <HelpCircle size={11} className="text-fuchsia-300" />
                  )}
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    {r.kind === "ppt" ? "PPT" : "Question"}
                  </span>
                </div>
                <p className="text-xs leading-snug text-slate-200">{r.summary}</p>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

function WelcomeScreen({
  lessonTitle,
  onPick,
}: {
  lessonTitle: string;
  onPick: (s: string) => void;
}) {
  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand via-fuchsia-500 to-sky-500 shadow-xl shadow-brand/40">
        <Sparkles size={28} className="text-white" />
      </div>
      <h1 className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-3xl font-semibold text-transparent sm:text-4xl">
        How can I help you teach today?
      </h1>
      <p className="mt-3 text-sm text-slate-400">
        You're currently on{" "}
        <span className="text-slate-200">{lessonTitle}</span>. Ask a question, or
        say "next slide" to continue your PPT.
      </p>
      <div className="mt-8 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={() => onPick(s.label)}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-brand/40 hover:bg-white/10"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-brand-300 group-hover:bg-brand/20">
                <Icon size={14} />
              </span>
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: AIMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("msg-in flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-white/10 text-slate-300"
            : "bg-gradient-to-br from-brand to-fuchsia-500 text-white shadow-lg shadow-brand/30"
        )}
      >
        {isUser ? <UserIcon size={14} /> : <Bot size={14} />}
      </div>
      <div className={cn("flex max-w-[80%] flex-col gap-1.5", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-gradient-to-br from-brand to-fuchsia-500 text-white shadow-lg shadow-brand/20"
              : "border border-white/10 bg-white/5 text-slate-100 backdrop-blur"
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {(message.sourceRef || message.cached) && (
          <div className="flex flex-wrap items-center gap-1.5 px-1">
            {message.sourceRef && (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                {message.sourceRef}
              </span>
            )}
            {message.cached && (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">
                Fast response
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function UserMenu({ session }: { session: Session | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!session) {
    return (
      <button
        onClick={() => router.push("/")}
        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-white/10"
      >
        Sign in
      </button>
    );
  }

  function handleSignOut() {
    signOut();
    router.push("/");
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-2.5 text-left transition hover:bg-white/10"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand to-fuchsia-500 text-[11px] font-semibold text-white shadow-lg shadow-brand/30">
          {initials(session.name)}
        </span>
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="text-[12px] font-medium text-white">
            {session.name}
          </span>
          <span className="text-[10px] capitalize text-slate-400">
            {session.role.replace("-", " ")}
          </span>
        </span>
        <ChevronDown
          size={12}
          className={cn(
            "text-slate-400 transition",
            open && "rotate-180 text-white"
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-fuchsia-500 text-sm font-semibold text-white shadow-lg shadow-brand/30">
              {initials(session.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {session.name}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {session.email}
              </p>
            </div>
          </div>
          <div className="p-1.5">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut size={14} className="text-slate-400" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="msg-in flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-fuchsia-500 text-white shadow-lg shadow-brand/30">
        <Bot size={14} />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400" />
      </div>
    </div>
  );
}

function PPTXPane({
  lesson,
  current,
  onPrev,
  onNext,
  onClose,
}: {
  lesson: Lesson;
  current: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const slide = lesson.slides[current - 1];
  const total = lesson.slides.length;

  return (
    <div className="relative z-10 hidden h-full w-3/4 shrink-0 flex-col border-r border-white/5 bg-slate-950/40 backdrop-blur-xl md:flex">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-brand shadow-lg shadow-sky-500/20">
          <Presentation size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {lesson.title}
          </p>
          <p className="text-[11px] text-slate-400">
            Grade {lesson.grade} · {lesson.subject} · {total} slides
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-300">
          {current} / {total}
        </span>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
          aria-label="Close presentation"
        >
          <X size={16} />
        </button>
      </div>

      {/* Slide canvas */}
      <div className="flex flex-1 flex-col gap-4 px-8 py-6 min-h-0">
        <div className="flex flex-1 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900 shadow-2xl min-h-0">
          {slide.imageUrl ? (
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full flex-col p-10">
              <p className="text-xs font-medium uppercase tracking-widest text-brand-600">
                Slide {slide.index} of {total}
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-slate-900 lg:text-4xl xl:text-5xl">
                {slide.title}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-slate-600 lg:text-lg">
                {slide.body}
              </p>
              <div className="mt-auto flex min-h-[40%] flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-gradient-to-br from-brand-50 to-slate-100 text-sm text-slate-400">
                Slide visual (rendered from .pptx)
              </div>
            </div>
          )}
        </div>

        {/* Slide rail */}
        <div className="flex flex-wrap gap-1.5">
          {lesson.slides.map((s) => (
            <span
              key={s.id}
              className={cn(
                "h-1.5 flex-1 rounded-full transition",
                s.index === current
                  ? "bg-gradient-to-r from-brand to-fuchsia-500"
                  : s.index < current
                  ? "bg-white/30"
                  : "bg-white/10"
              )}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
        <button
          onClick={onPrev}
          disabled={current === 1}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs transition",
            current === 1
              ? "cursor-not-allowed text-slate-600"
              : "text-slate-200 hover:bg-white/5"
          )}
        >
          <ChevronLeft size={14} />
          Previous
        </button>
        <p className="text-[11px] text-slate-500">
          Ask the AI on the right to explain any slide
        </p>
        <button
          onClick={onNext}
          disabled={current === total}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition",
            current === total
              ? "cursor-not-allowed border border-white/10 text-slate-600"
              : "bg-gradient-to-br from-brand to-fuchsia-500 text-white shadow-lg shadow-brand/30 hover:brightness-110"
          )}
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
