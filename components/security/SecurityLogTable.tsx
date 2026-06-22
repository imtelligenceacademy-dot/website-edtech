import { Badge } from "@/components/ui/Badge";
import { Table, THead, TR, TH, TD } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";
import type { SecurityEventType, SecurityLog } from "@/types";

const eventLabel: Record<SecurityEventType, string> = {
  "normal-login": "Normal login",
  "foreign-device": "Foreign device",
  "new-ip": "New IP detected",
  "suspicious-location": "Suspicious location",
  "blocked-second-device": "Blocked second device",
};

const statusTone: Record<
  SecurityLog["status"],
  { tone: Parameters<typeof Badge>[0]["tone"]; label: string }
> = {
  ok: { tone: "success", label: "OK" },
  warning: { tone: "warning", label: "Warning" },
  blocked: { tone: "danger", label: "Blocked" },
};

export function SecurityLogTable({ logs }: { logs: SecurityLog[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <Table>
        <THead>
          <TR>
            <TH>User</TH>
            <TH>Role</TH>
            <TH>Event</TH>
            <TH>IP / Location</TH>
            <TH>Device</TH>
            <TH>Status</TH>
            <TH>Time</TH>
          </TR>
        </THead>
        <tbody>
          {logs.map((l) => {
            const s = statusTone[l.status];
            return (
              <TR key={l.id}>
                <TD>
                  <div className="font-medium text-slate-900">{l.userName}</div>
                  <div className="text-xs text-slate-500">{l.userId}</div>
                </TD>
                <TD className="capitalize">{l.role.replace("-", " ")}</TD>
                <TD>{eventLabel[l.event]}</TD>
                <TD>
                  <div className="font-mono text-xs">{l.ip}</div>
                  <div className="text-xs text-slate-500">
                    {l.location.label} ({l.location.lat.toFixed(2)},{" "}
                    {l.location.lng.toFixed(2)})
                  </div>
                </TD>
                <TD className="text-xs">{l.device}</TD>
                <TD>
                  <Badge tone={s.tone}>{s.label}</Badge>
                </TD>
                <TD className="text-xs">{formatDate(l.timestamp)}</TD>
              </TR>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
