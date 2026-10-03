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
  Sliders,
  Send,
  Radio,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ED1C27]/15 border border-[#ED1C27]/40 text-xs text-white font-mono mb-2">
            <Radio className="w-3.5 h-3.5 text-[#ED1C27] animate-pulse" />
            <span>REAL-TIME IN-LINE STATION #1</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>Live Optical Inspection Console</span>
          </h1>
          <p className="text-xs text-white/50 mt-1">
            5-Camera 4K Rig • Sub-millimeter Dimensional Metrology • Multi-Scale Crack Segmentation
          </p>
        </div>

        {currentInspection && (
          <div className="flex items-center gap-3 bg-[#0a0a0a] border border-white/10 px-4 py-2 rounded-2xl shadow-xl">
            <div className="text-xs font-mono">
              <span className="text-white/40">Current Billet: </span>
              <span className="text-white font-bold">{currentInspection.billet_id}</span>
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
        <div className="lg:col-span-4 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6 backdrop-blur-xl">
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Sliders className="w-4 h-4 text-[#ED1C27]" />
              <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
                Simulation & Manual Trigger Bench
              </h3>
            </div>

            <form onSubmit={handleManualTrigger} className="space-y-4 text-xs">
              {/* Scenario Preset */}
              <div className="space-y-1.5">
                <label className="text-white/70 font-semibold block font-mono">Defect / Quality Scenario</label>
                <select
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-[#ED1C27] focus:ring-1 focus:ring-[#ED1C27] outline-none transition-all"
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
              <div className="space-y-1.5">
                <label className="text-white/70 font-semibold block font-mono">Heat Number</label>
                <input
                  type="text"
                  value={customHeat}
                  onChange={(e) => setCustomHeat(e.target.value)}
                  placeholder="e.g. 26A-1042"
                  className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-[#ED1C27] focus:ring-1 focus:ring-[#ED1C27] outline-none transition-all"
                />
              </div>

              {/* Billet ID */}
              <div className="space-y-1.5">
                <label className="text-white/70 font-semibold block font-mono">Billet ID (Optional)</label>
                <input
                  type="text"
                  value={customBillet}
                  onChange={(e) => setCustomBillet(e.target.value)}
                  placeholder="Auto-generated if empty"
                  className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-[#ED1C27] focus:ring-1 focus:ring-[#ED1C27] outline-none transition-all"
                />
              </div>

              {/* Simulated Length */}
              <div className="space-y-1.5">
                <label className="text-white/70 font-semibold block font-mono">Nominal Length (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={customLength}
                  onChange={(e) => setCustomLength(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-[#ED1C27] focus:ring-1 focus:ring-[#ED1C27] outline-none transition-all"
                />
                <div className="text-[10px] text-white/40 font-mono">
                  Tolerance standard: 5800.0 – 6200.0 mm
                </div>
              </div>

              <button
                type="submit"
                disabled={isTriggering}
                className="w-full py-3 rounded-xl bg-[#ED1C27] hover:bg-[#ff2a37] text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(237,28,39,0.4)] disabled:opacity-50 mt-3 transition-all active:scale-95"
              >
                <Zap className={`w-4 h-4 ${isTriggering ? "animate-spin" : ""}`} />
                <span>{isTriggering ? "Executing Pipeline..." : "Execute Inspection Pass"}</span>
              </button>
            </form>
          </div>

          <div className="p-4 bg-black/60 border border-white/10 rounded-xl text-[11px] font-mono text-white/50 space-y-1.5">
            <div className="text-white font-bold text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              PIPELINE WORKFLOW:
            </div>
            <div>• Optical Grab &rarr; Edge Metrology ($\le \pm 1.0\%$)</div>
            <div>• CLAHE Tiled 256px Crack Segmentation</div>
            <div>• OCR Stencil Regex Extraction</div>
            <div>• SHA-256 Immutable Audit Chaining</div>
          </div>
        </div>
      </div>

      {/* Dimensional Metrology & Defect Analysis Panels */}
      {currentInspection && (
        <div className="space-y-8">
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
