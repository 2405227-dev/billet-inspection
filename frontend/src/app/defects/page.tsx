"use client";

import React, { useState, useEffect } from "react";
import { fetchStatsOverview } from "@/lib/api";
import { StatsOverview } from "@/lib/types";
import { GlowCard } from "@/components/ui/GlowCard";
import {
  Bug,
  PieChart as PieIcon,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  Flame,
  ShieldAlert,
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
  const defectData = Object.entries(breakdown).map(([key, count]) => ({
    name: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    count,
  }));

  const COLORS = ["#ED1C27", "#ff6a00", "#ff8c00", "#38bdf8", "#eab308", "#10b981"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Bug className="w-6 h-6 text-[#ED1C27]" />
            <span>Surface Defect & Fine-Crack Analytics</span>
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Metallurgical Flaw Classification • Hairline Crack Tiling • Defect Frequency Distribution
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors self-start"
          title="Refresh Analytics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#ED1C27]" : ""}`} />
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <GlowCard glowColor="cyan" className="bg-[#0a0a0a] border-white/10 p-6 space-y-2">
          <div className="text-xs text-white/40 font-mono">TOTAL DEFECTS DETECTED</div>
          <div className="text-3xl font-black font-mono text-white">
            {stats?.total_defects_detected || 0}
          </div>
          <div className="text-[11px] text-white/50 font-sans">
            Across {stats?.total_inspections || 0} inspected billets
          </div>
        </GlowCard>

        <GlowCard glowColor="rose" className="bg-[#0a0a0a] border-white/10 p-6 space-y-2">
          <div className="text-xs text-white/40 font-mono">CRITICAL QUALITY VIOLATIONS</div>
          <div className="text-3xl font-black font-mono text-[#ED1C27]">
            {stats?.fail_count || 0}
          </div>
          <div className="text-[11px] text-white/50 font-sans">
            Longitudinal / Transverse fractures &gt; metallurgical threshold
          </div>
        </GlowCard>

        <GlowCard glowColor="amber" className="bg-[#0a0a0a] border-white/10 p-6 space-y-2">
          <div className="text-xs text-white/40 font-mono">REWORKABLE SURFACE FLAWS</div>
          <div className="text-3xl font-black font-mono text-[#ff8c00]">
            {stats?.rework_count || 0}
          </div>
          <div className="text-[11px] text-white/50 font-sans">
            Diverted to Grinding & Conditioning station
          </div>
        </GlowCard>
      </div>

      {/* Defect Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#ED1C27]" />
              <span>Defect Frequency by Class</span>
            </h3>
            <span className="text-[10px] font-mono text-white/40">Real-time counts</span>
          </div>

          <div className="h-64 w-full">
            {defectData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={defectData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 10 }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#000000",
                      borderColor: "rgba(255,255,255,0.15)",
                      fontSize: "11px",
                      borderRadius: "8px",
                      color: "#ffffff",
                    }}
                  />
                  <Bar dataKey="count" fill="#ED1C27" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-white/40 font-mono">
                No defect data available
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#ff8c00]" />
              <span>Proportional Defect Composition</span>
            </h3>
            <span className="text-[10px] font-mono text-white/40">Relative share</span>
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#000000" strokeWidth={2} />
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
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-white/40 font-mono">No defect data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
