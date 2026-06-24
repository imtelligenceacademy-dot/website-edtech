"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { AIMessage } from "@/types";

type AdminScope = "super-admin" | "school-admin";

const seedThread: Record<AdminScope, AIMessage> = {
  "super-admin": {
    id: "sa_seed",
    role: "assistant",
    content:
      "Hi Super Admin — ask me about schools, teachers, lesson assignments, or anything in the platform. I can also draft reports or flag accounts that need attention.",
    timestamp: "2026-06-22T07:30:00Z",
  },
  "school-admin": {
    id: "ad_seed",
    role: "assistant",
    content:
      "Hi — I'm your school's AI assistant. Ask me about your teachers' progress, late lessons, or recent security alerts and I'll summarise what I see.",
    timestamp: "2026-06-22T07:30:00Z",
  },
};

const responsesByScope: Record<
  AdminScope,
  { match: string; reply: Omit<AIMessage, "id" | "timestamp"> }[]
> = {
  "super-admin": [
    {
      match: "school",
      reply: {
        role: "assistant",
        content:
          "There are 3 active schools across 2 countries. Lincoln Elementary has the highest lesson-completion rate this week; Riverside Middle has 2 overdue lessons that may need a nudge to the school admin.",
        sourceRef: "Schools DB · Connection DB",
      },
    },
    {
      match: "teacher",
      reply: {
        role: "assistant",
        content:
          "Across all schools you have 5 active teachers. 1 is late on an assigned PPT, 1 hasn't opened their lesson yet. Want me to draft a reminder for each?",
        sourceRef: "Connection DB · Progress",
      },
    },
    {
      match: "lesson",
      reply: {
        role: "assistant",
        content:
          "5 lessons are currently in the Lessons DB. The most assigned subject is STEAM (Grade 5–6). Upload a new PPT from the Files page and I'll assign it to teachers by school + grade.",
        sourceRef: "Lessons DB",
      },
    },
    {
      match: "report",
      reply: {
        role: "assistant",
        content:
          "I can prepare a global progress report covering all schools, or scope it to one school. Tell me the scope and I'll queue it on the Reports page.",
        cached: true,
      },
    },
  ],
  "school-admin": [
    {
      match: "teacher",
      reply: {
        role: "assistant",
        content:
          "Your school has 3 teachers. 1 is on-track, 1 is behind pace on Lesson 2, and 1 hasn't opened the AI lesson yet. Want details on a specific teacher?",
        sourceRef: "Teacher Progress",
      },
    },
    {
      match: "late",
      reply: {
        role: "assistant",
        content:
          "1 lesson is overdue at your school — Block-Based Coding Basics (Grade 4), assigned to 2 teachers. The watchdog flagged it 1 day ago.",
        sourceRef: "Watchdog",
      },
    },
    {
      match: "security",
      reply: {
        role: "assistant",
        content:
          "No critical alerts in the last 24 hours. 1 foreign-device login was flagged this week and resolved as expected (teacher travel).",
        sourceRef: "Security Logs",
        cached: true,
      },
    },
    {
      match: "report",
      reply: {
        role: "assistant",
        content:
          "I can prepare a school-scoped report on lesson progress, watchdog alerts, or teacher activity. Which would you like?",
      },
    },
  ],
};

const fallback: Omit<AIMessage, "id" | "timestamp"> = {
  role: "assistant",
  content:
    "I don't have a canned answer for that yet. Try asking about teachers, lessons, late progress, security, or reports.",
};

function pickReply(scope: AdminScope, input: string): AIMessage {
  const lower = input.toLowerCase();
  const hit = responsesByScope[scope].find((r) => lower.includes(r.match));
  const base = hit?.reply ?? fallback;
  return {
    ...base,
    id: `r_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
}

export function AdminChatbot({ scope }: { scope: AdminScope }) {
  const [messages, setMessages] = useState<AIMessage[]>([seedThread[scope]]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

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
      setMessages((prev) => [...prev, pickReply(scope, text)]);
      setThinking(false);
    }, 600);
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <Sparkles size={16} className="text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-900">AI Assistant</p>
          <p className="text-[11px] text-slate-500">
            {scope === "super-admin"
              ? "Platform-wide insights across schools, teachers and lessons"
              : "Grounded in your school's teachers, progress and alerts"}
          </p>
        </div>
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
            scope === "super-admin"
              ? "Ask about schools, teachers, lessons or reports…"
              : "Ask about your teachers, late lessons or alerts…"
          }
          className="flex-1 h-10 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <Button size="md" onClick={send} disabled={!input.trim()}>
          <Send size={14} />
          Send
        </Button>
      </div>
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
