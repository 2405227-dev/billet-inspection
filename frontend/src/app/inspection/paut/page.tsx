"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Radio,
  AlertTriangle,
  RefreshCw,
  Info,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Layers,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import Link from "next/link";

export interface PAUTIndication {
  billet_id: string;
  encoder_position_mm: number;
  depth_mm: number | null;
  amplitude: number;
  channel: number;
  timestamp: number;
  has_internal_flaw?: boolean;
  threshold_pct?: number;
  indication_type?: string;
}

interface AScanSample {
  depth_mm: number;
  amplitude_pct: number;
  label: string;
}

interface PAUTScanData {
  mode: string;
  billet_id?: string;
  encoder_position_mm: number;
  heat_number: string;
  paut_indication?: PAUTIndication;
  paut_volumetric_scan: {
    sensor_id: string;
    mode_label: string;
    sound_velocity_m_s: number;
    nominal_section_depth_mm: number;
    has_internal_flaw: boolean;
    peak_flaw_amplitude_pct: number;
    flaw_depth_mm: number | null;
    threshold_pct: number;
    indication_type: string;
    paut_indication?: PAUTIndication;
    a_scan_samples: AScanSample[];
  };
  paut_bscan_matrix?: PAUTIndication[];
}

export default function PAUTInspectionPage() {
  const [encoderPos, setEncoderPos] = useState<number>(4200.0);
  const [heatNumber, setHeatNumber] = useState<string>("26A-1042");
  const [billetId, setBilletId] = useState<string>("BILLET-00023");
  const [batchId, setBatchId] = useState<string>("BATCH-104");
  const [scanData, setScanData] = useState<PAUTScanData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [autoSweep, setAutoSweep] = useState<boolean>(false);

  // Expandable "How it works" panel
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);

  const fetchScan = async (pos: number) => {
    try {
      const data = await apiGet<PAUTScanData>(
        `/api/ndt/scan?encoder_pos_mm=${pos}&heat_number=${heatNumber}&billet_id=${billetId}&include_full_sweep=true`
      );
      setScanData(data);
    } catch (err) {
      console.error("Failed to fetch PAUT scan data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScan(encoderPos);
  }, [encoderPos, heatNumber, billetId]);

  useEffect(() => {
    if (!autoSweep) return;
    const interval = setInterval(() => {
      setEncoderPos((prev) => {
        const next = prev + 100.0;
        return next > 6000.0 ? 0.0 : next;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [autoSweep]);

  // Canonical PAUT Indication Object (Single Source of Truth)
  const pautIndication: PAUTIndication = scanData?.paut_indication || scanData?.paut_volumetric_scan?.paut_indication || {
    billet_id: billetId,
    encoder_position_mm: encoderPos,
    depth_mm: scanData?.paut_volumetric_scan.flaw_depth_mm ?? null,
    amplitude: scanData?.paut_volumetric_scan.peak_flaw_amplitude_pct ?? 8.0,
    channel: 32,
    timestamp: Date.now() / 1000,
    has_internal_flaw: scanData?.paut_volumetric_scan.has_internal_flaw ?? false,
    threshold_pct: scanData?.paut_volumetric_scan.threshold_pct ?? 40.0,
    indication_type: scanData?.paut_volumetric_scan.indication_type ?? "NORMAL",
  };

  const hasFlaw = Boolean(
    pautIndication.depth_mm !== null &&
    pautIndication.amplitude >= (pautIndication.threshold_pct ?? 40.0)
  );

  // Derive A-scan waveform points strictly from the canonical pautIndication object
  const generateAScanWaveform = () => {
    const points: { x: number; y: number }[] = [];
    const flawDepth = pautIndication.depth_mm ?? 75.0;
    const flawAmp = pautIndication.amplitude;

    for (let d = 0; d <= 150; d += 1) {
      // Deterministic acoustic grain scattering baseline noise
      let amp = 3.0 + Math.sin(d * 0.8) * 1.5;

      // Initial Pulse / Frontwall Echo @ 0-8mm
      if (d <= 8) {
        amp = 95.0 * Math.exp(-Math.pow(d - 2, 2) / 6.0);
      }
      // Internal Defect Echo derived from pautIndication
      else if (hasFlaw && Math.abs(d - flawDepth) <= 10) {
        amp = flawAmp * Math.exp(-Math.pow(d - flawDepth, 2) / 10.0);
      }
      // Back-Wall Echo @ 142-150mm with attenuation derived from pautIndication
      else if (d >= 140) {
        const backAmp = Math.max(20.0, 85.0 - (hasFlaw ? flawAmp * 0.4 : 0.0));
        amp = backAmp * Math.exp(-Math.pow(d - 147, 2) / 8.0);
      }

      points.push({ x: d, y: Math.max(2, amp) });
    }
    return points;
  };

  const aScanWaveform = generateAScanWaveform();

  return (
    <div className="space-y-5">
        {/* ================================================================ */}
        {/* 1. HEADER & STATUS */}
        {/* ================================================================ */}
        <div className="p-4 sm:p-5 rounded-lg bg-[#0c0e14] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 uppercase tracking-widest">
              <span className="text-slate-300 font-bold">INSPECTION METHOD</span>
              <span className="text-slate-600">/</span>
              <span className="text-emerald-400 font-bold">VOLUMETRIC ULTRASONIC NDT</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono flex items-center gap-3">
              <span>PAUT INSPECTION</span>
            </h1>
            <p className="text-xs text-slate-400">
              Phased Array Ultrasonic Testing — Internal / Subsurface Inspection
            </p>
          </div>

          {/* Semantic Amber Simulation Badge */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="px-3 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>PAUT MODE: SIMULATION</span>
            </div>
            <Link
              href="/inspection/eca"
              className="px-3 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10 flex items-center gap-1.5 transition-colors"
            >
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>Switch to ECA &rarr;</span>
            </Link>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 2. SECTION A: CURRENT BILLET & ENCODER TELEMETRY */}
        {/* ================================================================ */}
        <div className="p-4 rounded-lg bg-[#0c0e14] border border-white/[0.08] space-y-3 font-mono text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-slate-500 font-bold uppercase text-[10px]">CURRENT BILLET:</span>
              <span className="text-white font-bold text-sm">{billetId}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">HEAT: <span className="text-white font-bold">{heatNumber}</span></span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">BATCH: <span className="text-white font-bold">{batchId}</span></span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[10px]">ENCODER POS:</span>
                <span className="text-cyan-400 font-bold">{encoderPos.toFixed(1)} mm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[10px]">VELOCITY:</span>
                <span className="text-slate-200 font-bold">1000 mm/s</span>
              </div>
              <button
                onClick={() => setAutoSweep(!autoSweep)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  autoSweep
                    ? "bg-[#ED1C27] text-white"
                    : "bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10"
                }`}
              >
                <RefreshCw className={`w-3 h-3 ${autoSweep ? "animate-spin" : ""}`} />
                <span>{autoSweep ? "STOP SWEEP" : "AUTO SWEEP"}</span>
              </button>
            </div>
          </div>

          {/* Conveyor Position Slider Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Conveyor Encoder Traversal (0 – 6000 mm)</span>
              <span className="text-cyan-400 font-bold">{((encoderPos / 6000.0) * 100).toFixed(1)}% traversed</span>
            </div>
            <input
              type="range"
              min="0"
              max="6000"
              step="50"
              value={encoderPos}
              onChange={(e) => setEncoderPos(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#ED1C27]"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>0 mm (Head Face)</span>
              <span>1500 mm</span>
              <span>3000 mm (Midpoint)</span>
              <span>4200 mm (Defect Zone)</span>
              <span>6000 mm (Tail Face)</span>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 3. SECTION B & C: PAUT STATUS & RESULT SUMMARY */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 p-4 rounded-lg bg-[#0c0e14] border border-white/[0.08] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="font-bold text-white text-xs">PAUT VOLUMETRIC SYSTEM STATUS</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                PROBE: PAUT-01 (64 ELEM)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-[#07080b] border border-white/5">
                <div className="text-slate-500 text-[9px]">OPERATING MODE</div>
                <div className="text-amber-400 font-bold">SIMULATION</div>
              </div>
              <div className="p-2.5 rounded bg-[#07080b] border border-white/5">
                <div className="text-slate-500 text-[9px]">CONFIGURED VELOCITY</div>
                <div className="text-emerald-400 font-bold">5920 m/s (Steel)</div>
              </div>
              <div className="p-2.5 rounded bg-[#07080b] border border-white/5">
                <div className="text-slate-500 text-[9px]">DAC THRESHOLD</div>
                <div className="text-amber-400 font-bold">40.0% DAC</div>
              </div>
              <div className="p-2.5 rounded bg-[#07080b] border border-white/5">
                <div className="text-slate-500 text-[9px]">INDICATION STATUS</div>
                <div
                  className={`font-bold truncate ${
                    hasFlaw ? "text-[#ED1C27]" : "text-emerald-400"
                  }`}
                >
                  {hasFlaw ? "POTENTIAL INTERNAL INDICATION" : "NO SIGNIFICANT INDICATION"}
                </div>
              </div>
            </div>

            {/* Canonical Indication Result Strip */}
            <div className="p-3 rounded bg-[#07090e] border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">
                  CANONICAL PAUT RESULT (ENCODER: {pautIndication.encoder_position_mm.toFixed(0)} mm)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Transducer Channel {pautIndication.channel}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500">Position:</span>{" "}
                  <span className="text-cyan-400 font-bold">{pautIndication.encoder_position_mm.toFixed(1)} mm</span>
                </div>
                <div>
                  <span className="text-slate-500">Indication Depth:</span>{" "}
                  <span className="text-emerald-400 font-bold">
                    {pautIndication.depth_mm !== null ? `${pautIndication.depth_mm.toFixed(1)} mm` : "Homogeneous"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Peak Echo Amplitude:</span>{" "}
                  <span
                    className={`font-bold ${
                      pautIndication.amplitude >= (pautIndication.threshold_pct ?? 40.0)
                        ? "text-[#ED1C27]"
                        : "text-slate-200"
                    }`}
                  >
                    {pautIndication.amplitude.toFixed(1)}% DAC
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Evaluation:</span>{" "}
                  <span
                    className={`font-bold ${
                      hasFlaw ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {hasFlaw ? "DAC EXCEEDED" : "CONFORMING"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Expandable "How PAUT Works" */}
          <div className="lg:col-span-4 p-4 rounded-lg bg-[#0c0e14] border border-white/[0.08] flex flex-col justify-between space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>HOW PAUT WORKS</span>
              </span>
              <button
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-[10px] border border-white/10 flex items-center gap-1 cursor-pointer"
              >
                <span>{showHowItWorks ? "Collapse" : "Explain"}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showHowItWorks ? "rotate-180" : ""}`} />
              </button>
            </div>

            <div className="space-y-1 text-[11px] text-slate-300 leading-relaxed">
              <p className="text-slate-400 text-[10px]">
                Phased Array Ultrasonic Testing pulses high-frequency sound waves through the steel section to evaluate internal volumetric integrity.
              </p>
              {showHowItWorks && (
                <ol className="list-decimal list-inside space-y-1 pt-1 text-[10px] text-slate-300 bg-[#07080b] p-2 rounded border border-white/5">
                  <li>Multiple ultrasonic elements send sound waves into the billet.</li>
                  <li>The timing between elements can steer/focus the ultrasonic beam.</li>
                  <li>The wave travels through the material.</li>
                  <li>A discontinuity can reflect part of the ultrasonic energy.</li>
                  <li>The returning signal is analysed for position/depth.</li>
                </ol>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 4. SECTION D: PAUT A-SCAN WAVEFORM */}
        {/* ================================================================ */}
        <div className="p-4 sm:p-5 rounded-lg bg-[#0c0e14] border border-white/[0.08] space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                PAUT A-SCAN: ECHO AMPLITUDE vs TIME / DEPTH (0 – 150 mm)
              </h2>
              <div className="text-[10px] text-slate-400">
                Single A-Scan reflection profile derived from canonical indication event
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-bold text-xs">DAC Threshold: 40.0%</span>
              <span
                className={`px-2.5 py-0.5 rounded font-bold text-[10px] ${
                  hasFlaw
                    ? "bg-red-500/20 text-red-400 border border-red-500/40"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                }`}
              >
                {hasFlaw
                  ? `POTENTIAL INTERNAL INDICATION @ ${pautIndication.depth_mm} mm`
                  : "NO SIGNIFICANT INTERNAL INDICATION"}
              </span>
            </div>
          </div>

          {/* Continuous SVG Simulated Oscilloscope Waveform */}
          <div className="h-40 bg-[#07080b] p-3 rounded border border-white/5 relative flex items-end">
            {/* Reject line 40% */}
            <div className="absolute left-0 right-0 top-[60%] border-t border-dashed border-red-500/60 z-0">
              <span className="absolute right-3 -top-3.5 text-[9px] text-red-400 font-mono">
                DAC Reject Threshold (40%)
              </span>
            </div>

            {/* SVG Waveform Curve */}
            <svg className="w-full h-full overflow-visible z-10" viewBox="0 0 150 100" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                points={aScanWaveform.map((p) => `${p.x},${100 - p.y}`).join(" ")}
              />
            </svg>

            {/* Reticle labels */}
            <div className="absolute top-2 left-3 text-[9px] text-cyan-400 font-mono bg-black/60 px-1.5 py-0.5 rounded">
              Frontwall / Initial Pulse (0 mm)
            </div>
            {hasFlaw && (
              <div
                style={{ left: `${((pautIndication.depth_mm ?? 75.0) / 150.0) * 100}%` }}
                className="absolute top-2 -translate-x-1/2 text-[9px] text-[#ED1C27] font-mono font-bold bg-black/90 px-2 py-0.5 rounded border border-red-500/50 shadow-lg"
              >
                Flaw Echo: {pautIndication.depth_mm} mm ({pautIndication.amplitude.toFixed(1)}%)
              </div>
            )}
            <div className="absolute top-2 right-3 text-[9px] text-emerald-400 font-mono bg-black/60 px-1.5 py-0.5 rounded">
              Back-Wall Echo (150 mm)
            </div>
          </div>

          <div className="flex justify-between text-[9px] text-slate-500">
            <span>0 mm (Frontwall)</span>
            <span>37.5 mm</span>
            <span>75.0 mm (Core Center)</span>
            <span>112.5 mm</span>
            <span>150.0 mm (Backwall)</span>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 5. SECTION E: PAUT B-SCAN CROSS SECTION */}
        {/* ================================================================ */}
        <div className="p-4 sm:p-5 rounded-lg bg-[#0c0e14] border border-white/[0.08] space-y-3 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-white/[0.06] pb-2">
            <div>
              <span className="font-bold text-white text-xs">
                PAUT B-SCAN: LENGTH (0 – 6000 mm) vs DEPTH (0 – 150 mm)
              </span>
              <div className="text-[10px] text-slate-400">
                Cross-sectional volumetric slice across conveyor length
              </div>
            </div>
            <div className="text-[10px] text-slate-400">
              Synchronized Position: <span className="text-cyan-400 font-bold">{encoderPos.toFixed(0)} mm</span>
            </div>
          </div>

          <div className="h-32 bg-[#07080b] p-2 rounded border border-white/5 relative flex items-center">
            <div className="w-full h-full border-t border-b border-emerald-500/30 relative bg-[#090c12]">
              <span className="absolute top-0.5 left-1 text-[8px] text-emerald-400 font-mono">
                Surface 0 mm
              </span>
              <span className="absolute bottom-0.5 left-1 text-[8px] text-emerald-400 font-mono">
                Backwall 150 mm
              </span>
              <div className="absolute top-1/2 left-0 right-0 border-t border-dotted border-slate-700" />

              {/* Localized indications from paut_bscan_matrix */}
              {scanData?.paut_bscan_matrix?.map((bPoint, idx) => {
                if (!bPoint.has_internal_flaw) return null;
                const leftPct = (bPoint.encoder_position_mm / 6000.0) * 100;
                const topPct = ((bPoint.depth_mm ?? 75.0) / 150.0) * 100;
                return (
                  <div
                    key={idx}
                    style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#ED1C27]/80 border border-white shadow-[0_0_8px_red]"
                    title={`Internal Indication @ ${bPoint.encoder_position_mm} mm (Depth: ${bPoint.depth_mm} mm, Amp: ${bPoint.amplitude}%)`}
                  />
                );
              })}

              {/* Current Position Marker */}
              <div
                style={{ left: `${(encoderPos / 6000.0) * 100}%` }}
                className="absolute top-0 bottom-0 w-[1.5px] bg-white pointer-events-none"
              />
            </div>
          </div>

          <div className="flex justify-between text-[9px] text-slate-500">
            <span>0 mm (Head)</span>
            <span>1500 mm</span>
            <span>3000 mm (Midpoint)</span>
            <span>4500 mm</span>
            <span>6000 mm (Tail)</span>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 6. SECTION F: PAUT C-SCAN VOLUMETRIC RESPONSE */}
        {/* ================================================================ */}
        <div className="p-4 sm:p-5 rounded-lg bg-[#0c0e14] border border-white/[0.08] space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <div>
              <span className="font-bold text-white text-xs">
                PAUT C-SCAN: PLAN-VIEW VOLUMETRIC TRANSMISSION MAP
              </span>
              <div className="text-[10px] text-slate-400">
                Spatial acoustic transmission integrity along length (0 – 6000 mm)
              </div>
            </div>
            <span className="text-[10px] text-slate-400">
              Acoustic Attenuation Envelope
            </span>
          </div>

          <div className="h-20 bg-[#07080b] p-2 rounded border border-white/5 flex items-center justify-between overflow-x-auto">
            <div className="grid grid-flow-col auto-cols-fr gap-0.5 w-full h-full">
              {scanData?.paut_bscan_matrix?.map((slice, idx) => {
                const isCurrent = Math.abs(slice.encoder_position_mm - encoderPos) < 100.0;
                const isFlaw = slice.has_internal_flaw;
                const intensity = isFlaw ? slice.amplitude / 100.0 : 0.1;
                return (
                  <div
                    key={idx}
                    onClick={() => setEncoderPos(slice.encoder_position_mm)}
                    style={{
                      backgroundColor: isFlaw
                        ? `rgba(237, 28, 39, ${0.4 + intensity * 0.6})`
                        : `rgba(16, 185, 129, 0.25)`,
                    }}
                    className={`h-full rounded-[0.5px] cursor-pointer transition-all ${
                      isCurrent ? "ring-1 ring-white scale-105 z-10" : ""
                    }`}
                    title={`Pos: ${slice.encoder_position_mm} mm | Amp: ${slice.amplitude}%`}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex justify-between text-[9px] text-slate-500">
            <span>0 mm</span>
            <span>1500 mm</span>
            <span>3000 mm</span>
            <span>4500 mm</span>
            <span>6000 mm</span>
          </div>
        </div>
      </div>
  );
}
