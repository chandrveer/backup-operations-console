import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api } from "../api/client";

interface Compliance { application: string; total_assets: number; compliant_assets: number; compliance_pct: number; }
interface FailureReason { reason: string; count: number; }

export default function Reports() {
  const [compliance, setCompliance] = useState<Compliance[]>([]);
  const [reasons, setReasons] = useState<FailureReason[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.reports.complianceByApplication(), api.reports.failureReasons()]).then(([c, r]) => {
      setCompliance(c);
      setReasons(r);
      setLoading(false);
    });
  }, []);

  function complianceColor(pct: number) {
    if (pct >= 95) return "#3DDC84";
    if (pct >= 80) return "#F5A623";
    return "#FF5470";
  }

  return (
    <div className="p-6 space-y-5 max-w-[1600px]">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-signal-idle mt-0.5">Backup compliance posture and top failure causes across the environment.</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-signal-idle"><Loader2 className="animate-spin inline mr-2" size={16} />Building reports…</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="panel p-5">
            <h2 className="font-display font-semibold text-sm mb-1">Backup Compliance by Application</h2>
            <p className="text-xs text-signal-idle mb-4">% of assets with a currently successful backup status</p>
            <ResponsiveContainer width="100%" height={Math.max(260, compliance.length * 34)}>
              <BarChart data={compliance} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#26313C" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "#6B7A8C", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="application" tick={{ fill: "#8A97A5", fontSize: 11 }} width={140} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1B232C", border: "1px solid #26313C", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="compliance_pct" radius={[0, 4, 4, 0]}>
                  {compliance.map((c, i) => <Cell key={i} fill={complianceColor(c.compliance_pct)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="panel p-5">
            <h2 className="font-display font-semibold text-sm mb-1">Top Failure Reasons</h2>
            <p className="text-xs text-signal-idle mb-4">Most frequent causes of failed jobs, all platforms</p>
            <ResponsiveContainer width="100%" height={Math.max(260, reasons.length * 34)}>
              <BarChart data={reasons} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#26313C" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#6B7A8C", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="reason" tick={{ fill: "#8A97A5", fontSize: 10 }} width={220} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1B232C", border: "1px solid #26313C", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#FF5470" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
