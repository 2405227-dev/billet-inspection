"use client";

import React, { useState, useEffect } from "react";
import { fetchStatsOverview } from "@/lib/api";
import { StatsOverview } from "@/lib/types";
import { SeverityBadge } from "@/components/common/StatusBadge";
import {
  Bug,
  PieChart as PieIcon,
  BarChart3,
  RefreshCw,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

interface DefectScenario {
  id: string;
  name: string;
  category: string;
  severity: "CRITICAL" | "MAJOR" | "MODERATE" | "MINOR";
  confidence: number;
  length_mm: number;
  width_mm: number;
  area_mm2: number;
  surface: string;
  camera: string;
  coordinates: { x: number; y: number };
  rootCause: string;
  disposition: string;
  image: string;
  maskBox: { xPct: number; yPct: number; wPct: number; hPct: number };
}

const DEFECT_CATALOG: DefectScenario[] = [
  {
    id: "DEF-2026-0819",
    name: "LONGITUDINAL CRACK",
    category: "Surface Crack / Meniscus Flaw",
    severity: "MODERATE",
    confidence: 0.948,
    length_mm: 32.4,
    width_mm: 0.42,
    area_mm2: 13.6,
    surface: "TOP FACE",
    camera: "CAM-01 (Top Optical Array)",
    coordinates: { x: 1823, y: 74 },
    rootCause: "Continuous casting mould meniscus level instability and uneven primary cooling in mould copper tube.",
    disposition: "Divert to billet conditioning yard for localized surface grinding (depth < 1.5mm).",
    image: "/images/industrial/hot-steel-billet.jpg",
    maskBox: { xPct: 35, yPct: 42, wPct: 28, hPct: 16 },
  },
  {
    id: "DEF-2026-0820",
    name: "TRANSVERSE CORNER CRACK",
    category: "Corner Fracture",
    severity: "CRITICAL",
    confidence: 0.982,
    length_mm: 54.0,
    width_mm: 1.25,
    area_mm2: 67.5,
    surface: "CORNER EDGE (NORTH-EAST)",
    camera: "CAM-03 (Corner Optical Array)",
    coordinates: { x: 4210, y: 148 },
    rootCause: "Secondary cooling zone excessive thermal gradient or unbending strain at critical embrittlement temperature (700-900°C).",
    disposition: "REJECT / RE-MELT. Deep corner propagation exceeds rolling mill acceptance standard.",
    image: "/images/industrial/steel-surface-macro.jpg",
    maskBox: { xPct: 48, yPct: 25, wPct: 32, hPct: 22 },
  },
  {
    id: "DEF-2026-0821",
    name: "CORNER BLEED / TEAR",
    category: "Mould Shell Rupture",
    severity: "CRITICAL",
    confidence: 0.965,
    length_mm: 68.2,
    width_mm: 3.10,
    area_mm2: 211.4,
    surface: "BOTTOM-LEFT CORNER",
    camera: "CAM-04 (Bottom Left Array)",
    coordinates: { x: 890, y: 12 },
    rootCause: "Thin shell re-melting at mould exit due to insufficient mould lubrication or high casting speed.",
    disposition: "REJECT. Billet flagged for immediate ladle tundish temperature check.",
    image: "/images/industrial/laser-scan.jpg",
    maskBox: { xPct: 20, yPct: 55, wPct: 40, hPct: 25 },
  },
  {
    id: "DEF-2026-0822",
    name: "SUB-SURFACE PINHOLE / BLOWHOLE",
    category: "Gas Porosity",
    severity: "MINOR",
    confidence: 0.914,
    length_mm: 4.8,
    width_mm: 0.85,
    area_mm2: 4.1,
    surface: "RIGHT SIDE FACE",
    camera: "CAM-05 (Right Array)",
    coordinates: { x: 3120, y: 88 },
    rootCause: "Inadequate deoxidation in secondary metallurgy ladle furnace (excess dissolved oxygen/nitrogen).",
    disposition: "PASS WITH MONITORING. Flaw will weld shut during roughing mill reduction passes.",
    image: "/images/industrial/steel-texture-dark.jpg",
    maskBox: { xPct: 40, yPct: 38, wPct: 15, hPct: 15 },
  },
];

import { MASTER_STATS_OVERVIEW } from "@/lib/mockData";

export default function DefectAnalyticsPage() {
  const [stats, setStats] = useState<StatsOverview>(MASTER_STATS_OVERVIEW);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedDefect, setSelectedDefect] = useState<DefectScenario>(DEFECT_CATALOG[0]);
  const [showMask, setShowMask] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const loadData = async () => {
    setLoading(true);
    try {
      const s = await fetchStatsOverview();
      if (s) setStats(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const breakdown = stats?.defect_type_breakdown || {
    longitudinal_crack: 14,
    transverse_crack: 8,
    corner_crack: 6,
    pinholes: 12,
    scale_pits: 9,
    scabs: 5,
  };

  const defectData = Object.entries(breakdown).map(([key, count]) => ({
    name: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    count: typeof count === "number" ? count : 0,
  }));

  const COLORS = ["#ED1C27", "#f59e0b", "#38bdf8", "#10b981", "#8b5cf6", "#ec4899"];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-[#0c0e14] border border-white/[0.08] rounded-lg p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 uppercase tracking-widest">
              <span className="text-slate-300 font-bold">METALLURGY LAB</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400">SURFACE FLAW CLASSIFICATION</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Defect Investigation & AI Segmentation
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              High-resolution optical tiling, sub-millimeter crack metrology, and convolutional semantic segmentation with spatial coordinates.
            </p>
          </div>

          <button
            onClick={loadData}
            className="p-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer self-start lg:self-center"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#ED1C27]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Defect Investigation Console */}
      <div className="bg-[#0c0e14] border border-white/[0.08] rounded-lg p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-2">
            <ScanLine className="w-3.5 h-3.5 text-slate-400" />
            <h2 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
              Investigation Viewport & Defect Telemetry
            </h2>
          </div>

          {/* Quick Scenario Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            {DEFECT_CATALOG.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedDefect(item)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                  selectedDefect.id === item.id
                    ? "bg-[#ED1C27] text-white font-bold"
                    : "bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10"
                }`}
              >
                {item.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Viewport Split: Left Viewport Image vs Right Telemetry */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 7 Columns: Macro Defect Viewport */}
          <div className="lg:col-span-7 bg-[#07080b] border border-white/10 rounded overflow-hidden flex flex-col justify-between relative group select-none">
            {/* Viewport HUD Top Controls */}
            <div className="p-2.5 bg-black/80 border-b border-white/10 flex items-center justify-between z-10 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ED1C27]" />
                <span className="text-white font-bold">{selectedDefect.id}</span>
                <span className="text-slate-500">· {selectedDefect.camera}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMask(!showMask)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                    showMask
                      ? "bg-white/10 text-white border-white/20 font-bold"
                      : "bg-white/[0.04] text-slate-500 border-white/10"
                  }`}
                >
                  MASKS: {showMask ? "ON" : "OFF"}
                </button>

                <div className="flex items-center gap-1 bg-[#07080b] border border-white/10 rounded px-1 py-0.5 text-[10px]">
                  {[1, 2, 4].map((z) => (
                    <button
                      key={z}
                      onClick={() => setZoomLevel(z)}
                      className={`px-1.5 py-0.2 rounded cursor-pointer ${
                        zoomLevel === z ? "bg-white/20 text-white font-bold" : "text-slate-500"
                      }`}
                    >
                      {z}×
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Viewport Frame with Real Industrial Defect Macro Image */}
            <div className="aspect-[16/10] relative overflow-hidden bg-black flex items-center justify-center">
              <img
                src={selectedDefect.image}
                alt={selectedDefect.name}
                className="w-full h-full object-cover transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
              />

              {/* Technical Reticle & Measurement Lines */}
              <div className="absolute inset-0 pointer-events-none border border-white/10">
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/[0.07]" />
                <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/[0.07]" />

                <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-400 bg-black/60 px-1.5 py-0.5 rounded border border-white/10">
                  FOV: 300 × 200 mm · 0.05 mm/px
                </div>

                {/* Bounding Box & Segmentation Mask Overlay */}
                {showMask && (
                  <div
                    className="absolute border border-[#ED1C27] bg-[#ED1C27]/15 transition-all flex flex-col justify-between p-1"
                    style={{
                      left: `${selectedDefect.maskBox.xPct}%`,
                      top: `${selectedDefect.maskBox.yPct}%`,
                      width: `${selectedDefect.maskBox.wPct}%`,
                      height: `${selectedDefect.maskBox.hPct}%`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="bg-[#ED1C27] text-white text-[9px] font-mono font-bold px-1 rounded">
                        {selectedDefect.name}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-white bg-black/80 px-1 rounded">
                        {Math.round(selectedDefect.confidence * 100)}%
                      </span>
                    </div>

                    <div className="text-[9px] font-mono text-slate-200 bg-black/80 px-1 py-0.5 rounded self-start">
                      L: {selectedDefect.length_mm} mm · W: {selectedDefect.width_mm} mm
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Viewport Bottom Coordinate Bar */}
            <div className="p-2 bg-black/80 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <div>
                COORDS: <span className="text-white font-bold">X {selectedDefect.coordinates.x} mm, Y {selectedDefect.coordinates.y} mm</span>
              </div>
              <div>
                SURFACE: <span className="text-slate-200 font-bold">{selectedDefect.surface}</span>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Defect Information & Metallurgy Telemetry */}
          <div className="lg:col-span-5 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                  {selectedDefect.category}
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight mt-0.5 font-mono">
                  {selectedDefect.name}
                </h3>
              </div>

              {/* Telemetry Metric Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-[#07080b] border border-white/[0.08] rounded space-y-0.5">
                  <div className="text-slate-500 text-[9px] uppercase">SEVERITY</div>
                  <SeverityBadge severity={selectedDefect.severity} />
                </div>

                <div className="p-2.5 bg-[#07080b] border border-white/[0.08] rounded space-y-0.5">
                  <div className="text-slate-500 text-[9px] uppercase">AI CONFIDENCE</div>
                  <div className="text-xs font-bold text-emerald-400">
                    {(selectedDefect.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="p-2.5 bg-[#07080b] border border-white/[0.08] rounded space-y-0.5">
                  <div className="text-slate-500 text-[9px] uppercase">LENGTH</div>
                  <div className="text-xs font-bold text-white">
                    {selectedDefect.length_mm} mm
                  </div>
                </div>

                <div className="p-2.5 bg-[#07080b] border border-white/[0.08] rounded space-y-0.5">
                  <div className="text-slate-500 text-[9px] uppercase">GAP / WIDTH</div>
                  <div className="text-xs font-bold text-white">
                    {selectedDefect.width_mm} mm
                  </div>
                </div>

                <div className="p-2.5 bg-[#07080b] border border-white/[0.08] rounded space-y-0.5">
                  <div className="text-slate-500 text-[9px] uppercase">LOCATION</div>
                  <div className="text-[11px] font-bold text-slate-200 truncate">
                    {selectedDefect.surface}
                  </div>
                </div>

                <div className="p-2.5 bg-[#07080b] border border-white/[0.08] rounded space-y-0.5">
                  <div className="text-slate-500 text-[9px] uppercase">AREA</div>
                  <div className="text-xs font-bold text-white">
                    {selectedDefect.area_mm2} mm²
                  </div>
                </div>
              </div>

              {/* Root Cause Analysis */}
              <div className="p-3 bg-[#07080b] border border-white/[0.08] rounded space-y-1">
                <div className="text-[9px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Metallurgical Root Cause Analysis</span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {selectedDefect.rootCause}
                </p>
              </div>

              {/* Recommended Disposition */}
              <div className="p-3 bg-[#07080b] border border-white/[0.08] rounded space-y-1">
                <div className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Quality Action / Disposition</span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {selectedDefect.disposition}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Defect Analytics & Frequency Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#0c0e14] border border-white/[0.08] rounded-lg p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
              <span>Defect Frequency by Class</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Real-time counts</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defectData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#181c24" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#07080b",
                    borderColor: "rgba(255,255,255,0.12)",
                    fontSize: "11px",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontFamily: "var(--font-mono)",
                  }}
                />
                <Bar dataKey="count" fill="#ED1C27" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0c0e14] border border-white/[0.08] rounded-lg p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <PieIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Defect Composition</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Distribution</span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={defectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {defectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#07080b" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#07080b",
                    borderColor: "rgba(255,255,255,0.12)",
                    fontSize: "11px",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontFamily: "var(--font-mono)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
