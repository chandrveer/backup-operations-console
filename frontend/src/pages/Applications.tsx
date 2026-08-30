import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LayoutGrid } from "lucide-react";
import { api } from "../api/client";
import { ApplicationSummary } from "../types";
import clsx from "clsx";

const CRIT_COLOR: Record<string, string> = {
  Critical: "text-signal-critical border-signal-critical/30 bg-signal-critical/10",
  High: "text-signal-warning border-signal-warning/30 bg-signal-warning/10",
  Medium: "text-signal-info border-signal-info/30 bg-signal-info/10",
  Low: "text-signal-idle border-signal-idle/30 bg-signal-idle/10",
};

export default function Applications() {
  const [apps, setApps] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.applications.list().then((r) => {
      setApps(r);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6 space-y-4 max-w-[1600px]">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Applications</h1>
        <p className="text-sm text-signal-idle mt-0.5">Business applications grouped from their protected assets.</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-signal-idle"><Loader2 className="animate-spin inline mr-2" size={16} />Loading applications…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => navigate(`/assets?q=${encodeURIComponent(app.name)}`)}
              className="panel p-4 text-left hover:border-brand/40 hover:shadow-glow transition-all focus-ring"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                  <LayoutGrid size={16} />
                </div>
                <span className={clsx("text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border", CRIT_COLOR[app.criticality])}>
                  {app.criticality}
                </span>
              </div>
              <div className="font-display font-semibold text-sm mb-0.5">{app.name}</div>
              <div className="text-xs text-signal-idle mb-3">Owner: {app.owner || "Unassigned"}</div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span>{app.total_assets} assets</span>
                {app.assets_with_failures > 0 && <span className="text-signal-critical">{app.assets_with_failures} failing</span>}
                {app.open_alerts > 0 && <span className="text-signal-warning">{app.open_alerts} alerts</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
