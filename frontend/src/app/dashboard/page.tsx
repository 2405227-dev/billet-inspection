"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  fetchStatsOverview,
  fetchInspections,
  getWsUrl,
  triggerSingleInspection,
} from "@/lib/api";
import { StatsOverview, InspectionSummary } from "@/lib/types";
import { KPICards } from "@/components/dashboard/KPICards";
import { TrendCharts } from "@/components/dashboard/TrendCharts";
import { LiveCameraOverlay } from "@/components/inspection/LiveCameraOverlay";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  PlusCircle,
  Clock,
  Sparkles,
  Search,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [recentInspections, setRecentInspections] = useState<InspectionSummary[]>([]);
  const [currentInspection, setCurrentInspection] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [statsData, listData] = await Promise.all([
        fetchStatsOverview(),
        fetchInspections({ limit: 8 }),
      ]);
      setStats(statsData);
      setRecentInspections(listData);
      if (listData.length > 0 && !currentInspection) {
        setCurrentInspection(listData[0]);
      }
    } catch (err) {
      console.error("Dashboard data load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // WebSocket real-time subscription
    let ws: WebSocket | null = null;
    try {
      const wsUrl = getWsUrl("/ws/inspection");
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "INSPECTION_COMPLETED") {
            const newIns = payload.data;
            setCurrentInspection(newIns);
            setRecentInspections((prev) => [newIns, ...prev.slice(0, 7)]);
            // Refresh stats counters
            fetchStatsOverview().then(setStats).catch(console.error);
          }
        } catch (e) {
          console.error(e);
        }
      };
    } catch (err) {
      console.error(err);
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <span>QA Industrial Command Center</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous Casting & Billet Rolling Inspection • Zero-Defect Optical Traceability
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/audit"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Verify Audit Chain</span>
          </Link>

          <Link
            href="/reports"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit Reports</span>
          </Link>

          <button
            onClick={loadData}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <KPICards stats={stats} />

      {/* Main Operational Split: Live Camera HUD & Recent Inspections Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Camera Viewport (7 Cols) */}
        <div className="lg:col-span-7">
          <LiveCameraOverlay currentInspection={currentInspection} isLoading={loading} />
        </div>

        {/* Live Stream Recent Inspections (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
                  Live Billet Stream (Real-Time)
                </h3>
              </div>
              <Link
                href="/inspections"
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                <span>View All Billets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-800/80">
              {recentInspections.length === 0 ? (
                <div className="text-center py-8 text-xs font-mono text-slate-500">
                  No inspection events recorded yet.
                </div>
              ) : (
                recentInspections.map((ins) => (
                  <Link
                    key={ins.id}
                    href={`/inspections/${ins.id}`}
                    className="py-2.5 px-2 -mx-2 rounded-lg hover:bg-slate-800/60 flex items-center justify-between transition-colors block group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-100 font-mono group-hover:text-cyan-300">
                          {ins.billet_id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {ins.heat_number}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        L: {ins.length_mm} mm • Defects: {ins.defect_count} • {ins.processing_latency_ms} ms
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={ins.status} size="sm" />
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Every single billet logged permanently</span>
            <span className="text-emerald-400">SHA-256 Chained</span>
          </div>
        </div>
      </div>

      {/* Trend Visualizations */}
      <TrendCharts stats={stats} />
    </div>
  );
}
