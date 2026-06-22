"use client";

import { PageHeader } from "@/components/layout/DashboardShell";
import { SecurityLogTable } from "@/components/security/SecurityLogTable";
import { mockSecurityLogs } from "@/data/mockSecurityLogs";

export default function SuperAdminSecurityPage() {
  return (
    <>
      <PageHeader
        title="Security Logs"
        subtitle="All sign-in events across schools."
      />
      <SecurityLogTable logs={mockSecurityLogs} />
    </>
  );
}
