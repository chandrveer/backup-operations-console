import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Plug, Info } from "lucide-react";
import { api } from "../api/client";
import { IntegrationStatus } from "../types";
import { StatusBadge } from "../components/Badges";
import { formatDateTime } from "../lib/format";

export default function Integrations() {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  function load() {
    api.integrations.status().then((r) => {
      setIntegrations(r);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, []);

  async function handleSync(vendorKey: string) {
    setSyncing(vendorKey);
    await api.integrations.sync(vendorKey);
    await new Promise((r) => setTimeout(r, 400));
    load();
    setSyncing(null);
  }

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Integrations</h1>
        <p className="text-sm text-signal-idle mt-0.5">
          Connector layer status. Each connector is currently running against generated mock data —
          swap in real credentials to go live without changing anything downstream.
        </p>
      </div>

      <div className="panel p-4 flex items-start gap-3 bg-brand/5 border-brand/20">
        <Info size={16} className="text-brand shrink-0 mt-0.5" />
        <p className="text-xs text-signal-idle leading-relaxed">
          The connector layer uses a modular interface — <code className="font-mono text-brand">fetch_assets()</code>,{" "}
          <code className="font-mono text-brand">fetch_jobs()</code>, <code className="font-mono text-brand">health_check()</code> —
          so adding a real Rubrik, Veeam, Commvault, or Azure Backup connection (or a brand-new platform) means implementing
          that interface once; the dashboard, alerts, and reports need no changes.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-signal-idle"><Loader2 className="animate-spin inline mr-2" size={16} />Loading connector status…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((i) => (
            <div key={i.vendor_key} className="panel p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                    <Plug size={17} />
                  </div>
                  <div>
                    <div className="font-display font-semibold text-sm">{i.display_name}</div>
                    <div className="text-[11px] font-mono text-signal-idle">{i.vendor_key}</div>
                  </div>
                </div>
                <StatusBadge status={i.connection_status} />
              </div>

              {i.error_message && (
                <div className="text-xs text-signal-warning bg-signal-warning/10 border border-signal-warning/30 rounded-lg px-3 py-2 mb-3">
                  {i.error_message}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div>
                  <div className="text-signal-idle mb-0.5">Last Sync</div>
                  <div className="font-mono">{formatDateTime(i.last_sync_at)}</div>
                </div>
                <div>
                  <div className="text-signal-idle mb-0.5">API Latency</div>
                  <div className="font-mono">{i.api_latency_ms ?? "—"}ms</div>
                </div>
                <div>
                  <div className="text-signal-idle mb-0.5">Mode</div>
                  <div className="font-mono">{i.is_mock ? "Mock Connector" : "Live"}</div>
                </div>
                <div>
                  <div className="text-signal-idle mb-0.5">Configured</div>
                  <div className="font-mono">{i.configured ? "Yes" : "No"}</div>
                </div>
              </div>

              <button
                onClick={() => handleSync(i.vendor_key)}
                disabled={syncing === i.vendor_key}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-borderc hover:border-brand/40 hover:text-brand text-sm text-signal-idle transition-colors disabled:opacity-50 focus-ring"
              >
                <RefreshCw size={14} className={syncing === i.vendor_key ? "animate-spin" : ""} />
                {syncing === i.vendor_key ? "Syncing…" : "Sync Now"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
