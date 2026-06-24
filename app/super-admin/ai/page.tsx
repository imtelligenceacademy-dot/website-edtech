"use client";

import { PageHeader } from "@/components/layout/DashboardShell";
import { AdminChatbot } from "@/components/ai/AdminChatbot";

export default function SuperAdminAIPage() {
  return (
    <>
      <PageHeader
        title="AI Assistant"
        subtitle="Ask about schools, teachers, lessons, or queue a report."
      />
      <div className="h-[calc(100vh-220px)] min-h-[520px] max-w-3xl">
        <AdminChatbot scope="super-admin" />
      </div>
    </>
  );
}
