"use client";

import React, { useState } from "react";
import { getApiUrl } from "@/lib/api";
import { StatusBadge } from "../common/StatusBadge";
import { Camera, RefreshCw, Layers } from "lucide-react";

interface InspectionViewportProps {
  currentInspection: any;
  isLoading?: boolean;
}

export const InspectionViewport: React.FC<InspectionViewportProps> = ({
  currentInspection,
  isLoading = false,
}) => {
  const [selectedCam, setSelectedCam] = useState<string>("CAM-01");
  const [showMasks, setShowMasks] = useState<boolean>(true);
  const [showHUD, setShowHUD] = useState<boolean>(true);

  const cameras = [
    { id: "CAM-01", label: "01 TOP" },
    { id: "CAM-02", label: "02 BTM" },
    { id: "CAM-03", label: "03 LFT" },
    { id: "CAM-04", label: "04 RGT" },
    { id: "CAM-05", label: "05 END" },
  ];

  const evidenceUrl = currentInspection?.evidence_image
    ? getApiUrl(currentInspection.evidence_image)
    : "/images/industrial/hot-steel-billet.jpg";

  return (
    <div className="bg-[#0c0e14] border border-white/[0.08] rounded-xl overflow-hidden flex flex-col shadow-lg">
      {/* Top Header with Compact Camera Selector */}
      <div className="px-4 py-2.5 bg-[#090a0e] border-b border-white/[0.08] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-bold text-slate-200 font-mono">
            OPTICAL RIG #1
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            4K PREGIUS · 60 FPS
          </span>
        </div>

        {/* Compact Camera Selector */}
        <div className="flex items-center gap-1 font-mono text-[11px]">
          {cameras.map((c) => {
            const isSelected = selectedCam === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCam(c.id)}
                className={`px-2.5 py-1 rounded transition-colors relative flex items-center gap-1.5 ${
                  isSelected
                    ? "text-white font-bold bg-white/[0.06]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-[#ED1C27]" : "bg-slate-600"}`} />
                <span>{c.label}</span>
                {isSelected && (
                  <span className="absolute bottom-0 left-1 right-1 h-[2px] bg-[#ED1C27] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Overlay Toggles */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <button
            onClick={() => setShowMasks(!showMasks)}
            className={`px-2 py-0.5 rounded border transition-colors ${
              showMasks
                ? "bg-white/10 text-white border-white/20 font-bold"
                : "text-slate-500 border-white/5"
            }`}
          >
            MASKS: {showMasks ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => setShowHUD(!showHUD)}
            className={`px-2 py-0.5 rounded border transition-colors ${
              showHUD
                ? "bg-white/10 text-white border-white/20 font-bold"
                : "text-slate-500 border-white/5"
            }`}
          >
            HUD: {showHUD ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Camera Viewport Canvas */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group select-none">
        {evidenceUrl ? (
          <img
            src={evidenceUrl}
            alt="Billet Inspection Viewport"
            className="w-full h-full object-cover filter contrast-110 brightness-95"
          />
        ) : (
          <div className="text-center p-8 space-y-2 font-mono text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-[#ED1C27] mx-auto" />
            <div>ACQUIRING FRAME FROM CONVEYOR ENCODER...</div>
          </div>
        )}

        {/* Subtle Laser Scanline Sweep */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#ED1C27]/90 to-transparent shadow-[0_0_10px_#ED1C27] animate-laser-beam" />

        {/* Engineering Crosshair & Precision Reticle */}
        <div className="pointer-events-none absolute inset-3 border border-white/[0.08] rounded flex flex-col justify-between p-3 font-mono text-[10px] text-slate-400">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <div>FOV: 1800 × 950 mm · 4K</div>
              <div className="text-slate-500">SCALE: 0.439 mm/px</div>
            </div>
            <div className="text-right space-y-0.5">
              <div>ENCODER: #48102</div>
              <div className="text-slate-500">EXP: 1200 µs</div>
            </div>
          </div>

          {/* Center Crosshair */}
          <div className="self-center flex items-center justify-center relative">
            <div className="w-8 h-[1px] bg-white/20" />
            <div className="h-8 w-[1px] bg-white/20 absolute" />
          </div>

          <div className="flex justify-between items-end text-slate-500">
            <div>CALIB: MATRIX-NIT-2026</div>
            <div>STATUS: CONCORDANT</div>
          </div>
        </div>

        {/* Engineering Overlay Telemetry Tag */}
        {showHUD && currentInspection && (
          <div className="absolute top-4 left-4 bg-[#090b0e]/95 border border-white/[0.12] rounded-lg p-3 backdrop-blur-md shadow-xl text-xs space-y-1.5 font-mono pointer-events-none max-w-xs">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-1.5">
              <span className="font-bold text-white text-xs">
                {currentInspection.billet_id || "BILLET-06128"}
              </span>
              <StatusBadge status={currentInspection.status} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-300">
              <div>
                <span className="text-slate-500">HEAT: </span>
                <span className="text-slate-200 font-bold">{currentInspection.heat_number}</span>
              </div>
              <div>
                <span className="text-slate-500">BATCH: </span>
                <span className="text-slate-200">{currentInspection.batch_id}</span>
              </div>
              <div>
                <span className="text-slate-500">L: </span>
                <span className="text-white font-bold">{currentInspection.length_mm} mm</span>
              </div>
              <div>
                <span className="text-slate-500">W×H: </span>
                <span className="text-slate-200">{currentInspection.width_mm}×{currentInspection.height_mm} mm</span>
              </div>
              <div>
                <span className="text-slate-500">DEFECTS: </span>
                <span className={currentInspection.defect_count > 0 ? "text-[#ED1C27] font-bold" : "text-emerald-400 font-bold"}>
                  {currentInspection.defect_count} Detected
                </span>
              </div>
              <div>
                <span className="text-slate-500">CONF: </span>
                <span className="text-slate-200 font-bold">
                  {Math.round((currentInspection.ocr_confidence || 0.984) * 100)}%
                </span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-white/[0.06] flex justify-between text-[9px] text-slate-400">
              <span>LATENCY: {currentInspection.processing_latency_ms} ms</span>
              <span className="text-slate-400">INFERENCE: PASS</span>
            </div>
          </div>
        )}
      </div>

      {/* Viewport Bottom Bar */}
      <div className="px-4 py-2 bg-[#090a0e] border-t border-white/[0.08] text-[11px] font-mono text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{selectedCam} STREAM ONLINE</span>
        </div>
        <div className="text-slate-500 text-[10px]">
          FRAME #{currentInspection?.id || "001284"} · LATENCY {currentInspection?.processing_latency_ms || 142}ms
        </div>
      </div>
    </div>
  );
};
