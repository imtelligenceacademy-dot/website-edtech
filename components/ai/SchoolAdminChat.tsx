"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Bot,
  User as UserIcon,
  Users,
  AlertTriangle,
  TrendingUp,
  FileBarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSession, streamAdminAI } from "@/lib/api";
import { useSchoolAdminTheme } from "@/lib/schoolAdminTheme";
import type { AIMessage, Session } from "@/types";

const SUGGESTIONS = [
  { label: "How many teachers do I have and what grades?", icon: Users },
  { label: "Which teachers are behind or have late lessons?", icon: AlertTriangle },
  { label: "What's the overall completion rate?", icon: TrendingUp },
  { label: "Any security alerts I should know about?", icon: FileBarChart2 },
];

// Rendered inside the school-admin DashboardShell (sidebar + topbar stay).
// Fills the content area; theme follows the shell's toggle.
export function SchoolAdminChat() {
  const { theme } = useSchoolAdminTheme();
  const light = theme === "light";

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getSession().then(setSession).catch(() => setSession(null));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 180) + "px";
    }
  }, [input]);

  async function answer(text: string) {
    const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
    const id = `a_${Date.now()}`;
    let started = false;
    try {
      await streamAdminAI(
        { message: text, history },
        {
          onDelta: (delta) => {
            if (!started) {
              started = true;
              setThinking(false);
              setMessages((prev) => [
                ...prev,
                { id, role: "assistant", content: delta, timestamp: new Date().toISOString() },
              ]);
            } else {
              setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, content: m.content + delta } : m))
              );
            }
          },
        }
      );
      if (!started) {
        setMessages((prev) => [
          ...prev,
          { id, role: "assistant", content: "I didn't get a response. Please try again.", timestamp: new Date().toISOString() },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id, role: "assistant", content: "I couldn't reach the assistant just now. Please try again in a moment.", timestamp: new Date().toISOString() },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function send(override?: string) {
    const text = (override ?? input).trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, role: "user", content: text, timestamp: new Date().toISOString() },
    ]);
    setInput("");
    setThinking(true);
    void answer(text);
  }

  const isEmpty = messages.length === 0;

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border backdrop-blur-xl",
        light ? "border-slate-200 bg-white/70" : "border-white/10 bg-white/[0.03]"
      )}
    >
      {/* Slim context header (no duplicate controls — the topbar has those) */}
      <div className={cn("flex items-center gap-3 border-b px-5 py-3", light ? "border-slate-200/60" : "border-white/5")}>
        <div className="relative">
          <img
            src="/logo.png"
            alt="IM-Telligence"
            className="h-8 w-8 rounded-full bg-white object-contain p-0.5 shadow-lg shadow-brand/30"
          />
          <div className={cn("absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 bg-emerald-400", light ? "border-white" : "border-slate-900")} />
        </div>
        <div className="min-w-0">
          <p className={cn("text-sm font-semibold", light ? "text-slate-900" : "text-white")}>IM-Telligence AI</p>
          <p className={cn("truncate text-[11px]", light ? "text-slate-500" : "text-slate-400")}>
            School operations assistant · grounded in your school&apos;s live data
          </p>
        </div>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        {isEmpty ? (
          <Welcome session={session} onPick={(s) => send(s)} light={light} />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {messages.map((m) => (
              <Bubble key={m.id} message={m} light={light} />
            ))}
            {thinking && <Typing light={light} />}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className={cn("border-t px-4 py-4 sm:px-8", light ? "border-slate-200/60" : "border-white/5")}>
        <div className="mx-auto max-w-3xl">
          <div className={cn("group relative flex items-end gap-2 rounded-2xl border p-2 shadow-lg transition focus-within:border-brand/60", light ? "border-slate-200 bg-white shadow-slate-900/5" : "border-white/10 bg-white/5 shadow-black/30")}>
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
              placeholder="Ask about your teachers, progress, late lessons or alerts…"
              className={cn("max-h-[180px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm focus:outline-none", light ? "text-slate-900 placeholder:text-slate-400" : "text-white placeholder:text-slate-500")}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim()}
              className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition", input.trim() ? "bg-gradient-to-br from-brand to-brand-700 text-white shadow-lg shadow-brand/40 hover:brightness-110" : light ? "bg-slate-100 text-slate-400" : "bg-white/5 text-slate-500")}
              aria-label="Send"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Welcome({
  session,
  onPick,
  light,
}: {
  session: Session | null;
  onPick: (s: string) => void;
  light: boolean;
}) {
  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
      <img
        src="/logo.png"
        alt="IM-Telligence"
        className="mb-6 h-16 w-16 rounded-2xl bg-white object-contain p-1.5 shadow-xl shadow-brand/40"
      />
      <h1 className={cn("bg-clip-text text-3xl font-semibold text-transparent sm:text-4xl", light ? "bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500" : "bg-gradient-to-r from-white via-slate-200 to-slate-400")}>
        {session ? `Hi ${session.name.split(" ")[0]}, how's your school doing?` : "How's your school doing?"}
      </h1>
      <p className={cn("mt-3 text-sm", light ? "text-slate-600" : "text-slate-400")}>
        Ask about your teachers, their progress, late lessons, or security alerts.
      </p>
      <div className="mt-8 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={() => onPick(s.label)}
              className={cn("group flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition hover:border-brand/40", light ? "border-slate-200 bg-white/70 text-slate-700 hover:bg-white" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")}
            >
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg group-hover:bg-brand/20", light ? "bg-slate-100 text-brand-600" : "bg-white/5 text-brand-300")}>
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

function Bubble({ message, light }: { message: AIMessage; light: boolean }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("msg-in flex gap-3", isUser && "flex-row-reverse")}>
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", isUser ? (light ? "bg-slate-200 text-slate-700" : "bg-white/10 text-slate-300") : "bg-gradient-to-br from-brand to-brand-700 text-white shadow-lg shadow-brand/30")}>
        {isUser ? <UserIcon size={14} /> : <Bot size={14} />}
      </div>
      <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed", isUser ? "bg-gradient-to-br from-brand to-brand-700 text-white shadow-lg shadow-brand/20" : light ? "border border-slate-200 bg-white text-slate-900" : "border border-white/10 bg-white/5 text-slate-100 backdrop-blur")}>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  );
}

function Typing({ light }: { light: boolean }) {
  return (
    <div className="msg-in flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-700 text-white shadow-lg shadow-brand/30">
        <Bot size={14} />
      </div>
      <div className={cn("flex items-center gap-1.5 rounded-2xl border px-4 py-3", light ? "border-slate-200 bg-white" : "border-white/10 bg-white/5 backdrop-blur")}>
        <span className={cn("typing-dot h-1.5 w-1.5 rounded-full", light ? "bg-slate-500" : "bg-slate-400")} />
        <span className={cn("typing-dot h-1.5 w-1.5 rounded-full", light ? "bg-slate-500" : "bg-slate-400")} />
        <span className={cn("typing-dot h-1.5 w-1.5 rounded-full", light ? "bg-slate-500" : "bg-slate-400")} />
      </div>
    </div>
  );
}
