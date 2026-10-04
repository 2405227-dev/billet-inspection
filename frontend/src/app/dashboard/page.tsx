"use client";

import React, { useState, useEffect, useCallback } from "react";
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

const INITIAL_QUEUE_DATA: InspectionSummary[] = [
  {
    id: "INS-2026-000028",
    billet_id: "BILLET-06127",
    heat_number: "26A-1042",
    batch_id: "BATCH-104",
    timestamp: new Date(Date.now() - 32000).toISOString(),
    status: "PASS",
    length_mm: 6002.1,
    width_mm: 150.2,
    height_mm: 149.8,
    defect_count: 0,
    ocr_confidence: 0.994,
    processing_latency_ms: 142.1,
    decision_reason: "All dimensional, surface, and traceability criteria met.",
    audit_hash: "7f8b9c2a3d4e5f60718293a4b5c6d7e8",
    review_status: "NOT_REQUIRED",
  },
  {
    id: "INS-2026-000027",
    billet_id: "BILLET-06126",
    heat_number: "26A-1042",
    batch_id: "BATCH-104",
    timestamp: new Date(Date.now() - 68000).toISOString(),
    status: "PASS",
    length_mm: 5998.4,
    width_mm: 150.0,
    height_mm: 150.1,
    defect_count: 1,
    ocr_confidence: 0.992,
    processing_latency_ms: 138.4,
    decision_reason: "Minor hairline crack within permissible tolerance limit.",
    audit_hash: "a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8",
    review_status: "NOT_REQUIRED",
  },
  {
    id: "INS-2026-000026",
    billet_id: "BILLET-06125",
    heat_number: "26A-1042",
    batch_id: "BATCH-104",
    timestamp: new Date(Date.now() - 110000).toISOString(),
    status: "REWORK",
    length_mm: 6001.2,
    width_mm: 150.1,
    height_mm: 150.3,
    defect_count: 1,
    ocr_confidence: 0.988,
    processing_latency_ms: 155.0,
    decision_reason: "Longitudinal crack flagged for surface conditioning / grinding.",
    audit_hash: "1234abcd5678ef901234abcd5678ef90",
    review_status: "NOT_REQUIRED",
  },
  {
    id: "INS-2026-000025",
    billet_id: "BILLET-06124",
    heat_number: "26A-1042",
    batch_id: "BATCH-104",
    timestamp: new Date(Date.now() - 152000).toISOString(),
    status: "FAIL",
    length_mm: 6245.0,
    width_mm: 150.4,
    height_mm: 149.9,
    defect_count: 0,
    ocr_confidence: 0.995,
    processing_latency_ms: 162.3,
    decision_reason: "Length (6245.0 mm) exceeds IS 2830 acceptance envelope.",
    audit_hash: "9876fedc5432ba109876fedc5432ba10",
    review_status: "NOT_REQUIRED",
  },
  {
    id: "INS-2026-000024",
    billet_id: "BILLET-06123",
    heat_number: "26A-1042",
    batch_id: "BATCH-104",
    timestamp: new Date(Date.now() - 198000).toISOString(),
    status: "REWORK",
    length_mm: 6003.5,
    width_mm: 150.0,
    height_mm: 150.0,
    defect_count: 1,
    ocr_confidence: 0.991,
    processing_latency_ms: 148.7,
    decision_reason: "Transverse surface fracture marked for scarfing/rework.",
    audit_hash: "bb88cc22dd44ee66ff00112233445566",
    review_status: "NOT_REQUIRED",
  },
  {
    id: "INS-2026-000023",
    billet_id: "BILLET-06122",
    heat_number: "26A-1042",
    batch_id: "BATCH-104",
    timestamp: new Date(Date.now() - 245000).toISOString(),
    status: "REWORK",
    length_mm: 5999.0,
    width_mm: 149.9,
    height_mm: 150.2,
    defect_count: 1,
    ocr_confidence: 0.989,
    processing_latency_ms: 144.2,
    decision_reason: "Slag surface inclusion detected on top face.",
    audit_hash: "ee55aa33ff77bb11cc99dd33ee77ff11",
    review_status: "NOT_REQUIRED",
  },
  {
    id: "INS-2026-000022",
    billet_id: "BILLET-06121",
    heat_number: "26A-1042",
    batch_id: "BATCH-104",
    timestamp: new Date(Date.now() - 295000).toISOString(),
    status: "PASS",
    length_mm: 6000.8,
    width_mm: 150.2,
    height_mm: 150.1,
    defect_count: 0,
    ocr_confidence: 0.996,
    processing_latency_ms: 139.6,
    decision_reason: "All dimensional, surface, and traceability criteria met.",
    audit_hash: "332211aa00998877665544332211aa00",
    review_status: "NOT_REQUIRED",
  },
  {
    id: "INS-2026-000021",
    billet_id: "BILLET-06120",
    heat_number: "26A-1042",
    batch_id: "BATCH-104",
    timestamp: new Date(Date.now() - 350000).toISOString(),
    status: "PASS",
    length_mm: 6002.5,
    width_mm: 150.1,
    height_mm: 149.8,
    defect_count: 0,
    ocr_confidence: 0.994,
    processing_latency_ms: 141.0,
    decision_reason: "All dimensional, surface, and traceability criteria met.",
    audit_hash: "554433221100ffeeddccbbaa99887766",
    review_status: "NOT_REQUIRED",
  },
];

const INITIAL_STATS: StatsOverview = {
  total_inspections: 1284,
  pass_count: 1215,
  fail_count: 22,
  rework_count: 41,
  review_count: 6,
  pass_rate_pct: 94.6,
  active_alerts_count: 0,
  avg_latency_ms: 142.5,
  ocr_success_rate_pct: 99.4,
  total_defects_detected: 69,
  defect_type_breakdown: {
    longitudinal_crack: 24,
    transverse_crack: 16,
    surface_inclusion: 14,
    scab: 8,
    roll_mark: 5,
    hairline_crack: 2,
  },
  status_trend: [
    { id: "INS-000021", timestamp: "18:20:00", status: "PASS", latency_ms: 142, defect_count: 0 },
    { id: "INS-000022", timestamp: "18:22:00", status: "PASS", latency_ms: 138, defect_count: 0 },
    { id: "INS-000023", timestamp: "18:24:00", status: "REWORK", latency_ms: 155, defect_count: 1 },
    { id: "INS-000024", timestamp: "18:26:00", status: "REWORK", latency_ms: 148, defect_count: 1 },
    { id: "INS-000025", timestamp: "18:28:00", status: "FAIL", latency_ms: 162, defect_count: 0 },
    { id: "INS-000026", timestamp: "18:30:00", status: "REWORK", latency_ms: 150, defect_count: 1 },
    { id: "INS-000027", timestamp: "18:32:00", status: "PASS", latency_ms: 140, defect_count: 1 },
    { id: "INS-000028", timestamp: "18:34:00", status: "PASS", latency_ms: 139, defect_count: 0 },
  ],
};

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsOverview>(INITIAL_STATS);
  const [recentInspections, setRecentInspections] = useState<InspectionSummary[]>(INITIAL_QUEUE_DATA);
  const [currentInspection, setCurrentInspection] = useState<any>(INITIAL_QUEUE_DATA[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [statsData, listData] = await Promise.all([
        fetchStatsOverview().catch(() => null),
        fetchInspections({ limit: 12 }).catch(() => []),
      ]);

      if (statsData && statsData.total_inspections > 0) {
        setStats(statsData);
      }

      if (listData && listData.length > 0) {
        // Merge fetched records with baseline to ensure full queue representation
        const existingIds = new Set(listData.map((i) => i.id));
        const merged = [...listData, ...INITIAL_QUEUE_DATA.filter((i) => !existingIds.has(i.id))];
        setRecentInspections(merged.slice(0, 8));
        if (!currentInspection) {
          setCurrentInspection(listData[0]);
        }
      }
    } catch (err) {
      console.error("Dashboard load error", err);
    }
  };

  const handleNewInspection = useCallback((newIns: any) => {
    if (!newIns || !newIns.id) return;
    setCurrentInspection(newIns);

    // 1. Update Inspection Queue (smoothly prepend latest recorded billet)
    setRecentInspections((prev) => {
      const filtered = prev.filter((item) => item.id !== newIns.id && item.billet_id !== newIns.billet_id);
      return [newIns, ...filtered.slice(0, 7)];
    });

    // 2. Real-Time Chart & Telemetry Mutation at 60 FPS
    setStats((prev) => {
      const base = prev || INITIAL_STATS;
      const total = base.total_inspections + 1;
      const isPass = newIns.status === "PASS";
      const isRework = newIns.status === "REWORK";
      const isFail = newIns.status === "FAIL";
      const isReview = newIns.status === "NEEDS_REVIEW";

      const pass_count = base.pass_count + (isPass ? 1 : 0);
      const rework_count = base.rework_count + (isRework ? 1 : 0);
      const fail_count = base.fail_count + (isFail ? 1 : 0);
      const review_count = base.review_count + (isReview ? 1 : 0);

      // Mutate defect breakdown counts for Surface Defect bar chart
      const breakdown = { ...(base.defect_type_breakdown || {}) };
      let newDefectsCount = 0;
      if (newIns.defects && Array.isArray(newIns.defects) && newIns.defects.length > 0) {
        for (const d of newIns.defects) {
          const dt = d.defect_type || "surface_defect";
          breakdown[dt] = (breakdown[dt] || 0) + 1;
          newDefectsCount++;
        }
      } else if (newIns.defect_count > 0) {
        newDefectsCount = newIns.defect_count;
        breakdown["surface_defect"] = (breakdown["surface_defect"] || 0) + newDefectsCount;
      }

      // Append to latency trend line chart
      const trend = [
        ...(base.status_trend || []).slice(-14),
        {
          id: newIns.id,
          timestamp: new Date(newIns.timestamp || Date.now()).toLocaleTimeString([], { hour12: false }),
          status: newIns.status,
          latency_ms: newIns.processing_latency_ms || 140,
          defect_count: newIns.defect_count || 0,
        },
      ];

      return {
        ...base,
        total_inspections: total,
        pass_count,
        rework_count,
        fail_count,
        review_count,
        pass_rate_pct: +((pass_count / total) * 100).toFixed(1),
        total_defects_detected: base.total_defects_detected + newDefectsCount,
        defect_type_breakdown: breakdown,
        status_trend: trend,
      };
    });

    // 3. Asynchronously sync database snapshot
    fetchStatsOverview().then((s) => {
      if (s) setStats(s);
    }).catch(console.error);
  }, []);

  const handleTriggerCycle = async () => {
    try {
      setIsTriggering(true);
      const res = await triggerSingleInspection({ scenario: "NORMAL" });
      if (res?.inspection) {
        handleNewInspection(res.inspection);
      }
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
          if (payload.type === "INSPECTION_COMPLETED" && payload.data) {
            handleNewInspection(payload.data);
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
  }, [handleNewInspection]);

  const activeHeatText = currentInspection?.heat_number
    ? `HEAT ${currentInspection.heat_number}`
    : "HEAT 26A-1042";

  return (
    <div className="space-y-6">
      {/* Compact Operational Header with Real Industrial Image Backdrop */}
      <CommandCenterHeader
        totalInspected={stats?.total_inspections}
        passRate={stats?.pass_rate_pct}
        activeBatch={activeHeatText}
        onTrigger={handleTriggerCycle}
        isTriggering={isTriggering}
      />

      {/* Horizontal Operational Telemetry Strip */}
      <OperationalTelemetryStrip stats={stats} />

      {/* Main Operational Split: Machine-Vision Viewport & Live Production Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <InspectionViewport
            currentInspection={currentInspection}
            isLoading={loading}
            onInspectionCompleted={handleNewInspection}
          />
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
