import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { api } from "../api/client";
import { Job } from "../types";
import { StatusBadge } from "../components/Badges";
import { formatDateTime, formatDuration } from "../lib/format";

const PLATFORMS = [
  { value: "", label: "All Platforms" },
  { value: "rubrik", label: "Rubrik" },
  { value: "veeam", label: "Veeam" },
  { value: "commvault", label: "Commvault" },
  { value: "azure_backup", label: "Azure Backup" },
];
const STATUSES = ["", "Success", "Failed", "Running", "Skipped", "Warning"];

export default function Jobs() {
  const [params, setParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 25;

  const platform = params.get("platform") || "";
  const status = params.get("status") || "";
  const server = params.get("server") || "";
  const application = params.get("application") || "";

  useEffect(() => {
    setLoading(true);
    api.jobs
      .list({ platform, status, server, application, page, page_size: pageSize })
      .then((r) => {
        setJobs(r.items);
        setTotal(r.total);
        setLoading(false);
      });
  }, [platform, status, server, application, page]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-6 space-y-4 max-w-[1600px]">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Job Monitoring</h1>
        <p className="text-sm text-signal-idle mt-0.5">Unified backup job history across every platform.</p>
      </div>

      <div className="panel p-3.5 flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-signal-idle text-xs font-mono mr-1">
          <Filter size={13} /> FILTERS
        </div>
        <select
          value={platform}
          onChange={(e) => updateParam("platform", e.target.value)}
          className="bg-surface-raised border border-borderc rounded-lg px-2.5 py-1.5 text-sm focus-ring"
        >
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => updateParam("status", e.target.value)}
          className="bg-surface-raised border border-borderc rounded-lg px-2.5 py-1.5 text-sm focus-ring"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || "All Statuses"}</option>
          ))}
        </select>
        <input
          placeholder="Server / VM / DB name…"
          value={server}
          onChange={(e) => updateParam("server", e.target.value)}
          className="bg-surface-raised border border-borderc rounded-lg px-3 py-1.5 text-sm placeholder:text-signal-idle focus-ring w-56"
        />
        <input
          placeholder="Application…"
          value={application}
          onChange={(e) => updateParam("application", e.target.value)}
          className="bg-surface-raised border border-borderc rounded-lg px-3 py-1.5 text-sm placeholder:text-signal-idle focus-ring w-48"
        />
        <span className="ml-auto text-xs font-mono text-signal-idle">{total} jobs</span>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borderc text-left text-[11px] font-mono uppercase tracking-wide text-signal-idle">
                <th className="px-4 py-3 font-medium">Job</th>
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 font-medium">Application</th>
                <th className="px-4 py-3 font-medium">Platform</th>
                <th className="px-4 py-3 font-medium">Policy/SLA</th>
                <th className="px-4 py-3 font-medium">Start</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">RPO</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Failure Reason</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="text-center py-12 text-signal-idle"><Loader2 className="animate-spin inline mr-2" size={15} />Loading jobs…</td></tr>
              ) : jobs.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-12 text-signal-idle">No jobs match these filters.</td></tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.id} className="border-b border-borderc last:border-0 hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-signal-idle max-w-[160px] truncate">{j.job_name}</td>
                    <td className="px-4 py-2.5 font-mono font-medium">{j.asset_name || "—"}</td>
                    <td className="px-4 py-2.5 text-signal-idle">{j.application_name || "—"}</td>
                    <td className="px-4 py-2.5">{j.platform_name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-signal-idle">{j.policy_name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{formatDateTime(j.start_time)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-signal-idle">{formatDuration(j.duration_seconds)}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={j.status} /></td>
                    <td className="px-4 py-2.5 font-mono text-xs">{j.rpo_hours}h</td>
                    <td className="px-4 py-2.5 text-signal-idle">{j.owner}</td>
                    <td className="px-4 py-2.5 text-xs text-signal-critical max-w-[220px] truncate">{j.failure_reason || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-borderc text-xs text-signal-idle">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1.5">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-md border border-borderc disabled:opacity-30 hover:bg-surface-hover">
              <ChevronLeft size={14} />
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-md border border-borderc disabled:opacity-30 hover:bg-surface-hover">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
