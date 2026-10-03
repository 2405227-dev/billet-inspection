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

  let bg = "bg-slate-800 text-slate-300 border-slate-700";
  let icon = <HelpCircle className="w-3.5 h-3.5" />;
  let label = normalized || "UNKNOWN";

  if (normalized === "PASS") {
    bg = "bg-emerald-950/80 text-emerald-400 border-emerald-700/60 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
    icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    label = "PASS";
  } else if (normalized === "FAIL") {
    bg = "bg-rose-950/80 text-rose-400 border-rose-700/60 shadow-[0_0_10px_rgba(244,63,94,0.15)]";
    icon = <XCircle className="w-3.5 h-3.5 text-rose-400" />;
    label = "FAIL";
  } else if (normalized === "REWORK") {
    bg = "bg-amber-950/80 text-amber-400 border-amber-700/60 shadow-[0_0_10px_rgba(245,158,11,0.15)]";
    icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    label = "REWORK";
  } else if (normalized === "NEEDS_REVIEW" || normalized === "REVIEW_REQUIRED" || normalized === "PENDING") {
    bg = "bg-yellow-950/80 text-yellow-400 border-yellow-700/60 shadow-[0_0_10px_rgba(234,179,8,0.15)]";
    icon = <HelpCircle className="w-3.5 h-3.5 text-yellow-400" />;
    label = "NEEDS REVIEW";
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold gap-1",
    md: "px-2.5 py-1 text-xs font-bold gap-1.5",
    lg: "px-3.5 py-1.5 text-sm font-bold gap-2",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border tracking-wider uppercase font-mono-num ${sizeClasses} ${bg}`}
    >
      {showIcon && icon}
      <span>{label}</span>
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: DefectSeverity | string }> = ({ severity }) => {
  const sev = (severity || "").toUpperCase();
  let color = "bg-slate-800 text-slate-300 border-slate-700";

  if (sev === "CRITICAL") {
    color = "bg-rose-900/70 text-rose-300 border-rose-600";
  } else if (sev === "MAJOR") {
    color = "bg-orange-900/70 text-orange-300 border-orange-600";
  } else if (sev === "MODERATE") {
    color = "bg-amber-900/70 text-amber-300 border-amber-600";
  } else if (sev === "MINOR") {
    color = "bg-cyan-950 text-cyan-300 border-cyan-700";
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border tracking-wide uppercase ${color}`}>
      {sev}
    </span>
  );
};
