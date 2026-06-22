"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/DashboardShell";
import { SecurityLogTable } from "@/components/security/SecurityLogTable";
import { mockSecurityLogs } from "@/data/mockSecurityLogs";
import { getSession } from "@/lib/mockAuth";

export default function SchoolAdminSecurityPage() {
  const [schoolId, setSchoolId] = useState<string | undefined>();
  useEffect(() => setSchoolId(getSession()?.schoolId), []);
  if (!schoolId) return null;

  const logs = mockSecurityLogs.filter((l) => l.schoolId === schoolId);

  return (
    <>
      <PageHeader
        title="Security Alerts"
        subtitle="Sign-in events and warnings for your school only."
      />
      <SecurityLogTable logs={logs} />
    </>
  );
}
