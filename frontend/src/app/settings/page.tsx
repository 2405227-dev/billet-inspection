"use client";

import React, { useState, useEffect } from "react";
import { fetchSettings, fetchCameraStatuses } from "@/lib/api";
import { GlowCard } from "@/components/ui/GlowCard";
import {
  Settings2,
  Camera,
  Sliders,
  Cpu,
  RefreshCw,
} from "lucide-react";

export default function SettingsPage() {
  const [settingsData, setSettingsData] = useState<any>(null);
  const [cameraStatuses, setCameraStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([fetchSettings(), fetchCameraStatuses()])
      .then(([s, c]) => {
        setSettingsData(s);
        setCameraStatuses(c);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-[#ED1C27] mx-auto" />
        <div className="text-sm font-mono text-white/50">Loading plant configurations...</div>
      </div>
    );
  }

  const tolerances = settingsData?.tolerances?.tolerances?.dimensions || {};

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Settings2 className="w-6 h-6 text-[#ED1C27]" />
          <span>Plant Quality Tolerances & Optical Calibration</span>
        </h1>
        <p className="text-xs text-white/50 mt-1">
          Loaded from YAML configurations • Metrological Limits • Multi-Camera Rig Specifications
        </p>
      </div>

      {/* 1. Multi-Camera Rig Calibration Status */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#ED1C27]" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
              5-Camera Optical Station Rig
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">ALL ADAPTERS SYNCED</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {cameraStatuses.map((cam) => (
            <div
              key={cam.camera_id}
              className="p-4 bg-black/60 border border-white/10 rounded-xl space-y-1.5 text-xs font-mono"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#ED1C27]">{cam.camera_id}</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  CONNECTED
                </span>
              </div>
              <div className="text-white/70 text-[11px]">{cam.provider}</div>
              <div className="text-[10px] text-white/40 pt-1.5 border-t border-white/5">
                Trigger: {cam.trigger_mode || "ENCODER_SYNC"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Dimensional Tolerances */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#ED1C27]" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
              Configured Dimensional Tolerance Gates (tolerances.yaml)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-white/40">Target Error &le; &plusmn;1.0%</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 bg-black/60 rounded-xl border border-white/10 space-y-2">
            <div className="font-bold text-white">Length Specification</div>
            <div className="space-y-1.5 text-white/60 text-[11px]">
              <div>Nominal: <span className="text-white font-bold">{tolerances.length_mm?.nominal || 6000} mm</span></div>
              <div>Min Allowed: <span className="text-white">{tolerances.length_mm?.min || 5800} mm</span></div>
              <div>Max Allowed: <span className="text-white">{tolerances.length_mm?.max || 6200} mm</span></div>
              <div>Allowed Error: <span className="text-emerald-400 font-bold">&plusmn;1.0%</span></div>
            </div>
          </div>

          <div className="p-4 bg-black/60 rounded-xl border border-white/10 space-y-2">
            <div className="font-bold text-white">Width Specification</div>
            <div className="space-y-1.5 text-white/60 text-[11px]">
              <div>Nominal: <span className="text-white font-bold">{tolerances.width_mm?.nominal || 150} mm</span></div>
              <div>Min Allowed: <span className="text-white">{tolerances.width_mm?.min || 147} mm</span></div>
              <div>Max Allowed: <span className="text-white">{tolerances.width_mm?.max || 153} mm</span></div>
              <div>Allowed Error: <span className="text-emerald-400 font-bold">&plusmn;1.0%</span></div>
            </div>
          </div>

          <div className="p-4 bg-black/60 rounded-xl border border-white/10 space-y-2">
            <div className="font-bold text-white">Height Specification</div>
            <div className="space-y-1.5 text-white/60 text-[11px]">
              <div>Nominal: <span className="text-white font-bold">{tolerances.height_mm?.nominal || 150} mm</span></div>
              <div>Min Allowed: <span className="text-white">{tolerances.height_mm?.min || 147} mm</span></div>
              <div>Max Allowed: <span className="text-white">{tolerances.height_mm?.max || 153} mm</span></div>
              <div>Allowed Error: <span className="text-emerald-400 font-bold">&plusmn;1.0%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. AI Models Deployment Matrix */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#ED1C27]" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
              Deployed AI / CV Inference Pipelines
            </h3>
          </div>
          <span className="text-[10px] font-mono text-white/40">ONNX Runtime / TensorRT</span>
        </div>

        <div className="space-y-2.5 text-xs font-mono">
          <div className="p-3.5 bg-black/60 rounded-xl border border-white/10 flex justify-between items-center">
            <div>
              <div className="font-bold text-white font-sans">Billet Detector & Localizer</div>
              <div className="text-[11px] text-white/40">billet-yolov8x-det (v2.4.1) • 640×640</div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
              ACTIVE
            </span>
          </div>

          <div className="p-3.5 bg-black/60 rounded-xl border border-white/10 flex justify-between items-center">
            <div>
              <div className="font-bold text-white font-sans">Surface Defect Ensemble & Tiling</div>
              <div className="text-[11px] text-white/40">surface-defect-ensemble-seg (v3.2.0) • 256px Tiles (64px Overlap)</div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
              ACTIVE
            </span>
          </div>

          <div className="p-3.5 bg-black/60 rounded-xl border border-white/10 flex justify-between items-center">
            <div>
              <div className="font-bold text-white font-sans">End-Face Stencil OCR</div>
              <div className="text-[11px] text-white/40">paddleocr-billet-endface (v2.1.0) • Heuristic Fallback</div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
              ACTIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
