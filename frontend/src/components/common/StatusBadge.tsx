import React from "react";
import { InspectionStatus, DefectSeverity } from "@/lib/types";
import { Check, X, AlertTriangle, HelpCircle } from "lucide-react";

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

  let bg = "bg-white/[0.04] text-slate-400 border-white/10";
  let dot = "bg-slate-400";
  let icon = <HelpCircle className="w-3 h-3" />;
  let label = normalized || "UNKNOWN";

  if (normalized === "PASS") {
    bg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    dot = "bg-emerald-400";
    icon = <Check className="w-3 h-3 text-emerald-400" strokeWidth={3} />;
    label = "PASS";
  } else if (normalized === "FAIL" || normalized === "REJECT") {
    bg = "bg-[#ED1C27]/15 text-[#ff4b55] border-[#ED1C27]/40";
    dot = "bg-[#ED1C27]";
    icon = <X className="w-3 h-3 text-[#ff4b55]" strokeWidth={3} />;
    label = "FAIL";
  } else if (normalized === "REWORK") {
    bg = "bg-amber-500/10 text-amber-400 border-amber-500/30";
    dot = "bg-amber-400";
    icon = <AlertTriangle className="w-3 h-3 text-amber-400" />;
    label = "REWORK";
  } else if (
    normalized === "NEEDS_REVIEW" ||
    normalized === "REVIEW_REQUIRED" ||
    normalized === "PENDING" ||
    normalized === "REVIEW"
  ) {
    bg = "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";
    dot = "bg-yellow-400";
    icon = <HelpCircle className="w-3 h-3 text-yellow-300" />;
    label = "REVIEW";
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1 rounded",
    md: "px-2.5 py-0.5 text-[11px] gap-1.5 rounded",
    lg: "px-3 py-1 text-xs gap-1.5 rounded-md",
  }[size];

  return (
    <span
      className={`inline-flex items-center font-mono font-bold tracking-wider uppercase border ${sizeClasses} ${bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
      <span>{label}</span>
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: DefectSeverity | string }> = ({ severity }) => {
  const sev = (severity || "").toUpperCase();
  let color = "bg-white/[0.04] text-slate-400 border-white/10";
  let dot = "bg-slate-400";

  if (sev === "CRITICAL") {
    color = "bg-[#ED1C27]/15 text-[#ff4b55] border-[#ED1C27]/40";
    dot = "bg-[#ED1C27]";
  } else if (sev === "MAJOR") {
    color = "bg-amber-500/15 text-amber-300 border-amber-500/30";
    dot = "bg-amber-400";
  } else if (sev === "MODERATE") {
    color = "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";
    dot = "bg-yellow-400";
  } else if (sev === "MINOR") {
    color = "bg-sky-500/10 text-sky-300 border-sky-500/30";
    dot = "bg-sky-400";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold border tracking-wider uppercase ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
      <span>{sev}</span>
    </span>
  );
};

