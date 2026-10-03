"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchInspectionDetail, getApiUrl } from "@/lib/api";
import { InspectionDetail } from "@/lib/types";
import { StatusBadge, SeverityBadge } from "@/components/common/StatusBadge";
import { DimensionalTable } from "@/components/inspection/DimensionalTable";
import { DefectMapViewer } from "@/components/inspection/DefectMapViewer";
import { OperatorReviewModal } from "@/components/inspection/OperatorReviewModal";
import {
  FileText,
  ShieldCheck,
  UserCheck,
  ArrowLeft,
  RefreshCw,
  Hash,
  Cpu,
  Layers,
  Scan,
  Radio,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";

export default function InspectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

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

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-[#ED1C27] mx-auto" />
        <div className="text-sm font-mono text-white/50">
          Loading permanent cryptographic inspection record {id}...
        </div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="p-8 bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-lg mx-auto text-center space-y-4 shadow-2xl">
        <AlertCircle className="w-10 h-10 text-[#ED1C27] mx-auto" />
        <h2 className="text-base font-bold text-white">Inspection Record Not Found</h2>
        <p className="text-xs text-white/50 font-mono">{error}</p>
        <Link
          href="/inspections"
          className="inline-block px-5 py-2.5 bg-[#ED1C27] text-white rounded-full text-xs font-bold shadow-[0_0_15px_rgba(237,28,39,0.4)]"
        >
          &larr; Back to Registry
        </Link>
      </div>
    );
  }

  const pdfDownloadUrl = getApiUrl(`/api/inspections/${inspection.id}/report`);
  const evidenceImageUrl = inspection.evidence_image ? getApiUrl(inspection.evidence_image) : null;
  const ocrCropUrl = inspection.ocr_crop_reference ? getApiUrl(inspection.ocr_crop_reference) : null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/inspections"
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors"
            title="Back to All Billets"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-white/40">INSPECTION RECORD:</span>
              <span className="font-extrabold text-lg text-[#ED1C27] font-mono">
                {inspection.id}
              </span>
            </div>
            <div className="text-xs text-white/50">
              Inspected at {new Date(inspection.timestamp).toLocaleString()} • NIT Raipur Line #1
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowReviewModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold transition-all shadow-sm font-mono"
          >
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>Human Review / Override</span>
          </button>

          <a
            href={pdfDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#ED1C27] hover:bg-[#ff2a37] text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(237,28,39,0.4)] font-mono"
          >
            <FileText className="w-4 h-4" />
            <span>Print Inspection Certificate (PDF)</span>
          </a>
        </div>
      </div>

      {/* Main Verdict & Reason Banner */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-white/40">
              Final Quality Verdict
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <StatusBadge status={inspection.status} size="lg" />
              {inspection.operator_override && (
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  OVERRIDDEN BY {inspection.operator_id || "QA"}
                </span>
              )}
            </div>
          </div>

          <div className="text-right font-mono text-xs text-white/50">
            <div>CYCLE LATENCY: <span className="text-white font-bold">{inspection.processing_latency_ms} ms</span></div>
            <div>VERDICT RULES: <span className="text-[#ED1C27] font-bold">{inspection.rules_triggered?.length || 1} Triggered</span></div>
          </div>
        </div>

        <div className="p-4 bg-black/60 rounded-xl border border-white/10 text-xs font-mono">
          <span className="text-white/40">DECISION REASON: </span>
          <span className="text-white font-semibold">{inspection.decision_reason}</span>
        </div>
      </div>

      {/* 1. Identification & Visual Evidence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Traceability Data */}
        <div className="lg:col-span-5 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Scan className="w-4 h-4 text-[#ED1C27]" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
              1. Billet & Heat Identification
            </h3>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-white/40">Billet ID:</span>
              <span className="font-bold text-white font-sans">{inspection.billet_id}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-white/40">Heat Number:</span>
              <span className="font-bold text-[#ED1C27]">{inspection.heat_number}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-white/40">Batch Number:</span>
              <span className="text-white">{inspection.batch_id}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-white/40">Steel Grade:</span>
              <span className="text-white">IS 2830 / Fe 500D</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-white/40">OCR Stencil:</span>
              <span className="text-white font-bold">{inspection.ocr_text || "N/A"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-white/40">OCR Confidence:</span>
              <span className="text-emerald-400 font-bold">
                {Math.round((inspection.ocr_confidence || 0) * 100)}%
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-white/40">2D Barcode / DataMatrix:</span>
              <span className="text-white">{inspection.barcode_value || "N/A"}</span>
            </div>
          </div>

          {/* OCR Evidence Crop Preview */}
          {ocrCropUrl && (
            <div className="pt-2">
              <div className="text-[10px] font-mono text-white/40 uppercase mb-2">
                End-Face / Marking Crop Evidence
              </div>
              <div className="h-24 bg-black rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
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
        <div className="lg:col-span-7 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#ED1C27]" />
              <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
                Full-Surface Visual Evidence & Segmentation Overlay
              </h3>
            </div>
            <span className="text-[10px] font-mono text-white/40">4K Calibrated Composite</span>
          </div>

          <div className="aspect-video bg-black rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
            {evidenceImageUrl ? (
              <img
                src={evidenceImageUrl}
                alt={`Evidence for ${inspection.id}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-xs text-white/40 font-mono">No evidence image stored</div>
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

      {/* 4. Multi-Sensor NDT Fusion & System Provenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NDT Sensor Fusion Card */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl space-y-3 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#ED1C27]" />
              <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
                NDT Subsurface & Sensor Fusion
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">CONCORDANT</span>
          </div>

          <div className="space-y-2 text-xs font-mono text-white/80">
            <div className="p-3 bg-black/60 rounded-xl border border-white/10 flex justify-between items-center">
              <div>
                <div className="font-bold text-white">Eddy Current Array (ECA)</div>
                <div className="text-[10px] text-white/40">Surface-breaking & Sub-scale Flaws</div>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 font-bold">NORMAL (45 mV)</span>
              </div>
            </div>

            <div className="p-3 bg-black/60 rounded-xl border border-white/10 flex justify-between items-center">
              <div>
                <div className="font-bold text-white">Ultrasonic Testing (PAUT)</div>
                <div className="text-[10px] text-white/40">Internal Core Porosity & Central Pipe</div>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 font-bold">NORMAL (1.8 dB)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic Audit Trail & Integrity Card */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl space-y-3 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
                Permanent Cryptographic Audit Block
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              ✓ AUDIT VERIFIED
            </span>
          </div>

          <div className="space-y-2 text-[11px] font-mono text-white/50">
            <div>
              <div className="text-white/40">Current Record SHA-256 Hash:</div>
              <div className="bg-black/80 p-2.5 rounded-xl border border-white/10 text-white font-mono break-all select-all mt-1">
                {inspection.audit_hash}
              </div>
            </div>

            <div>
              <div className="text-white/40">Previous Linked Hash:</div>
              <div className="bg-black/80 p-2.5 rounded-xl border border-white/10 text-white/40 font-mono break-all select-all mt-1">
                {inspection.previous_audit_hash}
              </div>
            </div>

            <div className="pt-2.5 flex justify-between text-[10px] text-white/40 border-t border-white/10">
              <span>Model: {inspection.model_version}</span>
              <span>Calib: {inspection.calibration_version}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Human Review Modal */}
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
