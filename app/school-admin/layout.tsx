"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { SchoolAdminThemeProvider } from "@/lib/schoolAdminTheme";

export default function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SchoolAdminThemeProvider>
      <DashboardShell role="school-admin">{children}</DashboardShell>
    </SchoolAdminThemeProvider>
  );
}
