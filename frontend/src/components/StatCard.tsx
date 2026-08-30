import React from "react";
import clsx from "clsx";
import { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "neutral" | "success" | "warning" | "critical" | "info";
  sub?: string;
  onClick?: () => void;
}

const TONE_MAP: Record<string, string> = {
  neutral: "text-base-100",
  success: "text-signal-success",
  warning: "text-signal-warning",
  critical: "text-signal-critical",
  info: "text-signal-info",
};

const ICON_BG: Record<string, string> = {
  neutral: "bg-signal-idle/10 text-signal-idle",
  success: "bg-signal-success/10 text-signal-success",
  warning: "bg-signal-warning/10 text-signal-warning",
  critical: "bg-signal-critical/10 text-signal-critical",
  info: "bg-signal-info/10 text-signal-info",
};

export function StatCard({ label, value, icon: Icon, tone = "neutral", sub, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "panel p-4 text-left w-full transition-all duration-200 animate-fade-up",
        onClick && "hover:border-brand/40 hover:shadow-glow cursor-pointer focus-ring"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="label-eyebrow">{label}</span>
        <div className={clsx("w-7 h-7 rounded-md flex items-center justify-center", ICON_BG[tone])}>
          <Icon size={14} strokeWidth={2.25} />
        </div>
      </div>
      <div className={clsx("font-display text-2xl font-semibold tracking-tight", TONE_MAP[tone])}>{value}</div>
      {sub && <div className="text-xs text-signal-idle mt-1">{sub}</div>}
    </button>
  );
}
