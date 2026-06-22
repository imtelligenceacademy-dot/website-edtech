"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Table, THead, TR, TH, TD } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { mockSchools } from "@/data/mockSchools";
import { formatDateOnly } from "@/lib/utils";
import type { School } from "@/types";

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>(mockSchools);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", city: "", country: "Lebanon" });

  function createSchool(e: React.FormEvent) {
    e.preventDefault();
    setSchools((current) => [
      {
        id: `sch_${Date.now()}`,
        name: draft.name.trim(),
        city: draft.city.trim(),
        country: draft.country.trim(),
        teacherCount: 0,
        adminCount: 0,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setDraft({ name: "", city: "", country: "Lebanon" });
    setCreating(false);
  }

  // TODO: wire to backend; allow create/edit/suspend.
  return (
    <>
      <PageHeader
        title="Schools"
        subtitle="All schools using IM-Telligence."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={14} /> New school
          </Button>
        }
      />
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>School</TH>
              <TH>Location</TH>
              <TH>Teachers</TH>
              <TH>Admins</TH>
              <TH>Created</TH>
            </TR>
          </THead>
          <tbody>
            {schools.map((s) => (
              <TR key={s.id}>
                <TD className="font-medium text-slate-900">{s.name}</TD>
                <TD>
                  {s.city}, {s.country}
                </TD>
                <TD>{s.teacherCount}</TD>
                <TD>{s.adminCount}</TD>
                <TD>{formatDateOnly(s.createdAt)}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Create school"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit" form="create-school-form">Create school</Button>
          </>
        }
      >
        <form id="create-school-form" onSubmit={createSchool} className="space-y-3">
          <label className="block text-xs font-medium text-slate-700">
            School name
            <input
              required
              value={draft.name}
              onChange={(e) => setDraft((value) => ({ ...value, name: e.target.value }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-700">
              City
              <input
                required
                value={draft.city}
                onChange={(e) => setDraft((value) => ({ ...value, city: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Country
              <input
                required
                value={draft.country}
                onChange={(e) => setDraft((value) => ({ ...value, country: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </label>
          </div>
        </form>
      </Modal>
    </>
  );
}
