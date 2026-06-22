"use client";

import { School, Users, BookOpen, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Table, THead, TR, TH, TD } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { mockSchools } from "@/data/mockSchools";
import { mockUsers } from "@/data/mockUsers";
import { mockSecurityLogs } from "@/data/mockSecurityLogs";
import { mockLessons } from "@/data/mockLessons";
import { formatDate } from "@/lib/utils";

export default function SuperAdminDashboard() {
  const pending = mockUsers.filter((u) => u.status === "pending");
  const teachers = mockUsers.filter((u) => u.role === "teacher");
  const recentSecurity = mockSecurityLogs
    .filter((l) => l.status !== "ok")
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Platform-wide health, accounts, and activity."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Schools" value={mockSchools.length} icon={<School size={18} />} />
        <StatCard label="Teachers" value={teachers.length} icon={<Users size={18} />} />
        <StatCard label="Lessons" value={mockLessons.length} icon={<BookOpen size={18} />} />
        <StatCard
          label="Pending approvals"
          value={pending.length}
          icon={<ShieldAlert size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Pending signup approvals" subtitle="Review and decide." />
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Role</TH>
                <TH>Requested</TH>
              </TR>
            </THead>
            <tbody>
              {pending.map((u) => (
                <TR key={u.id}>
                  <TD>
                    <div className="font-medium text-slate-900">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </TD>
                  <TD className="capitalize">{u.role.replace("-", " ")}</TD>
                  <TD className="text-xs">{formatDate(u.createdAt)}</TD>
                </TR>
              ))}
              {pending.length === 0 && (
                <TR>
                  <TD className="text-center text-slate-500" >No pending approvals.</TD>
                </TR>
              )}
            </tbody>
          </Table>
        </Card>

        <Card>
          <CardHeader
            title="Security alerts"
            subtitle="Warnings and blocked events across all schools."
          />
          <CardBody className="!p-0">
            <Table>
              <THead>
                <TR>
                  <TH>User</TH>
                  <TH>Event</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <tbody>
                {recentSecurity.map((l) => (
                  <TR key={l.id}>
                    <TD className="font-medium text-slate-900">{l.userName}</TD>
                    <TD className="text-xs">{l.event.replace(/-/g, " ")}</TD>
                    <TD>
                      <Badge tone={l.status === "blocked" ? "danger" : "warning"}>
                        {l.status}
                      </Badge>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
