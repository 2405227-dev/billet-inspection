"use client";

import React, { useState, useEffect } from "react";
import { fetchSettings, fetchCameraStatuses } from "@/lib/api";
import {
  Settings2,
  Camera,
  Sliders,
  Shield,
  Layers,
  Cpu,
  RefreshCw,
  CheckCircle2,
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
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
        <div className="text-sm font-mono text-slate-400">Loading plant configurations...</div>
      </div>
    );
  }

  const tolerances = settingsData?.tolerances?.tolerances?.dimensions || {};
  const defectRules = settingsData?.tolerances?.tolerances?.defects?.severity_rules || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-cyan-400" />
          <span>Plant Quality Tolerances & Optical Calibration Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Loaded from YAML configurations • Metrological Limits • Multi-Camera Rig Specifications
        </p>
      </div>

      {/* 1. Multi-Camera Rig Calibration Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
              5-Camera Optical Station Rig
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">ALL ADAPTERS SYNCED</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cameraStatuses.map((cam) => (
            <div
              key={cam.camera_id}
              className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5 text-xs font-mono"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400">{cam.camera_id}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  CONNECTED
                </span>
              </div>
              <div className="text-slate-400 text-[11px]">{cam.provider}</div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                Trigger: {cam.trigger_mode || "ENCODER_SYNC"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Dimensional Tolerances */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
              Configured Dimensional Tolerance Gates (tolerances.yaml)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Target Error &le; &plusmn;1.0%</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200">Length Specification</div>
            <div className="space-y-1 text-slate-400 text-[11px]">
              <div>Nominal: <span className="text-slate-200">{tolerances.length_mm?.nominal || 6000} mm</span></div>
              <div>Min Allowed: <span className="text-slate-200">{tolerances.length_mm?.min || 5800} mm</span></div>
              <div>Max Allowed: <span className="text-slate-200">{tolerances.length_mm?.max || 6200} mm</span></div>
              <div>Allowed Error: <span className="text-emerald-400">&plusmn;1.0%</span></div>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200">Width Specification</div>
            <div className="space-y-1 text-slate-400 text-[11px]">
              <div>Nominal: <span className="text-slate-200">{tolerances.width_mm?.nominal || 150} mm</span></div>
              <div>Min Allowed: <span className="text-slate-200">{tolerances.width_mm?.min || 147} mm</span></div>
              <div>Max Allowed: <span className="text-slate-200">{tolerances.width_mm?.max || 153} mm</span></div>
              <div>Allowed Error: <span className="text-emerald-400">&plusmn;1.0%</span></div>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200">Height Specification</div>
            <div className="space-y-1 text-slate-400 text-[11px]">
              <div>Nominal: <span className="text-slate-200">{tolerances.height_mm?.nominal || 150} mm</span></div>
              <div>Min Allowed: <span className="text-slate-200">{tolerances.height_mm?.min || 147} mm</span></div>
              <div>Max Allowed: <span className="text-slate-200">{tolerances.height_mm?.max || 153} mm</span></div>
              <div>Allowed Error: <span className="text-emerald-400">&plusmn;1.0%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. AI Models Deployment Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
              Deployed AI / CV Inference Pipelines
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">ONNX Runtime / TensorRT</span>
        </div>

        <div className="space-y-2.5 text-xs font-mono">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
            <div>
              <div className="font-bold text-slate-200 font-sans">Billet Detector & Localizer</div>
              <div className="text-[11px] text-slate-500">billet-yolov8x-det (v2.4.1) • 640×640</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
              ACTIVE
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
            <div>
              <div className="font-bold text-slate-200 font-sans">Surface Defect Ensemble & Tiling</div>
              <div className="text-[11px] text-slate-500">surface-defect-ensemble-seg (v3.2.0) • 256px Tiles (64px Overlap)</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
              ACTIVE
            </span>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
            <div>
              <div className="font-bold text-slate-200 font-sans">End-Face Stencil OCR</div>
              <div className="text-[11px] text-slate-500">paddleocr-billet-endface (v2.1.0) • Heuristic Fallback</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
              ACTIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
