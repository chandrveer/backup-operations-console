import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Server, CheckCircle2, XCircle, Loader2, SkipForward, ShieldAlert,
  Clock, AlertTriangle, Bell,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { api } from "../api/client";
import { DashboardSummary, PlatformHealth, TrendPoint, Alert } from "../types";
import { StatCard } from "../components/StatCard";
import { PlatformHealthRing } from "../components/PlatformHealthRing";
import { SeverityBadge } from "../components/Badges";
import { timeAgo } from "../lib/format";

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [platforms, setPlatforms] = useState<PlatformHealth[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.dashboard.summary(),
      api.dashboard.platformHealth(),
      api.dashboard.trend(14),
      api.alerts.list({ status: "Open" }),
    ]).then(([s, p, t, a]) => {
      setSummary(s);
      setPlatforms(p);
      setTrend(t);
      setRecentAlerts(a.slice(0, 6));
      setLoading(false);
    });
  }, []);

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-signal-idle gap-2">
        <Loader2 className="animate-spin" size={18} /> Loading mission control…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Data Protection Overview</h1>
        <p className="text-sm text-signal-idle mt-0.5">
          Unified view across Rubrik, Veeam, Commvault, and Azure Backup — refreshed every 10 minutes.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
        <StatCard label="Protected Assets" value={summary.total_assets} icon={Server} tone="info" onClick={() => navigate("/assets")} />
        <StatCard label="Successful (24h)" value={summary.successful_backups_24h} icon={CheckCircle2} tone="success" onClick={() => navigate("/jobs?status=Success")} />
        <StatCard label="Failed (24h)" value={summary.failed_backups_24h} icon={XCircle} tone="critical" onClick={() => navigate("/jobs?status=Failed")} />
        <StatCard label="Running Now" value={summary.running_backups} icon={Loader2} tone="info" onClick={() => navigate("/jobs?status=Running")} />
        <StatCard label="Skipped (24h)" value={summary.skipped_backups_24h} icon={SkipForward} tone="neutral" onClick={() => navigate("/jobs?status=Skipped")} />
        <StatCard label="SLA Breaches" value={summary.sla_breaches} icon={ShieldAlert} tone="warning" onClick={() => navigate("/sla")} />
        <StatCard label="RPO Breaches" value={summary.rpo_breaches} icon={Clock} tone="warning" onClick={() => navigate("/sla")} />
        <StatCard label="Missing Recent Backup" value={summary.assets_without_recent_backup} icon={AlertTriangle} tone="critical" onClick={() => navigate("/assets")} />
        <StatCard label="Open Alerts" value={summary.open_alerts} icon={Bell} tone="warning" onClick={() => navigate("/alerts")} />
        <StatCard label="Critical Alerts" value={summary.critical_alerts} icon={Bell} tone="critical" onClick={() => navigate("/alerts?severity=Critical")} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Trend chart */}
        <div className="xl:col-span-2 panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-sm">Backup Volume Trend</h2>
              <p className="text-xs text-signal-idle">Last 14 days, all platforms combined</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="gSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3DDC84" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3DDC84" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gFailed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF5470" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#FF5470" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#26313C" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#6B7A8C", fontSize: 11 }} axisLine={{ stroke: "#26313C" }} tickLine={false} />
              <YAxis tick={{ fill: "#6B7A8C", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#1B232C", border: "1px solid #26313C", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#E8EDF2" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="success" name="Success" stroke="#3DDC84" fill="url(#gSuccess)" strokeWidth={2} />
              <Area type="monotone" dataKey="failed" name="Failed" stroke="#FF5470" fill="url(#gFailed)" strokeWidth={2} />
              <Area type="monotone" dataKey="skipped" name="Skipped" stroke="#6B7A8C" fill="transparent" strokeWidth={1.5} strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent alerts feed */}
        <div className="panel p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-sm">Latest Alerts</h2>
            <button onClick={() => navigate("/alerts")} className="text-xs text-brand hover:underline">View all</button>
          </div>
          <div className="space-y-2 overflow-y-auto flex-1 max-h-[260px] pr-1">
            {recentAlerts.length === 0 && (
              <div className="text-sm text-signal-idle py-8 text-center">No open alerts. Everything's healthy.</div>
            )}
            {recentAlerts.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate("/alerts")}
                className="w-full text-left panel-raised p-2.5 hover:border-brand/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <SeverityBadge severity={a.severity} />
                  <span className="text-[10px] font-mono text-signal-idle">{timeAgo(a.created_at)}</span>
                </div>
                <div className="text-xs font-medium truncate">{a.title}</div>
                <div className="text-[11px] text-signal-idle font-mono">{a.alert_type}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Platform health rings */}
      <div>
        <h2 className="font-display font-semibold text-sm mb-3">Health by Backup Platform</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {platforms.map((p) => (
            <PlatformHealthRing
              key={p.platform_id}
              label={p.platform_name}
              vendorKey={p.vendor_key}
              successRate={p.success_rate_pct}
              connectionStatus={p.connection_status}
              assets={p.total_assets}
              failedJobs={p.failed_jobs_24h}
              slaBreaches={p.sla_breaches}
              latencyMs={p.api_latency_ms}
              onClick={() => navigate(`/platforms`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
