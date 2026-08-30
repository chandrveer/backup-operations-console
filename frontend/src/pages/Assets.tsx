import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { api } from "../api/client";
import { Asset } from "../types";
import { StatusBadge } from "../components/Badges";
import { formatDateTime } from "../lib/format";

export default function Assets() {
  const [params, setParams] = useSearchParams();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const pageSize = 25;

  const q = params.get("q") || "";
  const platform = params.get("platform") || "";

  useEffect(() => {
    setLoading(true);
    api.assets.list({ q, platform, page, page_size: pageSize }).then((r) => {
      setAssets(r.items);
      setTotal(r.total);
      setLoading(false);
    });
  }, [q, platform, page]);

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
        <h1 className="font-display text-xl font-semibold tracking-tight">Asset Inventory</h1>
        <p className="text-sm text-signal-idle mt-0.5">
          Every protected server, VM, database, and application — asset → application → tool → policy → status.
        </p>
      </div>

      <div className="panel p-3.5 flex flex-wrap items-center gap-2.5">
        <input
          placeholder="Search assets, applications, owners…"
          value={q}
          onChange={(e) => updateParam("q", e.target.value)}
          className="bg-surface-raised border border-borderc rounded-lg px-3 py-1.5 text-sm placeholder:text-signal-idle focus-ring w-72"
        />
        <select
          value={platform}
          onChange={(e) => updateParam("platform", e.target.value)}
          className="bg-surface-raised border border-borderc rounded-lg px-2.5 py-1.5 text-sm focus-ring"
        >
          <option value="">All Platforms</option>
          <option value="rubrik">Rubrik</option>
          <option value="veeam">Veeam</option>
          <option value="commvault">Commvault</option>
          <option value="azure_backup">Azure Backup</option>
        </select>
        <span className="ml-auto text-xs font-mono text-signal-idle">{total} assets</span>
      </div>

      <div className="panel divide-y divide-borderc overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-signal-idle"><Loader2 className="animate-spin inline mr-2" size={15} />Loading assets…</div>
        ) : assets.length === 0 ? (
          <div className="text-center py-12 text-signal-idle">No assets match this search.</div>
        ) : (
          assets.map((a) => (
            <button
              key={a.id}
              onClick={() => navigate(`/assets/${a.id}`)}
              className="w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors flex items-center gap-3"
            >
              <div className="flex-1 flex items-center gap-2 flex-wrap text-sm min-w-0">
                <span className="font-mono font-semibold">{a.name}</span>
                <ArrowRight size={12} className="text-signal-idle shrink-0" />
                <span className="text-signal-idle">{a.application_name || "—"}</span>
                <ArrowRight size={12} className="text-signal-idle shrink-0" />
                <span className="text-brand">{a.platform_name}</span>
                <ArrowRight size={12} className="text-signal-idle shrink-0" />
                <span className="font-mono text-xs text-signal-idle">{a.policy_name}</span>
              </div>
              <div className="hidden md:flex items-center gap-4 text-xs shrink-0">
                <span className="font-mono text-signal-idle">RPO {a.rpo_hours}h</span>
                <span className="font-mono text-signal-idle">{formatDateTime(a.last_successful_backup_at)}</span>
                <StatusBadge status={a.last_backup_status} />
              </div>
            </button>
          ))
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-signal-idle px-1">
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
  );
}
