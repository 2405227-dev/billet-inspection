"use client";

import React, { useState } from "react";
import { getApiUrl } from "@/lib/api";
import { StatusBadge } from "../common/StatusBadge";
import { Camera, RefreshCw, ZoomIn, Maximize2, ShieldAlert, Radio, ScanLine } from "lucide-react";
import { motion } from "framer-motion";

interface LiveCameraOverlayProps {
  currentInspection: any;
  isLoading?: boolean;
}

export const LiveCameraOverlay: React.FC<LiveCameraOverlayProps> = ({
  currentInspection,
  isLoading = false,
}) => {
  const [selectedCam, setSelectedCam] = useState<string>("CAM-01");
  const [showMasks, setShowMasks] = useState<boolean>(true);
  const [showHUD, setShowHUD] = useState<boolean>(true);

  const cameras = [
    { id: "CAM-01", label: "Top Face 4K Matrix", pos: "TOP" },
    { id: "CAM-02", label: "Bottom Face Scan", pos: "BOTTOM" },
    { id: "CAM-03", label: "Left Flange", pos: "LEFT" },
    { id: "CAM-04", label: "Right Flange", pos: "RIGHT" },
    { id: "CAM-05", label: "End Face Stencil OCR", pos: "END_FACE" },
  ];

  const evidenceUrl = currentInspection?.evidence_image
    ? getApiUrl(currentInspection.evidence_image)
    : null;

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col mb-8 backdrop-blur-xl">
      {/* Camera Feed Top Header */}
      <div className="px-5 py-3.5 bg-black/80 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
            <div className="p-1.5 rounded-lg bg-[#ED1C27]/20 border border-[#ED1C27]/50 text-[#ED1C27]">
              <Camera className="w-4 h-4" />
            </div>
            <span>OPTICAL ACQUISITION STATION</span>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.06] text-white/70 border border-white/10">
            SONY PREGIUS 4K CMOS • 60 FPS
          </span>
        </div>

        {/* Camera Selector Tabs */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-full border border-white/10">
          {cameras.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCam(c.id)}
              className={`px-3 py-1 text-xs font-mono font-bold rounded-full transition-all ${
                selectedCam === c.id
                  ? "bg-[#ED1C27] text-white shadow-[0_0_12px_#ED1C27]"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {c.id}
            </button>
          ))}
        </div>

        {/* Display Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMasks(!showMasks)}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-full border transition-all ${
              showMasks
                ? "bg-[#ED1C27]/20 text-white border-[#ED1C27]/50 shadow-[0_0_10px_rgba(237,28,39,0.3)]"
                : "bg-white/5 text-white/40 border-white/10"
            }`}
          >
            MASKS: {showMasks ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => setShowHUD(!showHUD)}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-full border transition-all ${
              showHUD
                ? "bg-white/10 text-white border-white/20"
                : "bg-black text-white/30 border-white/5"
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
            alt="Billet Inspection Feed"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-center p-8 space-y-3">
            <RefreshCw className="w-8 h-8 text-[#ED1C27] animate-spin mx-auto" />
            <div className="text-xs font-mono text-white/50 tracking-wider">
              CONNECTING TO GIGE 4K CAM FEED...
            </div>
          </div>
        )}

        {/* Animated Laser Sweep Line (E-Summit Red) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#ED1C27] to-transparent shadow-[0_0_15px_#ED1C27] animate-laser" />

        {/* Live Calibration Reticle Overlay */}
        <div className="absolute inset-0 pointer-events-none border border-white/10 m-4 rounded-xl flex flex-col justify-between p-4">
          <div className="flex justify-between items-start text-[10px] font-mono text-[#ED1C27]/90 font-bold">
            <div>
              <div>POS: [X: 0.00 mm, Y: 0.00 mm]</div>
              <div>FOV: 1800 × 950 mm (4K ULTRA HD)</div>
            </div>
            <div className="text-right">
              <div>TRIGGER: ENCODER_SYNC #42</div>
              <div>SCALE: 0.439 mm/px</div>
            </div>
          </div>

          {/* Center Crosshair */}
          <div className="self-center flex items-center justify-center relative">
            <div className="w-12 h-[1px] bg-[#ED1C27]/60" />
            <div className="h-12 w-[1px] bg-[#ED1C27]/60 absolute" />
            <div className="w-4 h-4 rounded-full border border-[#ED1C27]/40 absolute animate-ping" />
          </div>

          <div className="flex justify-between items-end text-[10px] font-mono text-white/40">
            <div>CALIBRATION: MATRIX-NIT-2026-v4.2</div>
            <div>EXP: 1200 µs | GAIN: 4.5 dB</div>
          </div>
        </div>

        {/* HUD Telemetry Card Overlay */}
        {showHUD && currentInspection && (
          <div className="absolute top-6 left-6 bg-black/90 border border-white/15 rounded-2xl p-4 backdrop-blur-xl shadow-2xl text-xs space-y-2.5 pointer-events-none max-w-xs">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
              <span className="font-black text-white font-mono text-sm">
                {currentInspection.billet_id || "BILLET"}
              </span>
              <StatusBadge status={currentInspection.status} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-mono text-white/80">
              <div>
                <span className="text-white/40">Heat: </span>
                <span className="text-[#ED1C27] font-bold">{currentInspection.heat_number}</span>
              </div>
              <div>
                <span className="text-white/40">Batch: </span>
                <span>{currentInspection.batch_id}</span>
              </div>
              <div>
                <span className="text-white/40">L: </span>
                <span className="text-white font-bold">{currentInspection.length_mm} mm</span>
              </div>
              <div>
                <span className="text-white/40">W×H: </span>
                <span>{currentInspection.width_mm}×{currentInspection.height_mm} mm</span>
              </div>
              <div>
                <span className="text-white/40">Defects: </span>
                <span className={currentInspection.defect_count > 0 ? "text-[#ED1C27] font-bold" : "text-emerald-400 font-bold"}>
                  {currentInspection.defect_count} Found
                </span>
              </div>
              <div>
                <span className="text-white/40">OCR: </span>
                <span className="text-white font-bold">
                  {Math.round((currentInspection.ocr_confidence || 0) * 100)}%
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-between text-[10px] font-mono text-white/40">
              <span>LATENCY: {currentInspection.processing_latency_ms} ms</span>
              <span className="text-[#ED1C27] font-bold">AI INFERENCE</span>
            </div>
          </div>
        )}
      </div>

      {/* Camera Feed Bottom Bar */}
      <div className="px-5 py-2.5 bg-black/90 border-t border-white/10 text-xs font-mono text-white/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/70">FEED ONLINE: {selectedCam} NADIR MATRIX</span>
        </div>
        <div className="text-white/40">
          <span>FRAME: #{currentInspection?.id || "IDLE"} • LATENCY 142ms</span>
        </div>
      </div>
    </div>
  );
};
