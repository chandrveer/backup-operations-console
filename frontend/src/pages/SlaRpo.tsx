import { useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { api } from "../api/client";
import { SlaPolicy } from "../types";
import clsx from "clsx";

export default function SlaRpo() {
  const [policies, setPolicies] = useState<SlaPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.sla.policies().then((r) => {
      setPolicies(r);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6 space-y-4 max-w-[1600px]">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">SLA / RPO Policies</h1>
        <p className="text-sm text-signal-idle mt-0.5">Recovery point and time objectives by policy, with open breach counts.</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-signal-idle"><Loader2 className="animate-spin inline mr-2" size={16} />Loading policies…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {policies.map((p) => (
            <div key={p.sla_name} className={clsx("panel p-4", p.open_breaches > 0 && "border-signal-critical/30")}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-mono font-semibold text-sm">{p.sla_name}</div>
                  <div className="text-xs text-signal-idle">{p.asset_count} protected assets</div>
                </div>
                {p.open_breaches > 0 ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-signal-critical bg-signal-critical/10 border border-signal-critical/30 px-2 py-0.5 rounded-md">
                    <ShieldAlert size={12} /> {p.open_breaches} breach{p.open_breaches !== 1 ? "es" : ""}
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-signal-success bg-signal-success/10 border border-signal-success/30 px-2 py-0.5 rounded-md">
                    Compliant
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="panel-raised p-2.5 text-center">
                  <div className="text-[10px] font-mono uppercase text-signal-idle mb-0.5">Avg RPO</div>
                  <div className="font-display text-lg font-semibold">{p.avg_rpo_hours}h</div>
                </div>
                <div className="panel-raised p-2.5 text-center">
                  <div className="text-[10px] font-mono uppercase text-signal-idle mb-0.5">Avg RTO</div>
                  <div className="font-display text-lg font-semibold">{p.avg_rto_hours}h</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
