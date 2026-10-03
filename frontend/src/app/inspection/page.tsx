"use client";

import React, { useState, useEffect } from "react";
import {
  triggerSingleInspection,
  fetchInspections,
  getWsUrl,
} from "@/lib/api";
import { InspectionViewport } from "@/components/inspection/InspectionViewport";
import { DimensionalTable } from "@/components/inspection/DimensionalTable";
import { DefectMapViewer } from "@/components/inspection/DefectMapViewer";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  ScanEye,
  Play,
  Sliders,
  RotateCcw,
  Zap,
} from "lucide-react";

export default function LiveInspectionPage() {
  const [currentInspection, setCurrentInspection] = useState<any>(null);
  const [scenario, setScenario] = useState<string>("NORMAL");
  const [customHeat, setCustomHeat] = useState<string>("26A-1042");
  const [customBillet, setCustomBillet] = useState<string>("");
  const [customLength, setCustomLength] = useState<string>("6002");
  const [isTriggering, setIsTriggering] = useState<boolean>(false);

  useEffect(() => {
    fetchInspections({ limit: 1 }).then((res) => {
      if (res.length > 0) setCurrentInspection(res[0]);
    });

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(getWsUrl("/ws/inspection"));
      ws.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === "INSPECTION_COMPLETED") {
            setCurrentInspection(payload.data);
          }
        } catch (err) {
          console.error(err);
        }
      };
    } catch (err) {
      console.error(err);
    }
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleManualTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTriggering(true);
    try {
      const lenVal = parseFloat(customLength);
      const res = await triggerSingleInspection({
        billet_id: customBillet.trim() || undefined,
        heat_number: customHeat.trim() || undefined,
        scenario,
        simulated_length: !isNaN(lenVal) ? lenVal : undefined,
        force_ocr_fail: scenario === "OCR_FAILURE",
      });
      if (res?.inspection) {
        setCurrentInspection(res.inspection);
      }
    } catch (err) {
      console.error("Trigger error", err);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleReset = () => {
    setScenario("NORMAL");
    setCustomHeat("26A-1042");
    setCustomBillet("");
    setCustomLength("6002");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 uppercase tracking-wider mb-1">
            <span>LIVE INSPECTION</span>
            <span>·</span>
            <span className="text-[#ED1C27] font-semibold">LINE 01 · OPTICAL STATION</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Live Optical Inspection Console
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            5-Camera 4K Rig · Sub-millimeter Dimensional Metrology · Multi-Scale Crack Segmentation
          </p>
        </div>

        {currentInspection && (
          <div className="flex items-center gap-3 bg-[#0c0e14] border border-white/[0.08] px-3.5 py-2 rounded-lg font-mono text-xs">
            <span className="text-slate-500">CURRENT BILLET:</span>
            <span className="text-white font-bold">{currentInspection.billet_id}</span>
            <StatusBadge status={currentInspection.status} size="sm" />
          </div>
        )}
      </div>

      {/* Main Grid: Left Viewport & Right Control/Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Machine-Vision Viewport */}
        <div className="lg:col-span-7">
          <InspectionViewport currentInspection={currentInspection} />
        </div>

        {/* Right 5 Cols: Billet Metadata & Inspection Control */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Billet Identity & Analysis Panel */}
          {currentInspection && (
            <div className="bg-[#0c0e14] border border-white/[0.08] rounded-xl p-5 space-y-4 font-mono text-xs">
              {/* Section 1: Identity */}
              <div>
                <div className="text-[10px] text-slate-500 font-bold tracking-wider uppercase border-b border-white/[0.06] pb-1.5 mb-2">
                  BILLET IDENTITY
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                  <div>
                    <span className="text-slate-500">ID: </span>
                    <span className="text-white font-bold">{currentInspection.billet_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">HEAT: </span>
                    <span className="text-slate-200">{currentInspection.heat_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">BATCH: </span>
                    <span className="text-slate-200">{currentInspection.batch_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">TIMESTAMP: </span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(currentInspection.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Dimensional Check */}
              <div>
                <div className="text-[10px] text-slate-500 font-bold tracking-wider uppercase border-b border-white/[0.06] pb-1.5 mb-2">
                  DIMENSIONAL CHECK
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 bg-[#08090d] border border-white/[0.05] rounded">
                    <span className="text-slate-500 block text-[9px]">LENGTH (L)</span>
                    <span className="text-white font-bold">{currentInspection.length_mm} mm</span>
                  </div>
                  <div className="p-2 bg-[#08090d] border border-white/[0.05] rounded">
                    <span className="text-slate-500 block text-[9px]">WIDTH (W)</span>
                    <span className="text-slate-200 font-bold">{currentInspection.width_mm} mm</span>
                  </div>
                  <div className="p-2 bg-[#08090d] border border-white/[0.05] rounded">
                    <span className="text-slate-500 block text-[9px]">HEIGHT (H)</span>
                    <span className="text-slate-200 font-bold">{currentInspection.height_mm} mm</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Surface Analysis */}
              <div>
                <div className="text-[10px] text-slate-500 font-bold tracking-wider uppercase border-b border-white/[0.06] pb-1.5 mb-2">
                  SURFACE ANALYSIS
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-slate-500">DEFECTS: </span>
                    <span className={currentInspection.defect_count > 0 ? "text-[#ED1C27] font-bold" : "text-emerald-400 font-bold"}>
                      {currentInspection.defect_count} DETECTED
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">OCR CONF: </span>
                    <span className="text-slate-200 font-bold">
                      {Math.round((currentInspection.ocr_confidence || 0.984) * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">VERDICT: </span>
                    <span className="font-bold text-white">{currentInspection.status}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Inspection Control Bench */}
          <div className="bg-[#0c0e14] border border-white/[0.08] rounded-xl p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="font-bold text-xs text-white uppercase tracking-wider">
                INSPECTION CONTROL
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                SIMULATION MODE
              </span>
            </div>

            <form onSubmit={handleManualTrigger} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-400 text-[11px] block">Inspection Scenario</label>
                <select
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  className="w-full bg-[#08090d] border border-white/10 rounded px-2.5 py-1.5 text-white font-mono focus:border-[#ED1C27] outline-none text-xs"
                >
                  <option value="NORMAL">NORMAL (Clean Billet - PASS)</option>
                  <option value="MINOR_CRACK">MINOR CRACK (Hairline &lt;5mm - PASS)</option>
                  <option value="MAJOR_CRACK">MAJOR CRACK (Longitudinal &gt;20mm - REWORK)</option>
                  <option value="DIMENSION_OUT_OF_TOLERANCE">DIMENSION OUT OF TOLERANCE (6245mm - FAIL)</option>
                  <option value="MULTIPLE_DEFECTS">MULTIPLE DEFECTS (Scabs + Cracks - REWORK)</option>
                  <option value="OCR_FAILURE">OCR LOW CONFIDENCE (NEEDS REVIEW)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] block">Heat Number</label>
                  <input
                    type="text"
                    value={customHeat}
                    onChange={(e) => setCustomHeat(e.target.value)}
                    placeholder="26A-1042"
                    className="w-full bg-[#08090d] border border-white/10 rounded px-2.5 py-1.5 text-white font-mono focus:border-[#ED1C27] outline-none text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] block">Nominal Length (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customLength}
                    onChange={(e) => setCustomLength(e.target.value)}
                    className="w-full bg-[#08090d] border border-white/10 rounded px-2.5 py-1.5 text-white font-mono focus:border-[#ED1C27] outline-none text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isTriggering}
                  className="flex-1 py-2 rounded bg-[#ED1C27] hover:bg-[#ff2a37] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 ${isTriggering ? "animate-spin" : ""}`} />
                  <span>{isTriggering ? "PROCESSING..." : "RUN INSPECTION"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-2 rounded bg-white/[0.05] hover:bg-white/[0.09] text-slate-300 border border-white/10 text-xs flex items-center gap-1 transition-colors"
                  title="Reset Parameters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Lower Panels: Detailed Dimensional Table & Defect Map */}
      {currentInspection && (
        <div className="space-y-6">
          <DimensionalTable
            dimensions={currentInspection.dimensions || []}
            length_mm={currentInspection.length_mm}
            width_mm={currentInspection.width_mm}
            height_mm={currentInspection.height_mm}
            status={currentInspection.dimension_status || "PASS"}
          />

          <DefectMapViewer
            defects={currentInspection.defects || []}
            evidenceImageUrl={currentInspection.evidence_image}
          />
        </div>
      )}
    </div>
  );
}
