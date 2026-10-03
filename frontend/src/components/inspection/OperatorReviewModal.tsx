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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/15 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#ED1C27]/20 text-[#ED1C27] border border-[#ED1C27]/40">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Human-in-the-Loop Quality Review
              </h3>
              <div className="text-xs font-mono text-white/50">
                Inspection ID: <span className="text-[#ED1C27] font-bold">{inspectionId}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-[#18090b] border border-[#ED1C27]/60 text-white rounded-xl">
              {error}
            </div>
          )}

          {/* Original Decision Banner */}
          <div className="p-3.5 bg-black/80 border border-white/10 rounded-xl flex items-center justify-between font-mono">
            <span className="text-white/50">Automated AI Decision:</span>
            <span className="font-bold text-amber-400">{initialStatus}</span>
          </div>

          {/* Operator ID */}
          <div className="space-y-1.5">
            <label className="text-white/70 font-semibold block font-mono">Operator Badge / ID</label>
            <input
              type="text"
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-[#ED1C27] focus:ring-1 focus:ring-[#ED1C27] outline-none transition-all"
              required
            />
          </div>

          {/* Disposition Decision Selection */}
          <div className="space-y-1.5">
            <label className="text-white/70 font-semibold block font-mono">Quality Disposition Override</label>
            <div className="grid grid-cols-3 gap-2 font-mono">
              <button
                type="button"
                onClick={() => setDecision("PASS")}
                className={`py-2.5 px-3 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  decision === "PASS"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                    : "bg-black text-white/40 border-white/10"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PASS</span>
              </button>
              <button
                type="button"
                onClick={() => setDecision("REWORK")}
                className={`py-2.5 px-3 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  decision === "REWORK"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                    : "bg-black text-white/40 border-white/10"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>REWORK</span>
              </button>
              <button
                type="button"
                onClick={() => setDecision("FAIL")}
                className={`py-2.5 px-3 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  decision === "FAIL"
                    ? "bg-[#ED1C27]/20 text-white border-[#ED1C27]/50 shadow-[0_0_12px_rgba(237,28,39,0.3)]"
                    : "bg-black text-white/40 border-white/10"
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>REJECT</span>
              </button>
            </div>
          </div>

          {/* Corrected Heat OCR */}
          <div className="space-y-1.5">
            <label className="text-white/70 font-semibold block font-mono">
              Corrected Heat Number Marking (If OCR corrected)
            </label>
            <input
              type="text"
              value={correctedHeat}
              onChange={(e) => setCorrectedHeat(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-[#ED1C27] focus:ring-1 focus:ring-[#ED1C27] outline-none transition-all"
            />
          </div>

          {/* Audit Comment */}
          <div className="space-y-1.5">
            <label className="text-white/70 font-semibold block font-mono">
              Audit Rationale & Justification <span className="text-[#ED1C27]">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Visual verification confirmed superficial mill scale rather than transverse crack. Approved for rolling."
              rows={3}
              className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-sans focus:border-[#ED1C27] focus:ring-1 focus:ring-[#ED1C27] outline-none resize-none transition-all"
              required
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full bg-[#ED1C27] hover:bg-[#ff2a37] text-white font-bold flex items-center gap-1.5 disabled:opacity-50 shadow-[0_0_15px_rgba(237,28,39,0.4)] transition-all font-mono active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? "Committing..." : "Commit Audit Override"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
