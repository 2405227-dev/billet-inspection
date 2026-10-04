"use client";

import React, { useState, useEffect } from "react";
import {
  Radio,
  Activity,
  AlertTriangle,
  RefreshCw,
  Info,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Cpu,
  Layers,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import Link from "next/link";

interface ECAChannel {
  channel_idx: number;
  amplitude_mv: number;
  phase_deg: number;
  is_indication: boolean;
}

interface ECAScanData {
  mode: string;
  billet_id?: string;
  encoder_position_mm: number;
  heat_number: string;
  eca_channel_grid: {
    sensor_id: string;
    mode_label: string;
    probe_frequency_khz: number;
    num_channels: number;
    threshold_mv: number;
    max_amplitude_mv: number;
    has_indication: boolean;
    indication_type: string;
    channels: ECAChannel[];
  };
  eca_sweep_matrix?: {
    encoder_pos_mm: number;
    max_amplitude_mv: number;
    has_indication: boolean;
    channels: number[];
  }[];
}

export default function ECAInspectionPage() {
  const [encoderPos, setEncoderPos] = useState<number>(650.0);
  const [heatNumber, setHeatNumber] = useState<string>("26A-1042");
  const [billetId, setBilletId] = useState<string>("BILLET-00023");
  const [batchId, setBatchId] = useState<string>("BATCH-104");
  const [scanData, setScanData] = useState<ECAScanData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [autoSweep, setAutoSweep] = useState<boolean>(false);
  const [frequencyKhz, setFrequencyKhz] = useState<number>(250);
  const [thresholdMv, setThresholdMv] = useState<number>(120.0);

  // Expandable "How it works" panel
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);

  const fetchScan = async (pos: number) => {
    try {
      const data = await apiGet<ECAScanData>(
        `/api/ndt/scan?encoder_pos_mm=${pos}&heat_number=${heatNumber}&billet_id=${billetId}&include_full_sweep=true`
      );
      setScanData(data);
    } catch (err) {
      console.error("Failed to fetch ECA scan data", err);
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

  const hasIndication = scanData?.eca_channel_grid?.has_indication ?? false;
  const maxAmp = scanData?.eca_channel_grid?.max_amplitude_mv ?? 45.0;
  const indicationStatus = hasIndication ? "SURFACE CRACK INDICATION" : "NONE";

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
              <span className="text-amber-400 font-bold">ELECTROMAGNETIC NDT</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono flex items-center gap-3">
              <span>ECA INSPECTION</span>
            </h1>
            <p className="text-xs text-slate-400">
              Eddy Current Array — Surface / Near-Surface Inspection
            </p>
          </div>

          {/* Semantic Amber Simulation Badge */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="px-3 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>ECA MODE: SIMULATION</span>
            </div>
            <Link
              href="/inspection/paut"
              className="px-3 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10 flex items-center gap-1.5 transition-colors"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Switch to PAUT &rarr;</span>
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
              <span>4500 mm</span>
              <span>6000 mm (Tail Face)</span>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 3. SECTION B: ECA STATUS & HOW IT WORKS */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 p-4 rounded-lg bg-[#0c0e14] border border-white/[0.08] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="font-bold text-white text-xs">ECA SYSTEM STATUS & PARAMETERS</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                PROBE: ECA-01
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-[#07080b] border border-white/5">
                <div className="text-slate-500 text-[9px]">OPERATING MODE</div>
                <div className="text-amber-400 font-bold">SIMULATION</div>
              </div>
              <div className="p-2.5 rounded bg-[#07080b] border border-white/5">
                <div className="text-slate-500 text-[9px]">PROBE CHANNELS</div>
                <div className="text-white font-bold">16 Elements</div>
              </div>
              <div className="p-2.5 rounded bg-[#07080b] border border-white/5">
                <div className="text-slate-500 text-[9px]">COIL FREQUENCY</div>
                <div className="text-cyan-400 font-bold">{frequencyKhz} kHz</div>
              </div>
              <div className="p-2.5 rounded bg-[#07080b] border border-white/5">
                <div className="text-slate-500 text-[9px]">CURRENT INDICATION</div>
                <div
                  className={`font-bold truncate ${
                    hasIndication ? "text-[#ED1C27]" : "text-emerald-400"
                  }`}
                >
                  {hasIndication ? "SURFACE CRACK INDICATION" : "NONE (NORMAL)"}
                </div>
              </div>
            </div>
          </div>

          {/* Expandable "How ECA Works" */}
          <div className="lg:col-span-4 p-4 rounded-lg bg-[#0c0e14] border border-white/[0.08] flex flex-col justify-between space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>HOW ECA WORKS</span>
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
                Eddy Current Array detects surface and near-surface breaking fissures in conductive steel via electromagnetic induction.
              </p>
              {showHowItWorks && (
                <ol className="list-decimal list-inside space-y-1 pt-1 text-[10px] text-slate-300 bg-[#07080b] p-2 rounded border border-white/5">
                  <li>Coils create a changing magnetic field.</li>
                  <li>The field induces eddy currents in conductive steel.</li>
                  <li>A crack/discontinuity disturbs those currents.</li>
                  <li>The ECA electronics measure the resulting signal change.</li>
                  <li>Software evaluates the signal and produces an indication.</li>
                </ol>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 4. SECTION C: 16-CHANNEL SIGNAL VIEW */}
        {/* ================================================================ */}
        <div className="p-4 sm:p-5 rounded-lg bg-[#0c0e14] border border-white/[0.08] space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                16-CHANNEL SIGNAL RESPONSE VIEW
              </h2>
              <div className="text-[10px] text-slate-400">
                Electromagnetic impedance amplitude per channel at {encoderPos.toFixed(1)} mm
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-bold text-xs">
                Threshold: {thresholdMv.toFixed(1)} mV
              </span>
              <span
                className={`px-2.5 py-0.5 rounded font-bold text-[10px] ${
                  hasIndication
                    ? "bg-red-500/20 text-red-400 border border-red-500/40"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                }`}
              >
                {hasIndication ? "INDICATION DETECTED" : "NOMINAL BACKGROUND"}
              </span>
            </div>
          </div>

          {/* Indication Identification Card */}
          {hasIndication && (
            <div className="p-3 rounded bg-[#160e10] border border-red-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-400 text-xs">
                  SURFACE CRACK INDICATION IDENTIFIED
                </span>
                <span className="text-[10px] text-slate-400">
                  Awaiting review disposition
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500">Affected Channels:</span>{" "}
                  <span className="text-white font-bold">6–8</span>
                </div>
                <div>
                  <span className="text-slate-500">Position:</span>{" "}
                  <span className="text-cyan-400 font-bold">{encoderPos.toFixed(0)} mm</span>
                </div>
                <div>
                  <span className="text-slate-500">Peak Amplitude:</span>{" "}
                  <span className="text-[#ED1C27] font-bold">{maxAmp.toFixed(1)} mV</span>
                </div>
                <div>
                  <span className="text-slate-500">Threshold:</span>{" "}
                  <span className="text-amber-400 font-bold">{thresholdMv.toFixed(1)} mV</span>
                </div>
              </div>
            </div>
          )}

          {/* 16-Channel Instantaneous Response Bar Chart */}
          <div className="grid grid-cols-16 gap-1 h-36 items-end bg-[#07080b] p-3 rounded border border-white/5 relative">
            {/* Threshold line */}
            <div className="absolute left-0 right-0 top-[60%] border-t border-dashed border-amber-500/50 pointer-events-none z-0">
              <span className="absolute right-2 -top-3.5 text-[9px] text-amber-400/80 font-mono">
                Threshold: {thresholdMv} mV
              </span>
            </div>

            {scanData?.eca_channel_grid.channels.map((ch) => {
              const heightPct = Math.min(100, (ch.amplitude_mv / 300.0) * 100);
              const isOver = ch.amplitude_mv >= (scanData.eca_channel_grid.threshold_mv || thresholdMv);
              return (
                <div
                  key={ch.channel_idx}
                  className="flex flex-col items-center h-full justify-end group relative z-10"
                >
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t transition-all duration-150 ${
                      isOver
                        ? "bg-[#ED1C27] shadow-[0_0_8px_rgba(237,28,39,0.8)]"
                        : "bg-cyan-500/70 group-hover:bg-cyan-400"
                    }`}
                  />
                  <span className="text-[8px] text-slate-500 mt-1">{ch.channel_idx}</span>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:block z-20 p-1.5 rounded bg-black/95 text-[9px] text-white whitespace-nowrap border border-white/20">
                    Ch {ch.channel_idx}: {ch.amplitude_mv} mV (Phase: {ch.phase_deg}°)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================================ */}
        {/* 5. SECTION D: ECA C-SCAN MAP */}
        {/* ================================================================ */}
        <div className="p-4 sm:p-5 rounded-lg bg-[#0c0e14] border border-white/[0.08] space-y-3 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-white/[0.06] pb-2">
            <div>
              <span className="font-bold text-white text-xs">
                ECA C-SCAN MAP: BILLET LENGTH (0 – 6000 mm) vs CHANNELS (0 – 15)
              </span>
              <div className="text-[10px] text-slate-400">
                2D spatial impedance contour along billet longitudinal axis
              </div>
            </div>
            <div className="text-[10px] text-slate-400">
              Indication Highlight: <span className="text-[#ED1C27] font-bold">650–720 mm (Channels 6–8)</span>
            </div>
          </div>

          <div className="h-32 bg-[#07080b] p-2 rounded border border-white/5 flex flex-col justify-between overflow-x-auto">
            <div className="grid grid-flow-col auto-cols-fr gap-0.5 h-full">
              {scanData?.eca_sweep_matrix?.map((slice, idx) => {
                const isCurrent = Math.abs(slice.encoder_pos_mm - encoderPos) < 100.0;
                return (
                  <div
                    key={idx}
                    onClick={() => setEncoderPos(slice.encoder_pos_mm)}
                    className={`flex flex-col gap-[1px] h-full cursor-pointer relative ${
                      isCurrent ? "ring-1 ring-white" : ""
                    }`}
                    title={`Pos: ${slice.encoder_pos_mm} mm | Max: ${slice.max_amplitude_mv} mV`}
                  >
                    {slice.channels.map((amp, chIdx) => {
                      const intensity = Math.min(1.0, amp / 250.0);
                      const isFlaw = amp >= thresholdMv;
                      return (
                        <div
                          key={chIdx}
                          style={{
                            backgroundColor: isFlaw
                              ? `rgba(237, 28, 39, ${0.4 + intensity * 0.6})`
                              : `rgba(6, 182, 212, ${0.1 + intensity * 0.7})`,
                          }}
                          className="flex-1 rounded-[0.5px]"
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between text-[9px] text-slate-500">
            <span>0 mm (Head Face)</span>
            <span>1500 mm</span>
            <span>3000 mm (Midpoint)</span>
            <span>4500 mm</span>
            <span>6000 mm (Tail Face)</span>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 6. SECTION E: ECA PHYSICAL INSPECTION COVERAGE */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Schematic Diagram (6 Cols) */}
          <div className="lg:col-span-6 p-4 rounded-lg bg-[#0c0e14] border border-white/[0.08] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="font-bold text-white text-xs">
                ECA PHYSICAL PROBE RIG SCHEMATIC
              </span>
              <span className="text-slate-500 text-[10px]">COIL GEOMETRY</span>
            </div>

            <div className="p-3 bg-[#07080b] rounded border border-white/[0.06] flex flex-col items-center justify-center font-mono text-[11px] select-none">
              <div className="w-full flex items-center justify-between text-[9px] text-slate-500 pb-1 border-b border-white/5">
                <span>CONVEYOR ROLL TABLE</span>
                <span className="text-amber-400 font-bold">BILLET FLOW ──►</span>
              </div>

              <div className="w-full py-4 flex flex-col items-center gap-1.5 text-slate-300">
                {/* ECA Top Probe */}
                <div className="px-4 py-1 rounded bg-[#161a22] border border-amber-500/50 text-amber-300 font-bold text-[11px]">
                  ECA PROBE ARRAY [16 CHANNELS]
                </div>
                <div className="text-slate-600 text-xs">│ ↓ Magnetic Field</div>

                {/* Billet Cross Section Box */}
                <div className="w-64 h-12 bg-slate-800 rounded border-2 border-slate-600 flex items-center justify-between px-3 text-white font-bold text-xs relative shadow-inner">
                  <div className="text-[9px] text-amber-300">LEFT ECA</div>
                  <div className="text-center">
                    <span className="text-white text-xs">STEEL BILLET</span>
                    <span className="block text-[8px] text-slate-400">150 × 150 mm</span>
                  </div>
                  <div className="text-[9px] text-amber-300">RIGHT ECA</div>
                </div>

                <div className="text-slate-600 text-xs">│</div>
                <div className="px-3 py-0.5 rounded bg-[#11141c] border border-white/10 text-slate-400 text-[10px]">
                  ROLLER TABLE CONTACT SURFACE
                </div>
              </div>
            </div>
          </div>

          {/* Surface Coverage Status (6 Cols) */}
          <div className="lg:col-span-6 p-4 rounded-lg bg-[#0c0e14] border border-white/[0.08] space-y-3 font-mono text-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="font-bold text-white text-xs">SURFACE COVERAGE ENVELOPE</span>
                <span className="text-slate-500 text-[10px]">PHYSICAL BOUNDARIES</span>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between p-2 rounded bg-[#07080b] border border-white/5">
                  <span className="text-slate-300">TOP SURFACE</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> INSPECTED (16 Channels)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#07080b] border border-white/5">
                  <span className="text-slate-300">LEFT SURFACE</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> INSPECTED (Side Probe)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#07080b] border border-white/5">
                  <span className="text-slate-300">RIGHT SURFACE</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> INSPECTED (Side Probe)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#07080b] border border-amber-500/20 bg-amber-500/[0.02]">
                  <span className="text-slate-300">BOTTOM SURFACE</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> NOT INSPECTED (Roller Contact)
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 bg-[#07080b] p-2 rounded border border-white/5 leading-relaxed">
              <span className="text-amber-400 font-bold">Rig Note: </span>
              Conveyor contact bottom surface cannot be inspected by top/side ECA probes. Strictly marked <code className="text-amber-300">NOT_INSPECTED</code>.
            </div>
          </div>
        </div>
      </div>
  );
}
