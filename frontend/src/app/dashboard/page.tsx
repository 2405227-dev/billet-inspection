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
import { CommandCenterHero } from "@/components/dashboard/CommandCenterHero";
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
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [recentInspections, setRecentInspections] = useState<InspectionSummary[]>([]);
  const [currentInspection, setCurrentInspection] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [triggering, setTriggering] = useState<boolean>(false);

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

  const handleTriggerCycle = async () => {
    try {
      setTriggering(true);
      const res = await triggerSingleInspection({ scenario: "NORMAL" });
      setCurrentInspection(res);
      await loadData();
    } catch (err) {
      console.error("Failed to trigger cycle", err);
    } finally {
      setTriggering(false);
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
    <div className="space-y-8">
      {/* Top Hero Section (E-Summit / CaeliFi Signature Design) */}
      <CommandCenterHero
        totalInspected={stats?.total_inspections}
        passRate={stats?.pass_rate_pct}
        activeBatch="HEAT-26A-1042"
      />

      {/* KPI Cards Row */}
      <KPICards stats={stats} />

      {/* Main Operational Split: Live Camera HUD & Recent Inspections Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Camera Viewport (7 Cols) */}
        <div className="lg:col-span-7">
          <LiveCameraOverlay currentInspection={currentInspection} isLoading={loading} />
        </div>

        {/* Live Stream Recent Inspections (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-2xl backdrop-blur-xl">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#ED1C27] animate-pulse" />
                <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
                  Live Billet Stream (Real-Time)
                </h3>
              </div>
              <button
                onClick={handleTriggerCycle}
                disabled={triggering}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ED1C27] hover:bg-[#ff2a37] text-white text-[10px] font-mono font-bold shadow-[0_0_12px_rgba(237,28,39,0.4)] disabled:opacity-60 transition-all"
              >
                <Zap className={`w-3 h-3 ${triggering ? "animate-spin" : ""}`} />
                <span>{triggering ? "INSPECTING..." : "TRIGGER BILLET"}</span>
              </button>
            </div>

            <div className="divide-y divide-white/5">
              {recentInspections.length === 0 ? (
                <div className="text-center py-10 text-xs font-mono text-white/40">
                  No inspection events recorded yet.
                </div>
              ) : (
                recentInspections.map((ins) => (
                  <Link
                    key={ins.id}
                    href={`/inspections/${ins.id}`}
                    className="py-3 px-3 -mx-2 rounded-xl hover:bg-white/[0.04] flex items-center justify-between transition-all block group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white font-mono group-hover:text-[#ED1C27] transition-colors">
                          {ins.billet_id}
                        </span>
                        <span className="text-[10px] text-white/50 font-mono">
                          {ins.heat_number}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/40 font-mono">
                        L: {ins.length_mm} mm • Defects: {ins.defect_count} • {ins.processing_latency_ms} ms
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={ins.status} size="sm" />
                      <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/80 transition-colors" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="pt-3.5 mt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/40">
            <Link
              href="/inspections"
              className="text-xs text-[#ED1C27] hover:text-[#ff4d56] flex items-center gap-1 font-bold"
            >
              <span>View All Inspection Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-emerald-400 font-bold">SHA-256 Chained</span>
          </div>
        </div>
      </div>

      {/* Trend Visualizations */}
      <TrendCharts stats={stats} />
    </div>
  );
}
