"use client";

import React, { useState } from "react";
import { getApiUrl } from "@/lib/api";
import { StatusBadge } from "../common/StatusBadge";
import { Camera, RefreshCw, ZoomIn, Maximize2, ShieldAlert } from "lucide-react";

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
    { id: "CAM-01", label: "CAM-01 Top Matrix", pos: "TOP" },
    { id: "CAM-02", label: "CAM-02 Bottom Line-Scan", pos: "BOTTOM" },
    { id: "CAM-03", label: "CAM-03 Left Profile", pos: "LEFT" },
    { id: "CAM-04", label: "CAM-04 Right Profile", pos: "RIGHT" },
    { id: "CAM-05", label: "CAM-05 End Face OCR", pos: "END_FACE" },
  ];

  const evidenceUrl = currentInspection?.evidence_image
    ? getApiUrl(currentInspection.evidence_image)
    : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
      {/* Camera Feed Top Header */}
      <div className="px-4 py-3 bg-[#0a0f1d] border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>OPTICAL ACQUISITION STATION</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            SONY PREGIUS 4K CMOS • 60 FPS
          </span>
        </div>

        {/* Camera Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {cameras.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCam(c.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                selectedCam === c.id
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
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
            className={`px-2.5 py-1 text-xs font-mono font-semibold rounded border ${
              showMasks
                ? "bg-cyan-950 text-cyan-300 border-cyan-700"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            MASKS: {showMasks ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => setShowHUD(!showHUD)}
            className={`px-2.5 py-1 text-xs font-mono font-semibold rounded border ${
              showHUD
                ? "bg-slate-800 text-slate-200 border-slate-700"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            HUD: {showHUD ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Camera Viewport Canvas */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden scanline group">
        {evidenceUrl ? (
          <img
            src={evidenceUrl}
            alt="Billet Inspection Feed"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-center p-8 space-y-3">
            <RefreshCw className="w-8 h-8 text-slate-600 animate-spin mx-auto" />
            <div className="text-sm font-mono text-slate-500">
              WAITING FOR NEXT BILLET ON CONVEYOR LINE...
            </div>
          </div>
        )}

        {/* Live Calibration Reticle Overlay */}
        <div className="absolute inset-0 pointer-events-none border border-cyan-500/20 m-4 rounded-lg flex flex-col justify-between p-3">
          <div className="flex justify-between items-start text-[10px] font-mono text-cyan-400/80">
            <div>
              <div>POS: [X: 0.00 mm, Y: 0.00 mm]</div>
              <div>FOV: 1800 × 950 mm</div>
            </div>
            <div className="text-right">
              <div>TRIGGER: ENCODER_SYNC</div>
              <div>SCALE: 0.439 mm/px</div>
            </div>
          </div>

          {/* Center Crosshair */}
          <div className="self-center flex items-center justify-center">
            <div className="w-8 h-[1px] bg-cyan-400/40" />
            <div className="h-8 w-[1px] bg-cyan-400/40 absolute" />
          </div>

          <div className="flex justify-between items-end text-[10px] font-mono text-cyan-400/80">
            <div>CALIBRATION: CALIB-CAM01-2026-v4</div>
            <div>EXP: 1200 µs | GAIN: 4.5 dB</div>
          </div>
        </div>

        {/* HUD Telemetry Card Overlay */}
        {showHUD && currentInspection && (
          <div className="absolute top-4 left-4 bg-slate-950/90 border border-slate-700/80 rounded-lg p-3 backdrop-blur-md shadow-2xl text-xs space-y-2 pointer-events-none">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5">
              <span className="font-bold text-slate-100 font-mono">
                {currentInspection.billet_id || "BILLET"}
              </span>
              <StatusBadge status={currentInspection.status} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono text-slate-300">
              <div>
                <span className="text-slate-500">Heat: </span>
                <span className="text-cyan-300 font-bold">{currentInspection.heat_number}</span>
              </div>
              <div>
                <span className="text-slate-500">Batch: </span>
                <span>{currentInspection.batch_id}</span>
              </div>
              <div>
                <span className="text-slate-500">L: </span>
                <span className="text-slate-100 font-bold">{currentInspection.length_mm} mm</span>
              </div>
              <div>
                <span className="text-slate-500">W×H: </span>
                <span className="text-slate-100">{currentInspection.width_mm}×{currentInspection.height_mm} mm</span>
              </div>
              <div>
                <span className="text-slate-500">Defects: </span>
                <span className={currentInspection.defect_count > 0 ? "text-rose-400 font-bold" : "text-emerald-400"}>
                  {currentInspection.defect_count} Detected
                </span>
              </div>
              <div>
                <span className="text-slate-500">OCR: </span>
                <span className="text-slate-200 font-bold">
                  {Math.round((currentInspection.ocr_confidence || 0) * 100)}%
                </span>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-800 flex justify-between text-[10px] font-mono text-slate-400">
              <span>LATENCY: {currentInspection.processing_latency_ms} ms</span>
              <span className="text-cyan-400">AI: PASS/FAIL ENGINE</span>
            </div>
          </div>
        )}
      </div>

      {/* Camera Feed Bottom Bar */}
      <div className="px-4 py-2 bg-[#080d17] border-t border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>FEED ONLINE: {selectedCam} NADIR MATRIX</span>
        </div>
        <div>
          <span>FRAME: #{currentInspection?.id || "IDLE"}</span>
        </div>
      </div>
    </div>
  );
};
