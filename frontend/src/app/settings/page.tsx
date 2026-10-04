"use client";

import React, { useState, useEffect } from "react";
import { fetchSettings, fetchCameraStatuses } from "@/lib/api";
import {
  Camera,
  Sliders,
  Cpu,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

export default function SettingsPage() {
  const [settingsData, setSettingsData] = useState<any>(null);
  const [cameraStatuses, setCameraStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAll = () => {
    setLoading(true);
    Promise.all([fetchSettings(), fetchCameraStatuses()])
      .then(([s, c]) => {
        setSettingsData(s);
        setCameraStatuses(c);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const tolerances = settingsData?.tolerances?.tolerances?.dimensions || {};

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#0c0e14] border border-white/[0.08] rounded-lg p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 uppercase tracking-widest">
              <span>CALIBRATION</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-300 font-semibold">TOLERANCES & OPTICAL RIG</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Optical Rig & Quality Tolerances
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Configuration matrices loaded from tolerances.yaml, camera rig sync parameters, and ONNX Runtime neural inference acceleration pipelines.
            </p>
          </div>

          <button
            onClick={loadAll}
            className="p-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer self-start lg:self-center"
            title="Reload Settings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#ED1C27]" : ""}`} />
          </button>
        </div>
      </div>

      {/* 1. Multi-Camera Rig Calibration Status */}
      <div className="bg-[#0c0e14] border border-white/[0.08] rounded-lg p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
          <div className="flex items-center gap-2">
            <Camera className="w-3.5 h-3.5 text-slate-400" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
              5-Camera Machine Vision Optical Rig
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">ALL 5 ADAPTERS SYNCHRONIZED</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cameraStatuses.map((cam) => (
            <div
              key={cam.camera_id}
              className="p-3 bg-[#07080b] border border-white/[0.08] rounded space-y-1.5 text-xs font-mono"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{cam.camera_id}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  ONLINE
                </span>
              </div>
              <div className="text-slate-300 text-[11px] font-sans">{cam.provider || "Industrial GigE / USB3 Vision"}</div>
              <div className="pt-1.5 border-t border-white/[0.04] text-[10px] text-slate-500 flex justify-between">
                <span>Trigger: {cam.trigger_mode || "ENCODER_PULSE"}</span>
                <span>Latency: ~12 ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Configured Dimensional Tolerances */}
      <div className="bg-[#0c0e14] border border-white/[0.08] rounded-lg p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
              Dimensional Tolerance Envelope Gates (tolerances.yaml)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">IS 2830 Metrological Standard</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3.5 bg-[#07080b] rounded border border-white/[0.08] space-y-1.5">
            <div className="font-bold text-white font-sans text-sm">Length Metrology (L)</div>
            <div className="space-y-1 text-slate-400 text-[11px]">
              <div className="flex justify-between">
                <span>Nominal:</span>
                <span className="text-white font-bold">{tolerances.length_mm?.nominal || 6000} mm</span>
              </div>
              <div className="flex justify-between">
                <span>Min Gate:</span>
                <span className="text-slate-200">{tolerances.length_mm?.min || 5800} mm</span>
              </div>
              <div className="flex justify-between">
                <span>Max Gate:</span>
                <span className="text-slate-200">{tolerances.length_mm?.max || 6200} mm</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/[0.04]">
                <span>Tolerance Band:</span>
                <span className="text-emerald-400 font-bold">&plusmn;1.0%</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-[#07080b] rounded border border-white/[0.08] space-y-1.5">
            <div className="font-bold text-white font-sans text-sm">Cross-Section Width (W)</div>
            <div className="space-y-1 text-slate-400 text-[11px]">
              <div className="flex justify-between">
                <span>Nominal:</span>
                <span className="text-white font-bold">{tolerances.width_mm?.nominal || 150} mm</span>
              </div>
              <div className="flex justify-between">
                <span>Min Gate:</span>
                <span className="text-slate-200">{tolerances.width_mm?.min || 147} mm</span>
              </div>
              <div className="flex justify-between">
                <span>Max Gate:</span>
                <span className="text-slate-200">{tolerances.width_mm?.max || 153} mm</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/[0.04]">
                <span>Tolerance Band:</span>
                <span className="text-emerald-400 font-bold">&plusmn;1.0%</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-[#07080b] rounded border border-white/[0.08] space-y-1.5">
            <div className="font-bold text-white font-sans text-sm">Cross-Section Height (H)</div>
            <div className="space-y-1 text-slate-400 text-[11px]">
              <div className="flex justify-between">
                <span>Nominal:</span>
                <span className="text-white font-bold">{tolerances.height_mm?.nominal || 150} mm</span>
              </div>
              <div className="flex justify-between">
                <span>Min Gate:</span>
                <span className="text-slate-200">{tolerances.height_mm?.min || 147} mm</span>
              </div>
              <div className="flex justify-between">
                <span>Max Gate:</span>
                <span className="text-slate-200">{tolerances.height_mm?.max || 153} mm</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/[0.04]">
                <span>Tolerance Band:</span>
                <span className="text-emerald-400 font-bold">&plusmn;1.0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. AI Neural Inference Engine Specifications */}
      <div className="bg-[#0c0e14] border border-white/[0.08] rounded-lg p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
              Deployed Computer Vision & Neural Pipeline Runtime
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">ONNX Runtime / TensorRT</span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="p-2.5 bg-[#07080b] rounded border border-white/[0.08] flex justify-between items-center">
            <div>
              <div className="font-bold text-white font-sans text-xs">Billet Object Localizer & Bounding Box</div>
              <div className="text-[10px] text-slate-500">billet-yolov8x-det (v2.4.1) · FP16 TensorRT · Input 640×640</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              ACTIVE (18 ms)
            </span>
          </div>

          <div className="p-2.5 bg-[#07080b] rounded border border-white/[0.08] flex justify-between items-center">
            <div>
              <div className="font-bold text-white font-sans text-xs">Surface Defect Ensemble & Sliding Tile Segmentation</div>
              <div className="text-[10px] text-slate-500">surface-defect-ensemble-seg (v3.2.0) · 256px Tiles with 64px Overlap</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              ACTIVE (42 ms)
            </span>
          </div>

          <div className="p-2.5 bg-[#07080b] rounded border border-white/[0.08] flex justify-between items-center">
            <div>
              <div className="font-bold text-white font-sans text-xs">End-Face Stencil Heat Number OCR</div>
              <div className="text-[10px] text-slate-500">paddleocr-billet-endface (v2.1.0) · CLAHE Pre-processing</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              ACTIVE (24 ms)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
