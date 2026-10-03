"use client";

import React from "react";
import { StatsOverview } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Activity, PieChart as PieIcon, BarChart3, TrendingUp } from "lucide-react";

interface TrendChartsProps {
  stats: StatsOverview | null;
}

const STATUS_COLORS: Record<string, string> = {
  PASS: "#10b981", // Emerald
  FAIL: "#ED1C27", // E-Summit Signature Crimson
  REWORK: "#ff8c00", // Amber Fire
  NEEDS_REVIEW: "#eab308", // Yellow
};

export const TrendCharts: React.FC<TrendChartsProps> = ({ stats }) => {
  const pieData = [
    { name: "PASS", value: stats?.pass_count || 0, color: STATUS_COLORS.PASS },
    { name: "REWORK", value: stats?.rework_count || 0, color: STATUS_COLORS.REWORK },
    { name: "FAIL", value: stats?.fail_count || 0, color: STATUS_COLORS.FAIL },
    { name: "REVIEW", value: stats?.review_count || 0, color: STATUS_COLORS.NEEDS_REVIEW },
  ].filter((d) => d.value > 0);

  const defectBreakdown = stats?.defect_type_breakdown || {};
  const defectBarData = Object.entries(defectBreakdown)
    .map(([key, count]) => ({
      name: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const latencyTrend = (stats?.status_trend || []).map((item) => ({
    billet: `#${item.id.replace("INS-", "")}`,
    latency: item.latency_ms,
    status: item.status,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
      {/* 1. Quality Disposition Distribution */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-[#ED1C27]" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
              Quality Verdict Distribution
            </h3>
          </div>
          <span className="text-[10px] font-mono text-white/50">Total: {stats?.total_inspections || 0}</span>
        </div>

        <div className="h-44 w-full flex items-center justify-center">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#000000" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000000",
                    borderColor: "rgba(255,255,255,0.15)",
                    fontSize: "11px",
                    borderRadius: "8px",
                    color: "#ffffff",
                  }}
                  itemStyle={{ color: "#ffffff" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-xs text-white/40 font-mono">No inspection data recorded</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-[11px] font-mono">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-white/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              PASS:
            </span>
            <span className="text-emerald-400 font-bold">{stats?.pass_count || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-white/60">
              <span className="w-2 h-2 rounded-full bg-[#ff8c00]" />
              REWORK:
            </span>
            <span className="text-[#ff8c00] font-bold">{stats?.rework_count || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-white/60">
              <span className="w-2 h-2 rounded-full bg-[#ED1C27]" />
              FAIL:
            </span>
            <span className="text-[#ED1C27] font-bold">{stats?.fail_count || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-white/60">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              REVIEW:
            </span>
            <span className="text-yellow-400 font-bold">{stats?.review_count || 0}</span>
          </div>
        </div>
      </div>

      {/* 2. Surface Defect Class Distribution */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#ED1C27]" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
              Surface Defect Breakdown
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#ED1C27] font-bold">
            {stats?.total_defects_detected || 0} Flaws
          </span>
        </div>

        <div className="h-44 w-full">
          {defectBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defectBarData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={100}
                  tick={{ fill: "#a1a1aa", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000000",
                    borderColor: "rgba(255,255,255,0.15)",
                    fontSize: "11px",
                    borderRadius: "8px",
                    color: "#ffffff",
                  }}
                />
                <Bar dataKey="count" fill="#ED1C27" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-white/40 font-mono">
              No defects detected
            </div>
          )}
        </div>

        <div className="text-[10px] text-white/40 font-mono text-right pt-3 border-t border-white/10">
          Ranked by occurrence frequency
        </div>
      </div>

      {/* 3. Cycle Latency Trend */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#ff8c00]" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
              Cycle Time Performance (ms)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">
            Avg: {stats?.avg_latency_ms || 0} ms
          </span>
        </div>

        <div className="h-44 w-full">
          {latencyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="billet" tick={{ fill: "#71717a", fontSize: 9 }} />
                <YAxis tick={{ fill: "#71717a", fontSize: 9 }} domain={[0, 400]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000000",
                    borderColor: "rgba(255,255,255,0.15)",
                    fontSize: "11px",
                    borderRadius: "8px",
                    color: "#ffffff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="#ff8c00"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#ED1C27" }}
                  activeDot={{ r: 5, fill: "#ff4d56" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-white/40 font-mono">
              Awaiting inspection stream
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-white/50 font-mono pt-3 border-t border-white/10">
          <span>Target: &lt; 350 ms</span>
          <span className="text-emerald-400 font-bold">100% Real-Time Compliance</span>
        </div>
      </div>
    </div>
  );
};
