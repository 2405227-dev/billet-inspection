"use client";

import React, { useState, useEffect } from "react";
import {
  triggerSingleInspection,
  fetchInspections,
  getWsUrl,
} from "@/lib/api";
import { LiveCameraOverlay } from "@/components/inspection/LiveCameraOverlay";
import { DimensionalTable } from "@/components/inspection/DimensionalTable";
import { DefectMapViewer } from "@/components/inspection/DefectMapViewer";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  ScanEye,
  Play,
  FastForward,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Send,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ScanEye className="w-5 h-5 text-cyan-400" />
            <span>Live Optical Inspection Station</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            5-Camera Optical Rig • Sub-millimeter Dimensional Metrology • Multi-Scale Crack Segmentation
          </p>
        </div>

        {currentInspection && (
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <div className="text-xs font-mono">
              <span className="text-slate-400">Current Billet: </span>
              <span className="text-slate-100 font-bold">{currentInspection.billet_id}</span>
            </div>
            <StatusBadge status={currentInspection.status} size="sm" />
          </div>
        )}
      </div>

      {/* Main Grid: Camera & Manual Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Camera Overlay */}
        <div className="lg:col-span-8">
          <LiveCameraOverlay currentInspection={currentInspection} />
        </div>

        {/* Right 4 Cols: Manual Simulation & Trigger Control Workbench */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
                Inspection Trigger Test Bench
              </h3>
            </div>

            <form onSubmit={handleManualTrigger} className="space-y-3 text-xs">
              {/* Scenario Preset */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Defect / Quality Scenario</label>
                <select
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 outline-none"
                >
                  <option value="NORMAL">NORMAL (Clean Billet - PASS)</option>
                  <option value="MINOR_CRACK">MINOR CRACK (Hairline &lt;5mm - PASS)</option>
                  <option value="MAJOR_CRACK">MAJOR CRACK (Longitudinal &gt;20mm - REWORK)</option>
                  <option value="DIMENSION_OUT_OF_TOLERANCE">DIMENSION OUT OF TOLERANCE (Length 6245mm - FAIL)</option>
                  <option value="MULTIPLE_DEFECTS">MULTIPLE DEFECTS (Scabs + Cracks - REWORK)</option>
                  <option value="OCR_FAILURE">OCR LOW CONFIDENCE (Unreadable Stencil - NEEDS REVIEW)</option>
                </select>
              </div>

              {/* Heat Number */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Heat Number</label>
                <input
                  type="text"
                  value={customHeat}
                  onChange={(e) => setCustomHeat(e.target.value)}
                  placeholder="e.g. 26A-1042"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 outline-none"
                />
              </div>

              {/* Billet ID */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Billet ID (Optional Override)</label>
                <input
                  type="text"
                  value={customBillet}
                  onChange={(e) => setCustomBillet(e.target.value)}
                  placeholder="Auto-generated if empty"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 outline-none"
                />
              </div>

              {/* Simulated Length */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Nominal Length (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={customLength}
                  onChange={(e) => setCustomLength(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 outline-none"
                />
                <div className="text-[10px] text-slate-500 font-mono">
                  Tolerance band: 5800.0 – 6200.0 mm
                </div>
              </div>

              <button
                type="submit"
                disabled={isTriggering}
                className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 disabled:opacity-50 mt-2"
              >
                <Send className="w-4 h-4" />
                <span>{isTriggering ? "Executing Cycle..." : "Execute Inspection Pass"}</span>
              </button>
            </form>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg text-[11px] font-mono text-slate-400 space-y-1">
            <div className="text-slate-300 font-bold">PIPELINE EXECUTION:</div>
            <div>• Optical Grab &rarr; Edge Metrology</div>
            <div>• CLAHE Tiling &rarr; Skeleton Fissures</div>
            <div>• OCR Stencil Extraction</div>
            <div>• SHA-256 Block Chaining</div>
          </div>
        </div>
      </div>

      {/* Dimensional Metrology & Defect Analysis Panels */}
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
