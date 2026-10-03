"use client";

import React, { useState, useEffect } from "react";
import {
  fetchStatsOverview,
  fetchInspections,
  getWsUrl,
  triggerSingleInspection,
} from "@/lib/api";
import { StatsOverview, InspectionSummary } from "@/lib/types";
import { CommandCenterHeader } from "@/components/dashboard/CommandCenterHeader";
import { OperationalTelemetryStrip } from "@/components/dashboard/OperationalTelemetryStrip";
import { InspectionViewport } from "@/components/inspection/InspectionViewport";
import { InspectionQueue } from "@/components/dashboard/InspectionQueue";
import { TrendCharts } from "@/components/dashboard/TrendCharts";

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [recentInspections, setRecentInspections] = useState<InspectionSummary[]>([]);
  const [currentInspection, setCurrentInspection] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);

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
      console.error("Dashboard load error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerCycle = async () => {
    try {
      setIsTriggering(true);
      const res = await triggerSingleInspection({ scenario: "NORMAL" });
      setCurrentInspection(res);
      await loadData();
    } catch (err) {
      console.error("Trigger cycle error", err);
    } finally {
      setIsTriggering(false);
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
    <div className="space-y-6">
      {/* Compact Operational Header with Real Industrial Image Backdrop */}
      <CommandCenterHeader
        totalInspected={stats?.total_inspections}
        passRate={stats?.pass_rate_pct}
        activeBatch="HEAT 26A-1042"
        onTrigger={handleTriggerCycle}
        isTriggering={isTriggering}
      />

      {/* Horizontal Operational Telemetry Strip */}
      <OperationalTelemetryStrip stats={stats} />

      {/* Main Operational Split: Machine-Vision Viewport & Live Production Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <InspectionViewport currentInspection={currentInspection} isLoading={loading} />
        </div>

        <div className="lg:col-span-5">
          <InspectionQueue inspections={recentInspections} />
        </div>
      </div>

      {/* Engineering Trend & Defect Analytics */}
      <TrendCharts stats={stats} />
    </div>
  );
}
