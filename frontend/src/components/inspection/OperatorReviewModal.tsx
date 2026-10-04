"use client";

import React, { useState } from "react";
import { submitOperatorReview } from "@/lib/api";
import { UserCheck, X, CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from "lucide-react";

interface OperatorReviewModalProps {
  inspectionId: string;
  initialHeatNumber: string;
  initialStatus: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const OperatorReviewModal: React.FC<OperatorReviewModalProps> = ({
  inspectionId,
  initialHeatNumber,
  initialStatus,
  onClose,
  onSuccess,
}) => {
  const [operatorId, setOperatorId] = useState<string>("OP-104");
  const [decision, setDecision] = useState<string>("PASS");
  const [correctedHeat, setCorrectedHeat] = useState<string>(initialHeatNumber);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Please provide an audit comment explaining the disposition.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitOperatorReview(inspectionId, {
        operator_id: operatorId,
        decision,
        corrected_ocr_heat: correctedHeat !== initialHeatNumber ? correctedHeat : undefined,
        comment,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0c0e14] border border-white/[0.12] rounded-lg max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-white/[0.06] text-slate-300 border border-white/10">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white font-sans">
                Human-in-the-Loop Quality Override
              </h3>
              <div className="text-[10px] text-slate-400">
                RECORD ID: <span className="text-white font-bold">{inspectionId}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="p-2.5 bg-[#18090b] border border-[#ED1C27]/40 text-[#ff4b55] rounded text-[11px]">
              {error}
            </div>
          )}

          {/* Original Decision Banner */}
          <div className="p-2.5 bg-[#07080b] border border-white/[0.06] rounded flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">AUTOMATED VERDICT:</span>
            <span className="font-bold text-amber-400 text-[11px]">{initialStatus}</span>
          </div>

          {/* Operator ID */}
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold block text-[10px] uppercase">OPERATOR BADGE / ID</label>
            <input
              type="text"
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              className="w-full bg-[#07080b] border border-white/10 rounded px-3 py-2 text-white font-mono focus:border-[#ED1C27] outline-none transition-colors text-xs"
              required
            />
          </div>

          {/* Disposition Decision Selection */}
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold block text-[10px] uppercase">DISPOSITION OVERRIDE</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDecision("PASS")}
                className={`py-2 px-2.5 rounded font-bold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs ${
                  decision === "PASS"
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                    : "bg-[#07080b] text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PASS</span>
              </button>
              <button
                type="button"
                onClick={() => setDecision("REWORK")}
                className={`py-2 px-2.5 rounded font-bold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs ${
                  decision === "REWORK"
                    ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                    : "bg-[#07080b] text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>REWORK</span>
              </button>
              <button
                type="button"
                onClick={() => setDecision("FAIL")}
                className={`py-2 px-2.5 rounded font-bold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs ${
                  decision === "FAIL"
                    ? "bg-[#ED1C27]/15 text-[#ff4b55] border-[#ED1C27]/40"
                    : "bg-[#07080b] text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>REJECT</span>
              </button>
            </div>
          </div>

          {/* Corrected Heat OCR */}
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold block text-[10px] uppercase">
              CORRECTED HEAT NUMBER (OPTIONAL)
            </label>
            <input
              type="text"
              value={correctedHeat}
              onChange={(e) => setCorrectedHeat(e.target.value)}
              className="w-full bg-[#07080b] border border-white/10 rounded px-3 py-2 text-white font-mono focus:border-[#ED1C27] outline-none transition-colors text-xs"
            />
          </div>

          {/* Audit Comment */}
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold block text-[10px] uppercase">
              AUDIT RATIONALE & JUSTIFICATION <span className="text-[#ED1C27]">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Visual verification confirmed superficial mill scale rather than transverse crack. Approved for rolling."
              rows={3}
              className="w-full bg-[#07080b] border border-white/10 rounded px-3 py-2 text-slate-200 font-sans focus:border-[#ED1C27] outline-none resize-none transition-colors text-xs"
              required
            />
          </div>

          <div className="pt-2.5 flex items-center justify-end gap-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded bg-[#ED1C27] hover:bg-[#ff2a37] text-white font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors font-mono cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "COMMITTING..." : "COMMIT OVERRIDE"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

