"use client";

import { PageHeader } from "@/components/layout/DashboardShell";
import { Chatbot } from "@/components/ai/Chatbot";

export default function TeacherAIPage() {
  return (
    <>
      <PageHeader
        title="AI Assistant"
        subtitle="Ask about a lesson, a concept, or get classroom activity ideas."
      />
      <div className="h-[calc(100vh-220px)] min-h-[520px] max-w-3xl">
        <Chatbot />
      </div>
    </>
  );
}
