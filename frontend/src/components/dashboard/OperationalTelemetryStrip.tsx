"use client";

import React from "react";
import { StatsOverview } from "@/lib/types";

interface StripProps {
  stats: StatsOverview | null;
}

export const OperationalTelemetryStrip: React.FC<StripProps> = ({ stats }) => {
  const total = stats?.total_inspections || 0;
  const passRate = stats?.pass_rate_pct || 0;
  const failCount = stats?.fail_count || 0;
  const reworkCount = stats?.rework_count || 0;
  const reviewCount = stats?.review_count || 0;
  const avgLatency = stats?.avg_latency_ms || 0;

  const metrics = [
    {
      label: "TOTAL INSPECTED",
      value: total.toLocaleString(),
      subtext: "Shift Cumulative",
      valueColor: "text-slate-100",
    },
    {
      label: "FIRST-PASS YIELD",
      value: `${passRate.toFixed(1)}%`,
      subtext: `${stats?.pass_count || 0} nominal billets`,
      valueColor: "text-emerald-400",
    },
    {
      label: "DEFECTS (FAIL/REWORK)",
      value: `${reworkCount + failCount}`,
      subtext: `${reworkCount} rework · ${failCount} reject`,
      valueColor: failCount > 0 ? "text-[#ff4b55]" : reworkCount > 0 ? "text-amber-400" : "text-slate-300",
    },
    {
      label: "HUMAN REVIEW QUEUE",
      value: `${reviewCount}`,
      subtext: reviewCount > 0 ? "Pending action" : "Queue clear",
      valueColor: reviewCount > 0 ? "text-amber-400" : "text-slate-400",
    },
    {
      label: "CYCLE TIME (MS)",
      value: `${avgLatency} ms`,
      subtext: "Gate limit: < 350ms",
      valueColor: "text-slate-200",
    },
    {
      label: "ARRAY STATUS",
      value: "05 / 05",
      subtext: "4K GigE Optical Rig",
      valueColor: "text-slate-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-5">
      {metrics.map((m, idx) => (
        <div
          key={idx}
          className="bg-[#0c0e14] border border-white/[0.07] rounded-lg p-3 flex flex-col justify-between"
        >
          <span className="text-[9px] font-mono text-slate-400 tracking-wider uppercase truncate">
            {m.label}
          </span>
          <div className="my-0.5">
            <span className={`text-lg font-bold font-mono tracking-tight ${m.valueColor}`}>
              {m.value}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 truncate">
            {m.subtext}
          </span>
        </div>
      ))}
    </div>
  );
};

