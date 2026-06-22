"use client";

import { useState } from "react";
import { Download, Eye, FileBarChart2, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TR, TH, TD } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import type { Report, ReportStatus } from "@/types";
import { mockReports } from "@/data/mockReports";

const statusTone: Record<ReportStatus, { tone: Parameters<typeof Badge>[0]["tone"]; label: string }> = {
  pending: { tone: "neutral", label: "Pending" },
  processing: { tone: "info", label: "Processing" },
  ready: { tone: "success", label: "Ready" },
  failed: { tone: "danger", label: "Failed" },
};

export function ReportSection({
  scope,
  schoolId,
  requestedBy,
}: {
  scope: "global" | "school";
  schoolId?: string;
  requestedBy: string;
}) {
  const initial = mockReports.filter((r) =>
    scope === "global" ? true : r.schoolId === schoolId
  );
  const [reports, setReports] = useState<Report[]>(initial);
  const [viewing, setViewing] = useState<Report | null>(null);

  function downloadFile(name: string, contents: string, type = "text/csv") {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function exportAll() {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = reports.map((report) =>
      [report.title, report.scope, report.status, report.requestedAt, report.readyAt ?? ""]
        .map(escape)
        .join(",")
    );
    downloadFile(
      `im-telligence-reports-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Title,Scope,Status,Requested,Ready", ...rows].join("\n")
    );
  }

  function downloadReport(report: Report) {
    downloadFile(
      `${report.id}.txt`,
      [
        report.title,
        `Scope: ${report.scope}`,
        `Status: ${report.status}`,
        `Requested: ${formatDate(report.requestedAt)}`,
        report.readyAt ? `Ready: ${formatDate(report.readyAt)}` : "",
      ].filter(Boolean).join("\n"),
      "text/plain"
    );
  }

  function generate() {
    // TODO: POST to backend to enqueue a report job.
    const newReport: Report = {
      id: `rep_${Date.now()}`,
      title: `Custom Report — ${new Date().toLocaleDateString()}`,
      scope,
      schoolId,
      requestedBy,
      requestedAt: new Date().toISOString(),
      status: "processing",
    };
    setReports((prev) => [newReport, ...prev]);

    // Simulate processing -> ready after 3s.
    setTimeout(() => {
      setReports((prev) =>
        prev.map((r) =>
          r.id === newReport.id
            ? { ...r, status: "ready", readyAt: new Date().toISOString() }
            : r
        )
      );
    }, 3000);
  }

  function markReady(id: string) {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "ready", readyAt: new Date().toISOString() } : r
      )
    );
  }

  function retry(id: string) {
    setReports((prev) =>
      prev.map((report) =>
        report.id === id ? { ...report, status: "processing" } : report
      )
    );
    setTimeout(() => markReady(id), 1200);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {reports.length} report{reports.length === 1 ? "" : "s"} on file
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportAll} disabled={reports.length === 0}>
            <Download size={14} /> Export all
          </Button>
          <Button onClick={generate}>
            <FileBarChart2 size={14} />
            Generate report
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>Report</TH>
              <TH>Requested</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <tbody>
            {reports.map((r) => {
              const s = statusTone[r.status];
              return (
                <TR key={r.id}>
                  <TD>
                    <div className="font-medium text-slate-900">{r.title}</div>
                    <div className="text-xs text-slate-500">
                      Scope: {r.scope}
                    </div>
                  </TD>
                  <TD>{formatDate(r.requestedAt)}</TD>
                  <TD>
                    <Badge tone={s.tone}>
                      {r.status === "processing" && (
                        <Loader2 size={10} className="animate-spin" />
                      )}
                      {s.label}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    {r.status === "ready" && (
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setViewing(r)}>
                          <Eye size={12} /> View
                        </Button>
                        <Button size="sm" onClick={() => downloadReport(r)}>
                          <Download size={12} /> Download
                        </Button>
                      </div>
                    )}
                    {r.status === "processing" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markReady(r.id)}
                        title="Simulate completion"
                      >
                        <RefreshCcw size={12} />
                        Mark ready
                      </Button>
                    )}
                    {r.status === "failed" && (
                      <Button size="sm" variant="secondary" onClick={() => retry(r.id)}>
                        <RefreshCcw size={12} /> Retry
                      </Button>
                    )}
                  </TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      </div>

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing?.title ?? "Report"}
        footer={
          viewing ? (
            <Button onClick={() => downloadReport(viewing)}>
              <Download size={14} /> Download
            </Button>
          ) : undefined
        }
      >
        {viewing && (
          <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-slate-500">Scope</dt>
            <dd className="capitalize text-slate-900">{viewing.scope}</dd>
            <dt className="text-slate-500">Requested</dt>
            <dd className="text-slate-900">{formatDate(viewing.requestedAt)}</dd>
            <dt className="text-slate-500">Ready</dt>
            <dd className="text-slate-900">
              {viewing.readyAt ? formatDate(viewing.readyAt) : "Not ready"}
            </dd>
          </dl>
        )}
      </Modal>
    </div>
  );
}
