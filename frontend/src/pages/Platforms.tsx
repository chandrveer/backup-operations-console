import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "../api/client";
import { PlatformHealth } from "../types";
import { PlatformHealthRing } from "../components/PlatformHealthRing";
import { StatusBadge } from "../components/Badges";
import { formatDateTime } from "../lib/format";

export default function Platforms() {
  const [platforms, setPlatforms] = useState<PlatformHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.platformHealth().then((r) => {
      setPlatforms(r);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6 space-y-5 max-w-[1600px]">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Backup Platforms</h1>
        <p className="text-sm text-signal-idle mt-0.5">Connector health and performance for each connected backup platform.</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-signal-idle"><Loader2 className="animate-spin inline mr-2" size={16} />Loading platform health…</div>
      ) : (
        <>
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
              />
            ))}
          </div>

          <div className="panel overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-borderc text-left text-[11px] font-mono uppercase tracking-wide text-signal-idle">
                  <th className="px-4 py-3 font-medium">Platform</th>
                  <th className="px-4 py-3 font-medium">Connection</th>
                  <th className="px-4 py-3 font-medium">Assets</th>
                  <th className="px-4 py-3 font-medium">Success Rate (24h)</th>
                  <th className="px-4 py-3 font-medium">Failed Jobs (24h)</th>
                  <th className="px-4 py-3 font-medium">SLA Breaches</th>
                  <th className="px-4 py-3 font-medium">API Latency</th>
                  <th className="px-4 py-3 font-medium">Last Sync</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((p) => (
                  <tr key={p.platform_id} className="border-b border-borderc last:border-0 hover:bg-surface-hover">
                    <td className="px-4 py-3 font-medium">{p.platform_name}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.connection_status} /></td>
                    <td className="px-4 py-3 font-mono">{p.total_assets}</td>
                    <td className="px-4 py-3 font-mono">{p.success_rate_pct}%</td>
                    <td className="px-4 py-3 font-mono text-signal-critical">{p.failed_jobs_24h}</td>
                    <td className="px-4 py-3 font-mono text-signal-warning">{p.sla_breaches}</td>
                    <td className="px-4 py-3 font-mono text-signal-idle">{p.api_latency_ms}ms</td>
                    <td className="px-4 py-3 font-mono text-xs text-signal-idle">{formatDateTime(p.last_sync_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
