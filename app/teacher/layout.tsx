import { DashboardShell } from "@/components/layout/DashboardShell";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="teacher">{children}</DashboardShell>;
}
