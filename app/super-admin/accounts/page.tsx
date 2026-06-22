"use client";

import { useState } from "react";
import { Check, Plus, X, Ban } from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TR, TH, TD } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { mockUsers } from "@/data/mockUsers";
import { mockSchools } from "@/data/mockSchools";
import type { User, UserStatus } from "@/types";
import { cn, formatDateOnly } from "@/lib/utils";

const statusTone: Record<UserStatus, Parameters<typeof Badge>[0]["tone"]> = {
  active: "success",
  pending: "warning",
  suspended: "danger",
  rejected: "muted",
};

export default function AccountsPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "suspended">("all");
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "teacher" as User["role"],
    schoolId: mockSchools[0].id,
  });

  function update(id: string, status: UserStatus) {
    // TODO: PATCH /api/users/:id
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
  }

  function createUser(e: React.FormEvent) {
    e.preventDefault();
    const user: User = {
      id: `u_${Date.now()}`,
      name: newUser.name.trim(),
      email: newUser.email.trim().toLowerCase(),
      role: newUser.role,
      schoolId: newUser.role === "super-admin" ? undefined : newUser.schoolId,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [user, ...prev]);
    setCreating(false);
    setFilter("all");
    setNewUser({ name: "", email: "", role: "teacher", schoolId: mockSchools[0].id });
  }

  const filtered = users.filter((u) =>
    filter === "all" ? true : u.status === filter
  );

  const tabs: { key: typeof filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: users.length },
    { key: "pending", label: "Pending", count: users.filter((u) => u.status === "pending").length },
    { key: "active", label: "Active", count: users.filter((u) => u.status === "active").length },
    { key: "suspended", label: "Suspended", count: users.filter((u) => u.status === "suspended").length },
  ];

  return (
    <>
      <PageHeader
        title="Accounts"
        subtitle="Approve signups, manage admins and teachers."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={14} /> New user
          </Button>
        }
      />

      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 mb-4 text-xs">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={cn(
              "px-3 py-1.5 rounded-md font-medium",
              filter === t.key
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            {t.label} <span className="opacity-60">· {t.count}</span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader title="Users" subtitle={`${filtered.length} shown`} />
        <Table>
          <THead>
            <TR>
              <TH>User</TH>
              <TH>Role</TH>
              <TH>School</TH>
              <TH>Status</TH>
              <TH>Created</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <tbody>
            {filtered.map((u) => {
              const school = mockSchools.find((s) => s.id === u.schoolId);
              return (
                <TR key={u.id}>
                  <TD>
                    <div className="font-medium text-slate-900">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </TD>
                  <TD className="capitalize">{u.role.replace("-", " ")}</TD>
                  <TD>{school?.name ?? "—"}</TD>
                  <TD>
                    <Badge tone={statusTone[u.status]} className="capitalize">
                      {u.status}
                    </Badge>
                  </TD>
                  <TD>{formatDateOnly(u.createdAt)}</TD>
                  <TD className="text-right">
                    <div className="inline-flex gap-1">
                      {u.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => update(u.id, "active")}>
                            <Check size={12} /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => update(u.id, "rejected")}
                          >
                            <X size={12} /> Reject
                          </Button>
                        </>
                      )}
                      {u.status === "active" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => update(u.id, "suspended")}
                        >
                          <Ban size={12} /> Suspend
                        </Button>
                      )}
                      {u.status === "suspended" && (
                        <Button size="sm" onClick={() => update(u.id, "active")}>
                          <Check size={12} /> Reinstate
                        </Button>
                      )}
                    </div>
                  </TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      </Card>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Create user"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit" form="create-user-form">Create user</Button>
          </>
        }
      >
        <form id="create-user-form" onSubmit={createUser} className="space-y-3">
          <label className="block text-xs font-medium text-slate-700">
            Full name
            <input
              required
              value={newUser.name}
              onChange={(e) => setNewUser((value) => ({ ...value, name: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Email
            <input
              required
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser((value) => ({ ...value, email: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-700">
              Role
              <select
                value={newUser.role}
                onChange={(e) => setNewUser((value) => ({ ...value, role: e.target.value as User["role"] }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2 text-sm"
              >
                <option value="teacher">Teacher</option>
                <option value="school-admin">School Admin</option>
                <option value="super-admin">Super Admin</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-slate-700">
              School
              <select
                value={newUser.schoolId}
                disabled={newUser.role === "super-admin"}
                onChange={(e) => setNewUser((value) => ({ ...value, schoolId: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2 text-sm disabled:bg-slate-100"
              >
                {mockSchools.map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </label>
          </div>
        </form>
      </Modal>
    </>
  );
}
