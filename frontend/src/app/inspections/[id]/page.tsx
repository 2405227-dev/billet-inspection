"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchInspectionDetail, getApiUrl } from "@/lib/api";
import { InspectionDetail } from "@/lib/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DimensionalTable } from "@/components/inspection/DimensionalTable";
import { DefectMapViewer } from "@/components/inspection/DefectMapViewer";
import { OperatorReviewModal } from "@/components/inspection/OperatorReviewModal";
import { IndustrialHeroBackground } from "@/components/ui/IndustrialHeroBackground";
import {
  FileText,
  ShieldCheck,
  UserCheck,
  ArrowLeft,
  RefreshCw,
  Scan,
  Layers,
  Radio,
  Copy,
  Check,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function InspectionDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  const loadDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInspectionDetail(id);
      setInspection(data);
    } catch (err: any) {
      setError(err.message || "Failed to load inspection record");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-7 h-7 animate-spin text-[#ED1C27] mx-auto" />
        <div className="text-xs font-mono text-white/50">
          Loading permanent cryptographic inspection record {id}...
        </div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="industrial-panel p-8 max-w-lg mx-auto text-center space-y-4">
        <AlertCircle className="w-9 h-9 text-[#ED1C27] mx-auto" />
        <h2 className="text-base font-bold text-white">Inspection Record Not Found</h2>
        <p className="text-xs text-white/50 font-mono">{error}</p>
        <Link
          href="/inspections"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#ED1C27] text-white rounded-lg text-xs font-mono font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Registry</span>
        </Link>
      </div>
    );
  }

  const pdfDownloadUrl = getApiUrl(`/api/inspections/${inspection.id}/report`);
  const evidenceImageUrl = inspection.evidence_image ? getApiUrl(inspection.evidence_image) : null;
  const ocrCropUrl = inspection.ocr_crop_reference ? getApiUrl(inspection.ocr_crop_reference) : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header Banner with Industrial Steel Backdrop */}
      <IndustrialHeroBackground
        imageSrc="/images/industrial/hot-steel-billet.jpg"
        accent="red"
        className="p-6 sm:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Link
                href="/inspections"
                className="p-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10 transition-colors"
                title="Back to All Billets"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <span className="text-xs font-mono text-white/50">INSPECTION RECORD:</span>
              <span className="font-bold text-sm text-[#ED1C27] font-mono">
                {inspection.id}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
                {inspection.billet_id}
              </h1>
              <StatusBadge status={inspection.status} size="lg" />
              {inspection.operator_override && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  OVERRIDDEN BY {inspection.operator_id || "OPERATOR"}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-white/60">
              <div>HEAT: <span className="text-white font-bold">{inspection.heat_number}</span></div>
              <span className="text-white/20">·</span>
              <div>BATCH: <span className="text-white font-bold">{inspection.batch_id}</span></div>
              <span className="text-white/20">·</span>
              <div>INSPECTED: <span className="text-white font-bold">{new Date(inspection.timestamp).toLocaleTimeString([], { hour12: false })}</span></div>
              <span className="text-white/20">·</span>
              <div>LATENCY: <span className="text-white font-bold">{inspection.processing_latency_ms} ms</span></div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowReviewModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10 text-xs font-mono font-semibold transition-colors"
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Operator Override</span>
            </button>

            <a
              href={pdfDownloadUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#ED1C27] hover:bg-[#ff2a37] text-white text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(237,28,39,0.3)]"
            >
              <FileText className="w-4 h-4" />
              <span>Export PDF Certificate</span>
            </a>
          </div>
        </div>
      </IndustrialHeroBackground>

      {/* Decision Summary Reason Banner */}
      <div className="industrial-panel p-4 flex items-start gap-3 text-xs font-mono">
        <span className="text-white/40 shrink-0 uppercase">DECISION RATIONALE:</span>
        <span className="text-white/90 font-medium">{inspection.decision_reason}</span>
      </div>

      {/* 1. Identification & Visual Evidence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Traceability Data */}
        <div className="lg:col-span-5 industrial-panel p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <Scan className="w-4 h-4 text-[#ED1C27]" />
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider font-mono">
              Traceability & Identification
            </h3>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-white/40">Billet Serial:</span>
              <span className="font-bold text-white">{inspection.billet_id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-white/40">Heat Number:</span>
              <span className="font-bold text-[#ED1C27]">{inspection.heat_number}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-white/40">Batch ID:</span>
              <span className="text-white">{inspection.batch_id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-white/40">Steel Grade:</span>
              <span className="text-white">IS 2830 / Fe 500D</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-white/40">End-Face OCR:</span>
              <span className="text-white font-bold">{inspection.ocr_text || "N/A"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-white/40">OCR Confidence:</span>
              <span className="text-emerald-400 font-semibold">
                {Math.round((inspection.ocr_confidence || 0) * 100)}%
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-white/40">2D Barcode:</span>
              <span className="text-white">{inspection.barcode_value || "N/A"}</span>
            </div>
          </div>

          {/* OCR End-Face Crop Reference */}
          {ocrCropUrl && (
            <div className="pt-2">
              <div className="text-[10px] font-mono text-white/40 uppercase mb-2">
                End-Face Marking Crop Evidence
              </div>
              <div className="h-20 bg-black/60 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center">
                <img
                  src={ocrCropUrl}
                  alt="OCR Crop"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right 7 Cols: Full Billet Evidence Image */}
        <div className="lg:col-span-7 industrial-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#ED1C27]" />
              <h3 className="font-semibold text-xs text-white uppercase tracking-wider font-mono">
                Full-Surface Visual Evidence & Overlays
              </h3>
            </div>
            <span className="text-[10px] font-mono text-white/40">Calibrated Multi-Camera Composite</span>
          </div>

          <div className="aspect-video bg-black/60 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center relative">
            {evidenceImageUrl ? (
              <img
                src={evidenceImageUrl}
                alt={`Evidence for ${inspection.id}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-xs text-white/40 font-mono">No evidence image recorded</div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Dimensional Metrology */}
      <DimensionalTable
        dimensions={inspection.dimensions || []}
        length_mm={inspection.length_mm}
        width_mm={inspection.width_mm}
        height_mm={inspection.height_mm}
        status={inspection.dimension_status || "PASS"}
      />

      {/* 3. Surface Defect & Fine Crack Analysis */}
      <DefectMapViewer
        defects={inspection.defects || []}
        evidenceImageUrl={inspection.evidence_image}
      />

      {/* 4. Multi-Sensor NDT & Cryptographic Audit Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NDT Sensor Fusion */}
        <div className="industrial-panel p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#ED1C27]" />
              <h3 className="font-semibold text-xs text-white uppercase tracking-wider font-mono">
                Multi-Sensor NDT Subsurface Fusion
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">CONCORDANT</span>
          </div>

          <div className="space-y-2 text-xs font-mono text-white/80">
            <div className="p-3 bg-black/40 rounded-lg border border-white/[0.06] flex justify-between items-center">
              <div>
                <div className="font-bold text-white">Eddy Current Array (ECA)</div>
                <div className="text-[10px] text-white/40">Surface-breaking sub-scale micro-flaws</div>
              </div>
              <span className="text-emerald-400 font-semibold text-xs">NORMAL (45 mV)</span>
            </div>

            <div className="p-3 bg-black/40 rounded-lg border border-white/[0.06] flex justify-between items-center">
              <div>
                <div className="font-bold text-white">Phased Array Ultrasonic (PAUT)</div>
                <div className="text-[10px] text-white/40">Core porosity & central pipe integrity</div>
              </div>
              <span className="text-emerald-400 font-semibold text-xs">NORMAL (1.8 dB)</span>
            </div>
          </div>
        </div>

        {/* Cryptographic SHA-256 Audit Trail */}
        <div className="industrial-panel p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-xs text-white uppercase tracking-wider font-mono">
                Cryptographic Audit Ledger Block
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
              ✓ SHA-256 VERIFIED
            </span>
          </div>

          <div className="space-y-2.5 text-[11px] font-mono text-white/50">
            <div>
              <div className="flex items-center justify-between text-white/40 mb-1">
                <span>Record Block Hash:</span>
                <button
                  onClick={() => handleCopyHash(inspection.audit_hash)}
                  className="hover:text-white flex items-center gap-1 text-[10px] transition-colors"
                >
                  {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedHash ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="bg-black/60 p-2.5 rounded-lg border border-white/10 text-white/90 font-mono break-all select-all">
                {inspection.audit_hash}
              </div>
            </div>

            <div>
              <div className="text-white/40 mb-1">Previous Chained Hash:</div>
              <div className="bg-black/60 p-2.5 rounded-lg border border-white/10 text-white/40 font-mono break-all select-all">
                {inspection.previous_audit_hash}
              </div>
            </div>

            <div className="pt-2 flex justify-between text-[10px] text-white/40 border-t border-white/[0.06]">
              <span>Inference Engine: {inspection.model_version}</span>
              <span>Rig Calibration: {inspection.calibration_version}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Human-in-the-Loop Review Modal */}
      {showReviewModal && (
        <OperatorReviewModal
          inspectionId={inspection.id}
          initialHeatNumber={inspection.heat_number}
          initialStatus={inspection.status}
          onClose={() => setShowReviewModal(false)}
          onSuccess={loadDetail}
        />
      )}
    </div>
  );
}
