import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, ListChecks, Server, LayoutGrid, Boxes, ShieldAlert,
  Bell, FileBarChart, Plug, Settings, Radar,
} from "lucide-react";
import clsx from "clsx";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/jobs", label: "Jobs", icon: ListChecks },
  { to: "/assets", label: "Assets", icon: Server },
  { to: "/applications", label: "Applications", icon: LayoutGrid },
  { to: "/platforms", label: "Backup Platforms", icon: Boxes },
  { to: "/sla", label: "SLA / RPO", icon: ShieldAlert },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/integrations", label: "Integrations", icon: Plug },
  { to: "/administration", label: "Administration", icon: Settings },
];

export function Sidebar({ openAlertCount }: { openAlertCount: number }) {
  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col border-r border-borderc bg-surface/60 backdrop-blur">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-borderc">
        <div className="w-8 h-8 rounded-lg bg-brand/15 border border-brand/30 flex items-center justify-center text-brand">
          <Radar size={17} strokeWidth={2.25} />
        </div>
        <div className="leading-tight">
          <div className="font-display font-semibold text-sm tracking-tight">Mission Control</div>
          <div className="text-[10px] font-mono text-signal-idle tracking-wider">DATA PROTECTION</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative group",
                isActive
                  ? "bg-brand/10 text-brand font-medium"
                  : "text-signal-idle hover:text-base-100 hover:bg-surface-hover"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand" />}
                <item.icon size={16} strokeWidth={2} />
                <span>{item.label}</span>
                {item.label === "Alerts" && openAlertCount > 0 && (
                  <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-signal-critical/15 text-signal-critical font-semibold">
                    {openAlertCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-borderc">
        <div className="panel-raised px-3 py-2.5 text-[11px] font-mono text-signal-idle leading-relaxed">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-success animate-pulse-soft" />
            <span className="text-signal-success font-medium">All connectors polling</span>
          </div>
          Last sync cycle every 10 min
        </div>
      </div>
    </aside>
  );
}
