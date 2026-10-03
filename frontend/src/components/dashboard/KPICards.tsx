import React from "react";
import { StatsOverview } from "@/lib/types";
import {
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Clock,
  Scan,
  ShieldCheck,
} from "lucide-react";

interface KPICardsProps {
  stats: StatsOverview | null;
}

export const KPICards: React.FC<KPICardsProps> = ({ stats }) => {
  const total = stats?.total_inspections || 0;
  const passCount = stats?.pass_count || 0;
  const failCount = stats?.fail_count || 0;
  const reworkCount = stats?.rework_count || 0;
  const reviewCount = stats?.review_count || 0;
  const passRate = stats?.pass_rate_pct || 0;
  const avgLatency = stats?.avg_latency_ms || 0;
  const ocrRate = stats?.ocr_success_rate_pct || 0;

  const cards = [
    {
      title: "TOTAL BILLETS",
      value: total.toLocaleString(),
      subtext: "Shift Cumulative",
      icon: Layers,
      color: "text-cyan-400",
      bg: "bg-slate-900 border-slate-800",
      badge: "100% Tracked",
      badgeColor: "bg-cyan-950 text-cyan-300 border-cyan-800",
    },
    {
      title: "FIRST-TIME PASS",
      value: passCount.toLocaleString(),
      subtext: `Yield: ${passRate}%`,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-slate-900 border-slate-800",
      badge: `${passRate}%`,
      badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-800",
    },
    {
      title: "REWORK REQUIRED",
      value: reworkCount.toLocaleString(),
      subtext: "Grinding / Surface Rework",
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-slate-900 border-slate-800",
      badge: `${Math.round((reworkCount / Math.max(total, 1)) * 100)}%`,
      badgeColor: "bg-amber-950 text-amber-300 border-amber-800",
    },
    {
      title: "REJECTED (FAIL)",
      value: failCount.toLocaleString(),
      subtext: "Dimensional / Critical Flaw",
      icon: XCircle,
      color: "text-rose-400",
      bg: "bg-slate-900 border-slate-800",
      badge: `${Math.round((failCount / Math.max(total, 1)) * 100)}%`,
      badgeColor: "bg-rose-950 text-rose-300 border-rose-800",
    },
    {
      title: "PENDING REVIEW",
      value: reviewCount.toLocaleString(),
      subtext: "Low Conf / Sensor Conflict",
      icon: HelpCircle,
      color: "text-yellow-400",
      bg: "bg-slate-900 border-slate-800",
      badge: "Action Req",
      badgeColor: "bg-yellow-950 text-yellow-300 border-yellow-800",
    },
    {
      title: "OCR RECOGNITION",
      value: `${ocrRate}%`,
      subtext: "Heat & Batch Marking",
      icon: Scan,
      color: "text-blue-400",
      bg: "bg-slate-900 border-slate-800",
      badge: ">=80% Conf",
      badgeColor: "bg-blue-950 text-blue-300 border-blue-800",
    },
    {
      title: "CYCLE LATENCY",
      value: `${avgLatency} ms`,
      subtext: "Full Vision & Metrology",
      icon: Clock,
      color: "text-indigo-400",
      bg: "bg-slate-900 border-slate-800",
      badge: "< 350 ms",
      badgeColor: "bg-indigo-950 text-indigo-300 border-indigo-800",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`${c.bg} border rounded-xl p-3.5 flex flex-col justify-between shadow-sm hover:border-slate-700 transition-all`}
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase truncate">
                {c.title}
              </span>
              <Icon className={`w-4 h-4 ${c.color} shrink-0`} />
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xl font-extrabold font-mono text-slate-100 tracking-tight">
                {c.value}
              </span>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${c.badgeColor}`}
              >
                {c.badge}
              </span>
            </div>

            <div className="text-[10px] text-slate-500 font-sans mt-1.5 truncate">
              {c.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
};
