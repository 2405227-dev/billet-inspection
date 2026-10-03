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
  FAIL: "#f43f5e", // Rose
  REWORK: "#f59e0b", // Amber
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

  const latencyTrend = (stats?.status_trend || []).map((item, idx) => ({
    billet: `#${item.id.replace("INS-", "")}`,
    latency: item.latency_ms,
    status: item.status,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* 1. Quality Disposition Distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
              Quality Verdict Distribution
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Total: {stats?.total_inspections || 0}</span>
        </div>

        <div className="h-44 w-full flex items-center justify-center">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#090d16",
                    borderColor: "#334155",
                    fontSize: "11px",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#f8fafc" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-xs text-slate-500 font-mono">No inspection data recorded</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              PASS:
            </span>
            <span className="text-emerald-400 font-bold">{stats?.pass_count || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              REWORK:
            </span>
            <span className="text-amber-400 font-bold">{stats?.rework_count || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              FAIL:
            </span>
            <span className="text-rose-400 font-bold">{stats?.fail_count || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              REVIEW:
            </span>
            <span className="text-yellow-400 font-bold">{stats?.review_count || 0}</span>
          </div>
        </div>
      </div>

      {/* 2. Surface Defect Class Distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
              Surface Defect Breakdown
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
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
                  width={95}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#090d16",
                    borderColor: "#334155",
                    fontSize: "11px",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="#38bdf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              No defects detected
            </div>
          )}
        </div>

        <div className="text-[10px] text-slate-500 font-mono text-right pt-2 border-t border-slate-800/80">
          Ranked by occurrence frequency
        </div>
      </div>

      {/* 3. Cycle Latency Trend */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
              Cycle Time Performance (ms)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">
            Avg: {stats?.avg_latency_ms || 0} ms
          </span>
        </div>

        <div className="h-44 w-full">
          {latencyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="billet" tick={{ fill: "#64748b", fontSize: 9 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 9 }} domain={[0, 400]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#090d16",
                    borderColor: "#334155",
                    fontSize: "11px",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#38bdf8" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              Awaiting inspection stream
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/80">
          <span>Target: &lt; 350 ms</span>
          <span className="text-emerald-400">100% Real-Time Compliance</span>
        </div>
      </div>
    </div>
  );
};
