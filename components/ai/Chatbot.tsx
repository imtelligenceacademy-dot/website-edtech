"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { AIMessage } from "@/types";
import {
  mockAIThread,
  mockAIResponses,
  fallbackAIReply,
} from "@/data/mockAIMessages";

function pickReply(input: string): AIMessage {
  const lower = input.toLowerCase();
  const hit = mockAIResponses.find((r) => lower.includes(r.match));
  // Clone so timestamp is fresh.
  if (hit) return { ...hit.reply, id: `${hit.reply.id}_${Date.now()}`, timestamp: new Date().toISOString() };
  return { ...fallbackAIReply, id: `r_fallback_${Date.now()}`, timestamp: new Date().toISOString() };
}

export function Chatbot() {
  const [messages, setMessages] = useState<AIMessage[]>(mockAIThread);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
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
    // TODO: replace with real LLM call (e.g. /api/ai/chat).
    setTimeout(() => {
      setMessages((prev) => [...prev, pickReply(text)]);
      setThinking(false);
    }, 700);
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <Sparkles size={16} className="text-brand-600" />
        <div>
          <p className="text-sm font-semibold text-slate-900">AI Assistant</p>
          <p className="text-[11px] text-slate-500">Grounded in your assigned lessons</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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
          placeholder="Ask about a slide, a concept, or an activity…"
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
