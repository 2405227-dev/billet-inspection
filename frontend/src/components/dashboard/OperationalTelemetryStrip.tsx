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
      label: "BILLETS INSPECTED",
      value: total.toLocaleString(),
      subtext: "Shift Total",
      valueColor: "text-slate-100",
    },
    {
      label: "FIRST-PASS YIELD",
      value: `${passRate.toFixed(1)}%`,
      subtext: `${stats?.pass_count || 0} conforming`,
      valueColor: "text-emerald-400",
    },
    {
      label: "ACTIVE DEFECTS",
      value: `${reworkCount + failCount}`,
      subtext: `${reworkCount} rework, ${failCount} fail`,
      valueColor: failCount > 0 ? "text-[#ED1C27]" : "text-amber-400",
    },
    {
      label: "REVIEW QUEUE",
      value: `${reviewCount}`,
      subtext: "Operator Action",
      valueColor: reviewCount > 0 ? "text-amber-400" : "text-slate-400",
    },
    {
      label: "AVG CYCLE TIME",
      value: `${avgLatency} ms`,
      subtext: "Target < 350ms",
      valueColor: "text-slate-200",
    },
    {
      label: "CAMERAS ONLINE",
      value: "05 / 05",
      subtext: "4K GigE Active",
      valueColor: "text-slate-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {metrics.map((m, idx) => (
        <div
          key={idx}
          className="bg-[#0d0f14] border border-white/[0.07] rounded-lg p-3.5 flex flex-col justify-between"
        >
          <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">
            {m.label}
          </span>
          <div className="my-1">
            <span className={`text-xl font-bold font-mono tracking-tight ${m.valueColor}`}>
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
