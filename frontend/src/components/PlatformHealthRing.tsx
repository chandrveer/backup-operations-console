import clsx from "clsx";

interface Props {
  label: string;
  vendorKey: string;
  successRate: number; // 0-100
  connectionStatus: string;
  assets: number;
  failedJobs: number;
  slaBreaches: number;
  latencyMs: number;
  onClick?: () => void;
}

const VENDOR_LABEL: Record<string, string> = {
  rubrik: "RBK",
  veeam: "VEE",
  commvault: "CVT",
  azure_backup: "AZR",
};

function ringColor(rate: number, connStatus: string) {
  if (connStatus === "Down") return "#FF5470";
  if (connStatus === "Degraded") return "#F5A623";
  if (rate >= 95) return "#3DDC84";
  if (rate >= 85) return "#F5A623";
  return "#FF5470";
}

export function PlatformHealthRing({ label, vendorKey, successRate, connectionStatus, assets, failedJobs, slaBreaches, latencyMs, onClick }: Props) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, successRate));
  const dash = (pct / 100) * circ;
  const color = ringColor(pct, connectionStatus);
  const isProblem = connectionStatus === "Degraded" || connectionStatus === "Down";

  return (
    <button
      onClick={onClick}
      className="panel p-5 flex flex-col items-center gap-3 relative overflow-hidden transition-all duration-200 hover:border-brand/40 hover:shadow-glow focus-ring animate-fade-up w-full"
    >
      {isProblem && (
        <span className="absolute top-3 right-3 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
        </span>
      )}
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-borderc" />
          <circle
            cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[10px] text-signal-idle tracking-widest">{VENDOR_LABEL[vendorKey] || "PLT"}</span>
          <span className="font-display text-xl font-semibold" style={{ color }}>{pct.toFixed(1)}%</span>
        </div>
      </div>
      <div className="text-center">
        <div className="font-medium text-sm">{label}</div>
        <div className={clsx("text-[11px] font-mono mt-0.5", isProblem ? "font-semibold" : "text-signal-idle")} style={isProblem ? { color } : {}}>
          {connectionStatus} · {latencyMs}ms
        </div>
      </div>
      <div className="flex items-center gap-3 text-[11px] font-mono text-signal-idle border-t border-borderc pt-2.5 w-full justify-center">
        <span>{assets} assets</span>
        <span className="w-1 h-1 rounded-full bg-borderc" />
        <span className={failedJobs > 0 ? "text-signal-critical" : ""}>{failedJobs} failed</span>
        <span className="w-1 h-1 rounded-full bg-borderc" />
        <span className={slaBreaches > 0 ? "text-signal-warning" : ""}>{slaBreaches} SLA</span>
      </div>
    </button>
  );
}
