import React from "react";
import { InspectionStatus, DefectSeverity } from "@/lib/types";
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, ShieldAlert } from "lucide-react";

interface StatusBadgeProps {
  status: InspectionStatus | string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  showIcon = true,
}) => {
  const normalized = (status || "").toUpperCase();

  let bg = "bg-slate-900/80 text-slate-300 border-white/10";
  let icon = <HelpCircle className="w-3.5 h-3.5" />;
  let label = normalized || "UNKNOWN";

  if (normalized === "PASS") {
    bg = "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-[0_0_14px_rgba(16,185,129,0.25)]";
    icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    label = "PASS";
  } else if (normalized === "FAIL") {
    bg = "bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-[0_0_14px_rgba(239,68,68,0.25)]";
    icon = <XCircle className="w-3.5 h-3.5 text-rose-400" />;
    label = "FAIL";
  } else if (normalized === "REWORK") {
    bg = "bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-[0_0_14px_rgba(245,158,11,0.25)]";
    icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    label = "REWORK";
  } else if (normalized === "NEEDS_REVIEW" || normalized === "REVIEW_REQUIRED" || normalized === "PENDING") {
    bg = "bg-yellow-500/15 text-yellow-400 border-yellow-500/40 shadow-[0_0_14px_rgba(234,179,8,0.25)]";
    icon = <HelpCircle className="w-3.5 h-3.5 text-yellow-400" />;
    label = "NEEDS REVIEW";
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] font-bold gap-1 rounded-full",
    md: "px-3 py-1 text-xs font-bold gap-1.5 rounded-full",
    lg: "px-4 py-1.5 text-sm font-bold gap-2 rounded-full",
  }[size];

  return (
    <span
      className={`inline-flex items-center border tracking-wider uppercase font-mono backdrop-blur-sm transition-all ${sizeClasses} ${bg}`}
    >
      {showIcon && icon}
      <span>{label}</span>
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: DefectSeverity | string }> = ({ severity }) => {
  const sev = (severity || "").toUpperCase();
  let color = "bg-slate-800 text-slate-300 border-white/10";

  if (sev === "CRITICAL") {
    color = "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
  } else if (sev === "MAJOR") {
    color = "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
  } else if (sev === "MODERATE") {
    color = "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
  } else if (sev === "MINOR") {
    color = "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border tracking-wide uppercase ${color}`}>
      {sev}
    </span>
  );
};
