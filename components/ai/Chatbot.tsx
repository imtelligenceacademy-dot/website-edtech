"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Zap, FileText, CheckCircle2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { AIMessage } from "@/types";
import {
  mockAIThread,
  mockAIResponses,
  fallbackAIReply,
} from "@/data/mockAIMessages";
import { mockLessons } from "@/data/mockLessons";

// --- Workflow state (per Image 2) -------------------------------------------
// The teacher's "current PPT" is the first lesson assigned to them. We track
// which slide they're on and whether that slide has been marked accomplished.
const currentLesson = mockLessons[0];

type ReportEntry = {
  id: string;
  kind: "ppt" | "question";
  summary: string;
  at: string;
};

// Intent classifier — "Request to check if Question or ppt request" node.
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
  return /\b(yes|yep|done|finished|complete|accomplished|mark it|i did)\b/.test(lower);
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

export function Chatbot() {
  const [messages, setMessages] = useState<AIMessage[]>(mockAIThread);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0); // 0-based pointer into currentLesson.slides
  const [currentSlideDone, setCurrentSlideDone] = useState(false);
  const [awaitingCompletion, setAwaitingCompletion] = useState(false);
  const [report, setReport] = useState<ReportEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

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

    // If we previously asked "is the current ppt done?" — interpret this reply.
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

    // Fresh PPT request — check if current slide is marked done.
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

  function send() {
    const text = input.trim();
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
      // Route: PPT request branch vs Question branch.
      if (awaitingCompletion || isPPTRequest(text)) {
        handlePPTBranch(text);
      } else {
        handleQuestionBranch(text);
      }
      setThinking(false);
    }, 600);
  }

  const slide = currentLesson.slides[slideIndex];

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
      {/* Chat panel */}
      <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <Sparkles size={16} className="text-brand-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">AI Assistant</p>
            <p className="text-[11px] text-slate-500">
              Routes PPT requests and questions — logs each interaction to your report
            </p>
          </div>
          <Badge tone={currentSlideDone ? "success" : "info"}>
            {currentSlideDone ? (
              <>
                <CheckCircle2 size={10} /> Slide {slide.index} done
              </>
            ) : (
              <>
                <FileText size={10} /> On slide {slide.index}/{currentLesson.slides.length}
              </>
            )}
          </Badge>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        >
          {messages.map((m) => (
            <Message key={m.id} message={m} />
          ))}
          {thinking && (
            <div className="text-xs text-slate-400 px-3">Thinking…</div>
          )}
        </div>

        <div className="border-t border-slate-100 p-3 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={
              awaitingCompletion
                ? `Did you finish "${slide.title}"? yes / no`
                : "Ask a question, or say 'next slide' to advance the PPT…"
            }
            className="flex-1 h-10 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <Button size="md" onClick={send} disabled={!input.trim()}>
            <Send size={14} />
            Send
          </Button>
        </div>
      </div>

      {/* Report panel */}
      <aside className="hidden lg:flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <FileText size={14} className="text-slate-500" />
          <p className="text-sm font-semibold text-slate-900">Session report</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {report.length === 0 ? (
            <p className="text-xs text-slate-400 px-1">
              Each PPT step and Q&A will appear here.
            </p>
          ) : (
            report.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {r.kind === "ppt" ? (
                    <FileText size={11} className="text-brand-600" />
                  ) : (
                    <HelpCircle size={11} className="text-slate-500" />
                  )}
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                    {r.kind === "ppt" ? "PPT" : "Question"}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-snug">
                  {r.summary}
                </p>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

function Message({ message }: { message: AIMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-brand text-white rounded-br-md"
            : "bg-slate-100 text-slate-800 rounded-bl-md"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {(message.sourceRef || message.cached) && (
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {message.sourceRef && (
              <Badge tone="info">Based on {message.sourceRef}</Badge>
            )}
            {message.cached && (
              <Badge tone="muted">
                <Zap size={10} /> Fast response
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
