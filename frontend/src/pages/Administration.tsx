import { useState } from "react";
import { Users, ShieldCheck, Bell, Database, Plus, MoreVertical } from "lucide-react";
import clsx from "clsx";

const USERS = [
  { name: "Ops Team Lead", email: "ops.lead@company.com", role: "Administrator", status: "Active" },
  { name: "Priya Nandakumar", email: "priya.n@company.com", role: "Backup Operator", status: "Active" },
  { name: "David Chen", email: "david.chen@company.com", role: "Backup Operator", status: "Active" },
  { name: "Grace Kim", email: "grace.kim@company.com", role: "Viewer", status: "Invited" },
];

const ROLES = [
  { name: "Administrator", desc: "Full access: manage connectors, acknowledge/resolve alerts, edit SLA policies.", count: 1 },
  { name: "Backup Operator", desc: "View all data, acknowledge/resolve alerts, trigger manual syncs.", count: 2 },
  { name: "Viewer", desc: "Read-only access to dashboard, jobs, assets, and reports.", count: 1 },
];

const TABS = [
  { key: "users", label: "Users & Roles", icon: Users },
  { key: "notifications", label: "Notification Rules", icon: Bell },
  { key: "retention", label: "Data Retention", icon: Database },
  { key: "security", label: "Security", icon: ShieldCheck },
];

export default function Administration() {
  const [tab, setTab] = useState("users");

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight">Administration</h1>
        <p className="text-sm text-signal-idle mt-0.5">Manage users, roles, notification routing, and console-wide settings.</p>
      </div>

      <div className="flex items-center gap-1.5 border-b border-borderc pb-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "flex items-center gap-2 px-3.5 py-2.5 text-sm border-b-2 -mb-px transition-colors",
              tab === t.key ? "border-brand text-brand" : "border-transparent text-signal-idle hover:text-base-100"
            )}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-sm">Team Members</h2>
            <button className="flex items-center gap-1.5 text-xs font-medium bg-brand/10 text-brand border border-brand/30 rounded-lg px-3 py-1.5 hover:bg-brand/15 focus-ring">
              <Plus size={13} /> Invite User
            </button>
          </div>
          <div className="panel divide-y divide-borderc overflow-hidden">
            {USERS.map((u) => (
              <div key={u.email} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center text-brand text-xs font-semibold">
                    {u.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-xs text-signal-idle font-mono">{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-signal-idle">{u.role}</span>
                  <span className={clsx(
                    "text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border",
                    u.status === "Active" ? "text-signal-success bg-signal-success/10 border-signal-success/30" : "text-signal-warning bg-signal-warning/10 border-signal-warning/30"
                  )}>
                    {u.status}
                  </span>
                  <button className="text-signal-idle hover:text-base-100"><MoreVertical size={15} /></button>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-display font-semibold text-sm pt-2">Roles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ROLES.map((r) => (
              <div key={r.name} className="panel p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{r.name}</span>
                  <span className="text-xs font-mono text-signal-idle">{r.count} user{r.count !== 1 ? "s" : ""}</span>
                </div>
                <p className="text-xs text-signal-idle leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "notifications" && (
        <div className="panel p-5 space-y-4">
          <h2 className="font-display font-semibold text-sm">Alert Routing</h2>
          <p className="text-xs text-signal-idle">Route alert types to notification channels. (Static preview — wire to email/Slack/PagerDuty webhooks in production.)</p>
          <div className="space-y-2">
            {["Backup Failure", "SLA Violation", "RPO Violation", "Connector/API Failure"].map((t) => (
              <div key={t} className="flex items-center justify-between panel-raised px-3.5 py-2.5">
                <span className="text-sm font-mono">{t}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/30 font-mono">Email</span>
                  <span className="px-2 py-0.5 rounded bg-signal-idle/10 text-signal-idle border border-signal-idle/30 font-mono">Slack</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "retention" && (
        <div className="panel p-5 space-y-3">
          <h2 className="font-display font-semibold text-sm">Console Data Retention</h2>
          <p className="text-xs text-signal-idle">How long job history, resolved alerts, and audit logs are kept in the central database.</p>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {[["Job history", "180 days"], ["Resolved alerts", "365 days"], ["Audit log", "2 years"]].map(([k, v]) => (
              <div key={k} className="panel-raised p-3 text-center">
                <div className="text-[10px] font-mono uppercase text-signal-idle mb-1">{k}</div>
                <div className="font-display font-semibold text-sm">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "security" && (
        <div className="panel p-5 space-y-3">
          <h2 className="font-display font-semibold text-sm">Security</h2>
          <p className="text-xs text-signal-idle">SSO, API key management, and audit trail settings live here in production.</p>
          <div className="text-xs font-mono text-signal-idle panel-raised px-3.5 py-2.5">SSO: Not configured (mock environment)</div>
        </div>
      )}
    </div>
  );
}
