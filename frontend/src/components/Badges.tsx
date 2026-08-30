import clsx from "clsx";

const STATUS_COLORS: Record<string, string> = {
  Success: "text-signal-success bg-signal-success/10 border-signal-success/30",
  Completed: "text-signal-success bg-signal-success/10 border-signal-success/30",
  Failed: "text-signal-critical bg-signal-critical/10 border-signal-critical/30",
  Running: "text-signal-info bg-signal-info/10 border-signal-info/30 animate-pulse-soft",
  Skipped: "text-signal-idle bg-signal-idle/10 border-signal-idle/30",
  Warning: "text-signal-warning bg-signal-warning/10 border-signal-warning/30",
  Healthy: "text-signal-success bg-signal-success/10 border-signal-success/30",
  Degraded: "text-signal-warning bg-signal-warning/10 border-signal-warning/30",
  Down: "text-signal-critical bg-signal-critical/10 border-signal-critical/30",
  "Not Configured": "text-signal-idle bg-signal-idle/10 border-signal-idle/30",
  Open: "text-signal-critical bg-signal-critical/10 border-signal-critical/30",
  Acknowledged: "text-signal-warning bg-signal-warning/10 border-signal-warning/30",
  Resolved: "text-signal-success bg-signal-success/10 border-signal-success/30",
};

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "text-signal-critical bg-signal-critical/10 border-signal-critical/30",
  High: "text-signal-warning bg-signal-warning/10 border-signal-warning/30",
  Medium: "text-signal-info bg-signal-info/10 border-signal-info/30",
  Low: "text-signal-idle bg-signal-idle/10 border-signal-idle/30",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const cls = STATUS_COLORS[status] || "text-signal-idle bg-signal-idle/10 border-signal-idle/30";
  return (
    <span className={clsx("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-mono font-medium", cls, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function SeverityBadge({ severity, className }: { severity: string; className?: string }) {
  const cls = SEVERITY_COLORS[severity] || "text-signal-idle bg-signal-idle/10 border-signal-idle/30";
  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-mono uppercase tracking-wide font-semibold", cls, className)}>
      {severity}
    </span>
  );
}
