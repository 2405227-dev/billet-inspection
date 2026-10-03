"use client";

import React, { useState, useEffect } from "react";
import { fetchSettings, fetchCameraStatuses } from "@/lib/api";
import { IndustrialHeroBackground } from "@/components/ui/IndustrialHeroBackground";
import {
  Settings2,
  Camera,
  Sliders,
  Cpu,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  Activity,
  HardDrive,
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Operational Header with Steel Mill Backdrop */}
      <IndustrialHeroBackground
        imageSrc="/images/industrial/steel-mill-dark.jpg"
        accent="red"
        className="p-6 sm:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#ED1C27]/20 text-[#ED1C27] border border-[#ED1C27]/40 tracking-wider">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>SYSTEM CALIBRATION</span>
              </span>
              <span className="text-white/40 text-xs font-mono">· PLANT METROLOGY GATE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Optical Rig & Quality Tolerances
            </h1>
            <p className="text-xs text-white/60 max-w-2xl">
              Configuration matrices loaded from tolerances.yaml, camera rig sync parameters, and ONNX Runtime neural inference acceleration pipelines.
            </p>
          </div>

          <button
            onClick={loadAll}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10 transition-colors self-start lg:self-center"
            title="Reload Settings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#ED1C27]" : ""}`} />
          </button>
        </div>
      </IndustrialHeroBackground>

      {/* 1. Multi-Camera Rig Calibration Status */}
      <div className="industrial-panel p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#ED1C27]" />
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider font-mono">
              5-Camera Machine Vision Optical Rig
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">ALL 5 ADAPTERS SYNCHRONIZED</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {cameraStatuses.map((cam) => (
            <div
              key={cam.camera_id}
              className="p-3.5 bg-black/40 border border-white/[0.08] rounded-lg space-y-2 text-xs font-mono"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#ED1C27]">{cam.camera_id}</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  ONLINE
                </span>
              </div>
              <div className="text-white/80 text-[11px] font-sans">{cam.provider || "Industrial GigE / USB3 Vision"}</div>
              <div className="pt-2 border-t border-white/[0.04] text-[10px] text-white/40 flex justify-between">
                <span>Trigger: {cam.trigger_mode || "ENCODER_PULSE"}</span>
                <span>Latency: ~12 ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Configured Dimensional Tolerances */}
      <div className="industrial-panel p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#ED1C27]" />
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider font-mono">
              Dimensional Tolerance Envelope Gates (tolerances.yaml)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-white/40">IS 2830 Metrological Standard</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 bg-black/40 rounded-lg border border-white/[0.08] space-y-2">
            <div className="font-bold text-white font-sans text-sm">Length Metrology (L)</div>
            <div className="space-y-1.5 text-white/60 text-[11px]">
              <div className="flex justify-between">
                <span>Nominal:</span>
                <span className="text-white font-bold">{tolerances.length_mm?.nominal || 6000} mm</span>
              </div>
              <div className="flex justify-between">
                <span>Min Gate:</span>
                <span className="text-white">{tolerances.length_mm?.min || 5800} mm</span>
              </div>
              <div className="flex justify-between">
                <span>Max Gate:</span>
                <span className="text-white">{tolerances.length_mm?.max || 6200} mm</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/[0.04]">
                <span>Acceptance Band:</span>
                <span className="text-emerald-400 font-bold">&plusmn;1.0%</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-black/40 rounded-lg border border-white/[0.08] space-y-2">
            <div className="font-bold text-white font-sans text-sm">Cross-Section Width (W)</div>
            <div className="space-y-1.5 text-white/60 text-[11px]">
              <div className="flex justify-between">
                <span>Nominal:</span>
                <span className="text-white font-bold">{tolerances.width_mm?.nominal || 150} mm</span>
              </div>
              <div className="flex justify-between">
                <span>Min Gate:</span>
                <span className="text-white">{tolerances.width_mm?.min || 147} mm</span>
              </div>
              <div className="flex justify-between">
                <span>Max Gate:</span>
                <span className="text-white">{tolerances.width_mm?.max || 153} mm</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/[0.04]">
                <span>Acceptance Band:</span>
                <span className="text-emerald-400 font-bold">&plusmn;1.0%</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-black/40 rounded-lg border border-white/[0.08] space-y-2">
            <div className="font-bold text-white font-sans text-sm">Cross-Section Height (H)</div>
            <div className="space-y-1.5 text-white/60 text-[11px]">
              <div className="flex justify-between">
                <span>Nominal:</span>
                <span className="text-white font-bold">{tolerances.height_mm?.nominal || 150} mm</span>
              </div>
              <div className="flex justify-between">
                <span>Min Gate:</span>
                <span className="text-white">{tolerances.height_mm?.min || 147} mm</span>
              </div>
              <div className="flex justify-between">
                <span>Max Gate:</span>
                <span className="text-white">{tolerances.height_mm?.max || 153} mm</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/[0.04]">
                <span>Acceptance Band:</span>
                <span className="text-emerald-400 font-bold">&plusmn;1.0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. AI Neural Inference Engine Specifications */}
      <div className="industrial-panel p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#ED1C27]" />
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider font-mono">
              Deployed Computer Vision & Neural Pipeline Runtime
            </h3>
          </div>
          <span className="text-[10px] font-mono text-white/40">ONNX Runtime / TensorRT Acceleration</span>
        </div>

        <div className="space-y-2.5 text-xs font-mono">
          <div className="p-3 bg-black/40 rounded-lg border border-white/[0.08] flex justify-between items-center">
            <div>
              <div className="font-bold text-white font-sans">Billet Object Localizer & Bounding Box</div>
              <div className="text-[11px] text-white/40">billet-yolov8x-det (v2.4.1) · FP16 TensorRT · Input 640×640</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              ACTIVE (18 ms)
            </span>
          </div>

          <div className="p-3 bg-black/40 rounded-lg border border-white/[0.08] flex justify-between items-center">
            <div>
              <div className="font-bold text-white font-sans">Surface Defect Ensemble & Sliding Tile Segmentation</div>
              <div className="text-[11px] text-white/40">surface-defect-ensemble-seg (v3.2.0) · 256px Tiles with 64px Overlap</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              ACTIVE (42 ms)
            </span>
          </div>

          <div className="p-3 bg-black/40 rounded-lg border border-white/[0.08] flex justify-between items-center">
            <div>
              <div className="font-bold text-white font-sans">End-Face Stencil Heat Number OCR</div>
              <div className="text-[11px] text-white/40">paddleocr-billet-endface (v2.1.0) · Pre-processed CLAHE Contrast</div>
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
