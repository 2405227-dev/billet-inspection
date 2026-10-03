"use client";

import React, { useState, useEffect } from "react";
import { fetchStatsOverview, fetchInspections, getApiUrl } from "@/lib/api";
import { StatsOverview, InspectionSummary } from "@/lib/types";
import {
  Bug,
  PieChart as PieIcon,
  BarChart3,
  Layers,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Flame,
} from "lucide-react";
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
  CartesianGrid,
} from "recharts";

export default function DefectAnalyticsPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const s = await fetchStatsOverview();
      setStats(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const breakdown = stats?.defect_type_breakdown || {};
  const defectData = Object.entries(breakdown).map(([key, count], index) => ({
    name: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    count,
  }));

  const COLORS = ["#f43f5e", "#f59e0b", "#38bdf8", "#818cf8", "#c084fc", "#34d399"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Bug className="w-5 h-5 text-cyan-400" />
            <span>Surface Defect & Fine-Crack Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Metallurgical Flaw Classification • Hairline Crack Tiling • Defect Frequency Distribution
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 self-start"
          title="Refresh Analytics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-1 shadow-sm">
          <div className="text-xs text-slate-400 font-mono">TOTAL DEFECTS DETECTED</div>
          <div className="text-2xl font-extrabold font-mono text-cyan-400">
            {stats?.total_defects_detected || 0}
          </div>
          <div className="text-[11px] text-slate-500 font-sans">
            Across {stats?.total_inspections || 0} inspected billets
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-1 shadow-sm">
          <div className="text-xs text-slate-400 font-mono">CRITICAL QUALITY VIOLATIONS</div>
          <div className="text-2xl font-extrabold font-mono text-rose-400">
            {stats?.fail_count || 0}
          </div>
          <div className="text-[11px] text-slate-500 font-sans">
            Longitudinal / Transverse fractures &gt; metallurgical limit
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-1 shadow-sm">
          <div className="text-xs text-slate-400 font-mono">REWORKABLE SURFACE FLAWS</div>
          <div className="text-2xl font-extrabold font-mono text-amber-400">
            {stats?.rework_count || 0}
          </div>
          <div className="text-[11px] text-slate-500 font-sans">
            Diverted to Grinding & Conditioning station
          </div>
        </div>
      </div>

      {/* Defect Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Defect Frequency by Class</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Real-time counts</span>
          </div>

          <div className="h-64 w-full">
            {defectData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={defectData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#090d16",
                      borderColor: "#334155",
                      fontSize: "11px",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                No defect data available
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-cyan-400" />
              <span>Proportional Defect Composition</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Relative share</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {defectData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={defectData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {defectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0f172a" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#090d16",
                      borderColor: "#334155",
                      fontSize: "11px",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500 font-mono">No defect data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
