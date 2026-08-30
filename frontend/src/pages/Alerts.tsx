import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Check, CheckCheck, AlertOctagon, Plug, HardDrive, ShieldAlert, Clock, XCircle } from "lucide-react";
import { api } from "../api/client";
import { Alert } from "../types";
import { SeverityBadge, StatusBadge } from "../components/Badges";
import { timeAgo } from "../lib/format";
import clsx from "clsx";

const TYPE_ICON: Record<string, any> = {
  "Backup Failure": XCircle,
  "SLA Violation": ShieldAlert,
  "RPO Violation": Clock,
  "Missing Backup": AlertOctagon,
  "Connector/API Failure": Plug,
  "Repository/Storage Issue": HardDrive,
};

const ALERT_TYPES = ["", "Backup Failure", "SLA Violation", "RPO Violation", "Missing Backup", "Connector/API Failure", "Repository/Storage Issue"];
const SEVERITIES = ["", "Critical", "High", "Medium", "Low"];
const STATUSES = ["Open", "Acknowledged", "Resolved", ""];

export default function Alerts() {
  const [params, setParams] = useSearchParams();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const alertType = params.get("alert_type") || "";
  const severity = params.get("severity") || "";
  const status = params.get("status") ?? "Open";

  function load() {
    setLoading(true);
    api.alerts.list({ alert_type: alertType || undefined, severity: severity || undefined, status: status || undefined }).then((r) => {
      setAlerts(r);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, [alertType, severity, status]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  async function handleAck(id: string) {
    await api.alerts.acknowledge(id);
    load();
  }
  async function handleResolve(id: string) {
    await api.alerts.resolve(id);
    load();
  }

  const isConnectorType = (t: string) => t === "Connector/API Failure";

  return (
    <div className="p-6 space-y-4 max-w-[1400px]">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Alert Center</h1>
        <p className="text-sm text-signal-idle mt-0.5">
          Backup failures, SLA/RPO breaches, missing backups, repository issues, and connector/API problems — kept distinctly typed.
        </p>
      </div>

      <div className="panel p-3.5 flex flex-wrap items-center gap-2.5">
        <select value={alertType} onChange={(e) => updateParam("alert_type", e.target.value)} className="bg-surface-raised border border-borderc rounded-lg px-2.5 py-1.5 text-sm focus-ring">
          {ALERT_TYPES.map((t) => <option key={t} value={t}>{t || "All Types"}</option>)}
        </select>
        <select value={severity} onChange={(e) => updateParam("severity", e.target.value)} className="bg-surface-raised border border-borderc rounded-lg px-2.5 py-1.5 text-sm focus-ring">
          {SEVERITIES.map((s) => <option key={s} value={s}>{s || "All Severities"}</option>)}
        </select>
        <div className="flex items-center gap-1 ml-1">
          {["Open", "Acknowledged", "Resolved"].map((s) => (
            <button
              key={s}
              onClick={() => updateParam("status", status === s ? "" : s)}
              className={clsx(
                "px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors",
                status === s ? "bg-brand/10 border-brand/40 text-brand" : "border-borderc text-signal-idle hover:text-base-100"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs font-mono text-signal-idle">{alerts.length} alerts</span>
      </div>

      {loading ? (
        <div className="text-center py-16 text-signal-idle"><Loader2 className="animate-spin inline mr-2" size={16} />Loading alerts…</div>
      ) : alerts.length === 0 ? (
        <div className="panel text-center py-16 text-signal-idle">No alerts match this filter. 🎉</div>
      ) : (
        <div className="space-y-2.5">
          {alerts.map((a) => {
            const Icon = TYPE_ICON[a.alert_type] || AlertOctagon;
            return (
              <div key={a.id} className={clsx("panel p-4 flex items-start gap-3.5", isConnectorType(a.alert_type) && "border-l-2 border-l-signal-warning")}>
                <div className={clsx(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  isConnectorType(a.alert_type) ? "bg-signal-warning/10 text-signal-warning" : "bg-signal-critical/10 text-signal-critical"
                )}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <SeverityBadge severity={a.severity} />
                    <span className="text-[11px] font-mono text-signal-idle uppercase tracking-wide">{a.alert_type}</span>
                    {isConnectorType(a.alert_type) && (
                      <span className="text-[10px] font-mono text-signal-warning bg-signal-warning/10 px-1.5 py-0.5 rounded">
                        MONITORING ISSUE — NOT A CONFIRMED BACKUP FAILURE
                      </span>
                    )}
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="text-sm font-medium mb-0.5">{a.title}</div>
                  <div className="text-xs text-signal-idle">{a.description}</div>
                  <div className="text-[11px] font-mono text-signal-idle mt-1.5">
                    {a.asset_name && <>Asset: {a.asset_name} · </>}
                    {a.platform_name && <>Platform: {a.platform_name} · </>}
                    {timeAgo(a.created_at)}
                  </div>
                </div>
                {a.status !== "Resolved" && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {a.status === "Open" && (
                      <button onClick={() => handleAck(a.id)} className="p-2 rounded-lg border border-borderc hover:border-brand/40 hover:text-brand text-signal-idle" title="Acknowledge">
                        <Check size={14} />
                      </button>
                    )}
                    <button onClick={() => handleResolve(a.id)} className="p-2 rounded-lg border border-borderc hover:border-signal-success/40 hover:text-signal-success text-signal-idle" title="Resolve">
                      <CheckCheck size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
