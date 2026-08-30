import { useEffect, useState, ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { api } from "../api/client";
import { Asset, Job, Alert } from "../types";
import { StatusBadge, SeverityBadge } from "../components/Badges";
import { formatDateTime, formatDuration, formatBytes } from "../lib/format";

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.assets.lineage(id).then((r) => {
      setAsset(r.asset);
      setJobs(r.recent_jobs);
      setAlerts(r.open_alerts);
      setLoading(false);
    });
  }, [id]);

  if (loading || !asset) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-signal-idle gap-2">
        <Loader2 className="animate-spin" size={18} /> Loading asset…
      </div>
    );
  }

  const lineage = [asset.name, asset.application_name, asset.platform_name, asset.policy_name, asset.last_backup_status];

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-signal-idle hover:text-base-100">
        <ArrowLeft size={14} /> Back
      </button>

      {/* Lineage strip */}
      <div className="panel p-4 flex items-center gap-2 flex-wrap font-mono text-sm overflow-x-auto">
        {lineage.map((seg, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <ArrowRight size={13} className="text-signal-idle shrink-0" />}
            {i === lineage.length - 1 ? <StatusBadge status={seg as string} /> : (
              <span className={i === 0 ? "font-semibold text-base-100" : i === 2 ? "text-brand" : "text-signal-idle"}>{seg}</span>
            )}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Asset properties */}
        <div className="panel p-5 space-y-3.5">
          <h2 className="font-display font-semibold text-sm mb-1">Asset Details</h2>
          <Field label="Type" value={asset.asset_type} />
          <Field label="Environment" value={asset.environment} />
          <Field label="Owner" value={asset.owner || "—"} />
          <Field label="SLA" value={asset.sla_name || "—"} />
          <Field label="RPO / RTO" value={`${asset.rpo_hours}h / ${asset.rto_hours}h`} />
          <Field label="Retention" value={`${asset.retention_days} days`} />
          <Field
            label="Replication"
            value={asset.replication_enabled ? (
              <span className="flex items-center gap-1 text-signal-success"><ShieldCheck size={13} />{asset.replication_target}</span>
            ) : "Disabled"}
          />
          <Field label="Last Successful Backup" value={formatDateTime(asset.last_successful_backup_at)} />
          <Field label="Tags" value={asset.tags?.split(",").join(", ") || "—"} />
        </div>

        {/* Recent jobs */}
        <div className="lg:col-span-2 panel p-5">
          <h2 className="font-display font-semibold text-sm mb-3">Recent Job History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-mono uppercase tracking-wide text-signal-idle border-b border-borderc">
                  <th className="py-2 pr-3 font-medium">Start</th>
                  <th className="py-2 pr-3 font-medium">Duration</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Size</th>
                  <th className="py-2 pr-3 font-medium">Failure Reason</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="border-b border-borderc last:border-0">
                    <td className="py-2 pr-3 font-mono text-xs">{formatDateTime(j.start_time)}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-signal-idle">{formatDuration(j.duration_seconds)}</td>
                    <td className="py-2 pr-3"><StatusBadge status={j.status} /></td>
                    <td className="py-2 pr-3 font-mono text-xs text-signal-idle">{formatBytes(j.bytes_transferred_gb)}</td>
                    <td className="py-2 pr-3 text-xs text-signal-critical max-w-[200px] truncate">{j.failure_reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Open alerts */}
      {alerts.length > 0 && (
        <div className="panel p-5">
          <h2 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
            <RefreshCw size={14} className="text-signal-warning" /> Open Alerts for this Asset
          </h2>
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="panel-raised p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-signal-idle">{a.description}</div>
                </div>
                <SeverityBadge severity={a.severity} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-signal-idle">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
