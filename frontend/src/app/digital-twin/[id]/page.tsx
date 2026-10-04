"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Boxes,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Camera,
  Activity,
  Radio,
  FileSpreadsheet,
  Download,
  Info,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { apiGet, getBackendUrl } from "@/lib/api";
import Link from "next/link";

interface DefectItem {
  id: string;
  defect_type: string;
  severity: string;
  confidence: number;
  surface_face: string;
  encoder_pos_mm: number;
  length_mm: number;
  width_mm: number;
  area_mm2: number;
  crop_path?: string;
}

interface TimelineItem {
  time: string;
  event: string;
  sensor: string;
  status: string;
}

export interface PAUTIndication {
  billet_id: string;
  encoder_position_mm: number;
  depth_mm: number | null;
  amplitude: number;
  channel: number;
  timestamp: number;
  has_internal_flaw?: boolean;
  indication_type?: string;
  severity?: string;
  confidence?: number;
}

interface DigitalTwinData {
  billet_id: string;
  inspection_id: string;
  heat_number: string;
  batch_id: string;
  steel_grade: string;
  status: string;
  decision_reason: string;
  why_failed_explanation: string;
  timestamp: string;
  dimensions: {
    length_mm: number;
    width_mm: number;
    height_mm: number;
    dimension_status: string;
  };
  coverage_map: {
    TOP: string;
    BOTTOM: string;
    LEFT: string;
    RIGHT: string;
    FRONT: string;
    BACK: string;
  };
  defects: DefectItem[];
  paut_indication?: PAUTIndication;
  paut_indications?: PAUTIndication[];
  ndt_results: any;
  timeline: TimelineItem[];
  audit_hash: string;
  previous_audit_hash: string;
  evidence_image?: string;
  processing_latency_ms: number;
}

export default function DigitalTwinDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [twin, setTwin] = useState<DigitalTwinData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFace, setSelectedFace] = useState<string>("TOP");
  const [activeDefect, setActiveDefect] = useState<DefectItem | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchTwin = async () => {
      setLoading(true);
      try {
        const data = await apiGet<DigitalTwinData>(`/api/digital-twin/${id}`);
        setTwin(data);
        if (data.defects && data.defects.length > 0) {
          setActiveDefect(data.defects[0]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load Digital Billet Twin.");
      } finally {
        setLoading(false);
      }
    };
    fetchTwin();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 font-mono text-slate-400">
        <Boxes className="w-8 h-8 animate-bounce text-[#ED1C27]" />
        <div>SYNTHESIZING MULTI-MODAL DIGITAL BILLET TWIN...</div>
      </div>
    );
  }

  if (error || !twin) {
    return (
      <div className="p-8 rounded-lg bg-[#0c0e12] border border-red-500/30 text-center space-y-4 font-mono">
        <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
        <div className="text-white font-bold text-base">BILLET TWIN RECORD NOT FOUND</div>
        <div className="text-xs text-slate-400 max-w-md mx-auto">
          {error || `No inspection trajectory matches identifier "${id}".`}
        </div>
        <Link
          href="/inspections"
          className="inline-block px-4 py-2 rounded bg-[#161a22] hover:bg-[#202530] text-xs text-white border border-white/10"
        >
          &larr; Return to Inspections
        </Link>
      </div>
    );
  }

  const isPass = twin.status === "PASS";
  const isFail = twin.status === "FAIL";
  const isReview = twin.status === "NEEDS_REVIEW";

  return (
    <div className="space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-lg bg-[#0c0e12] border border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-white/10 text-slate-300 rounded border border-white/10">
                DIGITAL BILLET TWIN
              </span>
              <span className="text-xs font-mono text-slate-400">
                {twin.billet_id} · HEAT: {twin.heat_number} · {twin.batch_id}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight font-mono flex items-center gap-3">
              <span>{twin.billet_id}</span>
              <span
                className={`px-3 py-1 rounded text-xs font-bold font-mono ${
                  isPass
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : isFail
                    ? "bg-red-500/20 text-red-400 border border-red-500/40"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                }`}
              >
                {twin.status}
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Grade: {twin.steel_grade} · Inspected at {new Date(twin.timestamp).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <a
              href={getBackendUrl(`/api/inspections/${twin.inspection_id}/report`)}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded bg-[#161a22] hover:bg-[#202530] text-slate-200 border border-white/10 flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-[#ED1C27]" />
              <span>PDF PASSPORT</span>
            </a>
            <Link
              href={`/inspections/${twin.inspection_id}`}
              className="px-3 py-2 rounded bg-[#ED1C27] hover:bg-[#c91820] text-white font-bold flex items-center gap-2"
            >
              <span>RAW INSPECTION</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Multi-Face Physical Surface Coverage Map */}
        <div className="p-4 rounded-lg bg-[#0c0e12] border border-white/10 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200">PHYSICAL MULTI-FACE SURFACE COVERAGE MAP</span>
            <span className="text-slate-500 text-[10px]">6-FACET RIG GEOMETRY</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {Object.entries(twin.coverage_map).map(([face, covStatus]) => {
              const inspected = covStatus === "INSPECTED";
              const isSelected = selectedFace === face;
              return (
                <button
                  key={face}
                  onClick={() => setSelectedFace(face)}
                  className={`p-2.5 rounded border text-left transition-all ${
                    isSelected
                      ? "border-[#ED1C27] bg-[#ED1C27]/10"
                      : "border-white/10 bg-[#12151c] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px]">{face} FACE</span>
                    {inspected ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>
                  <div
                    className={`text-[10px] font-semibold mt-1 ${
                      inspected ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {covStatus}
                  </div>
                </button>
              );
            })}
          </div>
          {twin.coverage_map.BOTTOM === "NOT_INSPECTED" && (
            <div className="text-[11px] text-slate-400 bg-[#14161d] p-2 rounded border border-white/5">
              <span className="text-amber-400 font-bold">Physical Constraint Note: </span>
              Bottom face is the conveyor roller contact surface and cannot be optically imaged in this pass. It is strictly recorded as <code className="text-amber-300">NOT_INSPECTED</code> rather than marked conforming.
            </div>
          )}
        </div>

        {/* 2-Column Main Workspace: Left 3D/2D Model, Right Inspection Telemetry */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 3D/2D Interactive Spatial Twin Model (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-lg bg-[#0c0e12] border border-white/10 space-y-4 font-mono">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="font-bold text-white text-xs">
                  SPATIAL DEFECT & VOLUMETRIC MAP (FACE: {selectedFace})
                </span>
                <span className="text-slate-400 text-[11px]">
                  {twin.dimensions.length_mm} × {twin.dimensions.width_mm} × {twin.dimensions.height_mm} mm
                </span>
              </div>

              {/* Billet 2.5D Physical Model with Defect Hotspots */}
              <div className="relative h-64 bg-[#07080a] rounded border border-white/5 p-4 flex flex-col justify-center items-center overflow-hidden">
                {/* 2.5D Steel Billet Bar */}
                <div className="w-[92%] h-24 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded border-2 border-slate-500 relative shadow-2xl flex items-center justify-between px-3">
                  {/* Surface Scale Texture simulation */}
                  <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:8px_8px] opacity-40 pointer-events-none" />

                  {/* Core Centerline Reference */}
                  <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-emerald-500/30 pointer-events-none" />

                  {/* End Face Markings Stencil */}
                  <div className="text-[9px] font-mono text-amber-300/80 tracking-widest uppercase rotate-90 sm:rotate-0">
                    {twin.heat_number}
                  </div>

                  {/* Laser Profile Line Triangulation */}
                  <div className="absolute top-0 bottom-0 left-[35%] w-[2px] bg-cyan-400/80 shadow-[0_0_8px_#22d3ee] pointer-events-none" />

                  {/* Surface Defect Hotspots at Real Encoder Positions */}
                  {twin.defects.map((d) => {
                    const leftPct = Math.min(
                      90,
                      Math.max(5, (d.encoder_pos_mm / (twin.dimensions.length_mm || 6000.0)) * 100)
                    );
                    const isSelected = activeDefect?.id === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setActiveDefect(d)}
                        style={{ left: `${leftPct}%` }}
                        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 group cursor-pointer`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            d.severity === "CRITICAL"
                              ? "bg-red-600 text-white animate-ping"
                              : d.severity === "MAJOR"
                              ? "bg-orange-500 text-white"
                              : "bg-amber-400 text-black"
                          } ${isSelected ? "ring-4 ring-white" : ""}`}
                        >
                          <span className="text-[9px] font-bold">!</span>
                        </div>
                        {/* Hover tag */}
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-black/90 p-1 rounded text-[9px] text-white border border-white/20">
                          {d.defect_type} @ {d.encoder_pos_mm} mm
                        </div>
                      </button>
                    );
                  })}

                  {/* Canonical PAUT Volumetric Flaw Indication Marker */}
                  {twin.paut_indication && twin.paut_indication.has_internal_flaw && (
                    <div
                      style={{
                        left: `${Math.min(
                          90,
                          Math.max(5, (twin.paut_indication.encoder_position_mm / (twin.dimensions.length_mm || 6000.0)) * 100)
                        )}%`,
                        top: `${((twin.paut_indication.depth_mm ?? 75.0) / 150.0) * 100}%`,
                      }}
                      className="absolute -translate-y-1/2 -translate-x-1/2 z-30 group cursor-pointer"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#ED1C27] border border-white flex items-center justify-center shadow-[0_0_10px_red] animate-pulse">
                        <span className="text-[8px] font-bold text-white">UT</span>
                      </div>
                      <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-black/95 p-1.5 rounded text-[9px] text-emerald-300 border border-emerald-500/40">
                        PAUT Flaw: {twin.paut_indication.encoder_position_mm}mm | Depth: {twin.paut_indication.depth_mm}mm | Amp: {twin.paut_indication.amplitude}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Ruler & Scale */}
                <div className="w-[92%] flex justify-between text-[9px] font-mono text-slate-500 mt-3">
                  <span>0 mm (Head)</span>
                  <span>1500 mm</span>
                  <span>3000 mm (Center)</span>
                  <span>4500 mm</span>
                  <span>{twin.dimensions.length_mm} mm (Tail)</span>
                </div>
              </div>

              {/* Selected Defect Detail Card */}
              {activeDefect ? (
                <div className="p-3 rounded bg-[#12151c] border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{activeDefect.id}</span>
                      <span className="text-slate-400 uppercase font-mono">
                        {activeDefect.defect_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        activeDefect.severity === "CRITICAL"
                          ? "bg-red-500/20 text-red-400"
                          : activeDefect.severity === "MAJOR"
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {activeDefect.severity}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-500">Position:</span>{" "}
                      <span className="font-bold">{activeDefect.encoder_pos_mm} mm</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Length:</span>{" "}
                      <span className="font-bold">{activeDefect.length_mm} mm</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Width:</span>{" "}
                      <span className="font-bold">{activeDefect.width_mm} mm</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Area:</span>{" "}
                      <span className="font-bold">{activeDefect.area_mm2} mm²</span>
                    </div>
                  </div>

                  {activeDefect.crop_path && (
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-3">
                      <div className="text-[10px] text-slate-400">HIGH-RES OPTICAL CROP:</div>
                      <img
                        src={getBackendUrl(activeDefect.crop_path)}
                        alt="Defect crop"
                        className="h-12 w-28 object-cover rounded border border-white/20 bg-black"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-slate-500">
                  No surface defects detected on {selectedFace} face.
                </div>
              )}
            </div>
          </div>

          {/* Right: Inspection Data & "Why Did This Billet Fail?" Card (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 font-mono text-xs">
            {/* Root-Cause Explanation Card */}
            <div className="p-4 rounded-lg bg-[#0c0e12] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <ShieldAlert className="w-4 h-4 text-[#ED1C27]" />
                <span>WHY DID THIS BILLET RECEIVE THIS DISPOSITION?</span>
              </div>
              <div
                className={`p-3 rounded border text-xs leading-relaxed ${
                  isPass
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                    : isFail
                    ? "bg-red-500/10 border-red-500/30 text-red-200"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-200"
                }`}
              >
                {twin.why_failed_explanation || twin.decision_reason}
              </div>
            </div>

            {/* PAUT Volumetric NDT Core Summary (Canonical Indication Consumption) */}
            {twin.paut_indication && (
              <div className="p-4 rounded-lg bg-[#0c0e12] border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold text-slate-200">PAUT VOLUMETRIC CORE SCAN</span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      twin.paut_indication.has_internal_flaw
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {twin.paut_indication.has_internal_flaw ? "INTERNAL FLAW" : "HOMOGENEOUS"}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                  <div>
                    <div className="text-slate-500 text-[9px]">ENCODER POS</div>
                    <div className="text-white font-bold">{twin.paut_indication.encoder_position_mm} mm</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[9px]">DEPTH</div>
                    <div className="text-emerald-400 font-bold">
                      {twin.paut_indication.depth_mm !== null ? `${twin.paut_indication.depth_mm} mm` : "Normal"}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[9px]">AMPLITUDE</div>
                    <div className="text-white font-bold">{twin.paut_indication.amplitude}% DAC</div>
                  </div>
                </div>
                <div className="text-[9px] text-slate-500 pt-1 border-t border-white/5">
                  <span className="text-emerald-400 font-semibold">Single Event Origin: </span>
                  Exact match to Station 03 A-Scan / B-Scan telemetry.
                </div>
              </div>
            )}

            {/* Dimensional Metrology Summary */}
            <div className="p-4 rounded-lg bg-[#0c0e12] border border-white/10 space-y-2">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="font-bold text-slate-200">DIMENSIONAL METROLOGY</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    twin.dimensions.dimension_status === "PASS"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {twin.dimensions.dimension_status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                <div>
                  <div className="text-slate-500">LENGTH</div>
                  <div className="text-white font-bold">{twin.dimensions.length_mm} mm</div>
                  <div className="text-[9px] text-slate-500">6000.0 ±200.0</div>
                </div>
                <div>
                  <div className="text-slate-500">WIDTH</div>
                  <div className="text-white font-bold">{twin.dimensions.width_mm} mm</div>
                  <div className="text-[9px] text-slate-500">150.0 ±3.0</div>
                </div>
                <div>
                  <div className="text-slate-500">HEIGHT</div>
                  <div className="text-white font-bold">{twin.dimensions.height_mm} mm</div>
                  <div className="text-[9px] text-slate-500">150.0 ±3.0</div>
                </div>
              </div>
            </div>

            {/* Cryptographic Audit Hash Verification */}
            <div className="p-4 rounded-lg bg-[#0c0e12] border border-white/10 space-y-2">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold text-slate-200">SHA-256 AUDIT LEDGER</span>
                </div>
                <span className="text-emerald-400 text-[10px] font-bold">SEALED</span>
              </div>
              <div className="space-y-1.5 text-[10px]">
                <div>
                  <span className="text-slate-500">Block Hash:</span>
                  <div className="font-mono text-slate-300 break-all bg-black/40 p-1 rounded">
                    {twin.audit_hash}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Parent Hash:</span>
                  <div className="font-mono text-slate-400 break-all bg-black/40 p-1 rounded">
                    {twin.previous_audit_hash}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sensor Inspection Timeline (Chronological State Machine) */}
        <div className="p-4 rounded-lg bg-[#0c0e12] border border-white/10 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>SYNCHRONOUS MULTI-SENSOR INSPECTION TIMELINE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            {twin.timeline.map((item, idx) => {
              return (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-[#12151c] border border-white/5 flex flex-col justify-between space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{item.time}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-white/5 text-slate-300">
                      STEP {idx + 1}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-white leading-tight">
                    {item.event}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[9px]">
                    <span className="text-cyan-400">{item.sensor}</span>
                    <span
                      className={
                        item.status === "FAIL"
                          ? "text-red-400 font-bold"
                          : "text-emerald-400 font-semibold"
                      }
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
  );
}
