"use client";

import { PageHeader } from "@/components/layout/DashboardShell";
import { AdminChatbot } from "@/components/ai/AdminChatbot";

export default function SchoolAdminAIPage() {
  return (
    <>
      <PageHeader
        title="AI Assistant"
        subtitle="Ask about your teachers, progress, late lessons, or security alerts."
      />
      <div className="h-[calc(100vh-220px)] min-h-[520px] max-w-3xl">
        <AdminChatbot scope="school-admin" />
      </div>
    </>
  );
}
