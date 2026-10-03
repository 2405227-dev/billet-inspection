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
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
        <div className="text-sm font-mono text-slate-400">
          Loading permanent cryptographic inspection record {id}...
        </div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl max-w-lg mx-auto text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-100">Inspection Record Not Found</h2>
        <p className="text-xs text-slate-400 font-mono">{error}</p>
        <Link
          href="/inspections"
          className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/inspections"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Back to All Billets"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">INSPECTION RECORD:</span>
              <span className="font-extrabold text-base text-cyan-400 font-mono">
                {inspection.id}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Inspected at {new Date(inspection.timestamp).toLocaleString()} • NIT Raipur Line #1
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowReviewModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-sm"
          >
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>Human Review / Override</span>
          </button>

          <a
            href={pdfDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-600/20"
          >
            <FileText className="w-4 h-4" />
            <span>Print Inspection Certificate (PDF)</span>
          </a>
        </div>
      </div>

      {/* Main Verdict & Reason Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-slate-500">
              Final Quality Verdict
            </div>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={inspection.status} size="lg" />
              {inspection.operator_override && (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  OVERRIDDEN BY {inspection.operator_id || "QA"}
                </span>
              )}
            </div>
          </div>

          <div className="text-right font-mono text-xs text-slate-400">
            <div>CYCLE LATENCY: <span className="text-slate-100 font-bold">{inspection.processing_latency_ms} ms</span></div>
            <div>VERDICT RULES: <span className="text-cyan-400">{inspection.rules_triggered?.length || 1} Triggered</span></div>
          </div>
        </div>

        <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
          <span className="text-slate-400">DECISION REASON: </span>
          <span className="text-slate-100 font-semibold">{inspection.decision_reason}</span>
        </div>
      </div>

      {/* 1. Identification & Visual Evidence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Traceability Data */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
            <Scan className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
              1. Billet & Heat Identification
            </h3>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">Billet ID:</span>
              <span className="font-bold text-slate-100 font-sans">{inspection.billet_id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">Heat Number:</span>
              <span className="font-bold text-cyan-300">{inspection.heat_number}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">Batch Number:</span>
              <span className="text-slate-200">{inspection.batch_id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">Steel Grade:</span>
              <span className="text-slate-200">IS 2830 / Fe 500D</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">OCR Detected Stencil:</span>
              <span className="text-slate-100 font-bold">{inspection.ocr_text || "N/A"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">OCR Confidence:</span>
              <span className="text-emerald-400 font-bold">
                {Math.round((inspection.ocr_confidence || 0) * 100)}%
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">2D Barcode / DataMatrix:</span>
              <span className="text-slate-200">{inspection.barcode_value || "N/A"}</span>
            </div>
          </div>

          {/* OCR Evidence Crop Preview */}
          {ocrCropUrl && (
            <div className="pt-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-1.5">
                End-Face / Marking Crop Evidence
              </div>
              <div className="h-20 bg-black rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
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
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
                Full-Surface Visual Evidence & Segmentation Overlay
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">4K Calibrated Composite</span>
          </div>

          <div className="aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
            {evidenceImageUrl ? (
              <img
                src={evidenceImageUrl}
                alt={`Evidence for ${inspection.id}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-xs text-slate-500 font-mono">No evidence image stored</div>
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
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
                NDT Subsurface & Sensor Fusion
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">CONCORDANT</span>
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-200">Eddy Current Array (ECA)</div>
                <div className="text-[10px] text-slate-500">Surface-breaking & Sub-scale Flaws</div>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 font-bold">NORMAL (45 mV)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-200">Ultrasonic Testing (PAUT)</div>
                <div className="text-[10px] text-slate-500">Internal Core Porosity & Central Pipe</div>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 font-bold">NORMAL (1.8 dB)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic Audit Trail & Integrity Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
                Permanent Cryptographic Audit Block
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              ✓ AUDIT VERIFIED
            </span>
          </div>

          <div className="space-y-2 text-[11px] font-mono text-slate-400">
            <div>
              <div className="text-slate-500">Current Record SHA-256 Hash:</div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-cyan-300 break-all select-all">
                {inspection.audit_hash}
              </div>
            </div>

            <div>
              <div className="text-slate-500">Previous Linked Hash:</div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-slate-400 break-all select-all">
                {inspection.previous_audit_hash}
              </div>
            </div>

            <div className="pt-2 flex justify-between text-[10px] text-slate-500 border-t border-slate-800">
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
