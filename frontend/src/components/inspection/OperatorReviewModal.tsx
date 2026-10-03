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
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                Human-in-the-Loop Quality Review
              </h3>
              <div className="text-xs font-mono text-slate-400">
                Inspection ID: <span className="text-cyan-300">{inspectionId}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-700 text-rose-300 rounded-lg">
              {error}
            </div>
          )}

          {/* Original Decision Banner */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between font-mono">
            <span className="text-slate-400">Automated AI Decision:</span>
            <span className="font-bold text-amber-400">{initialStatus}</span>
          </div>

          {/* Operator ID */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">Operator Badge / ID</label>
            <input
              type="text"
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 outline-none"
              required
            />
          </div>

          {/* Disposition Decision Selection */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">Quality Disposition Override</label>
            <div className="grid grid-cols-3 gap-2 font-mono">
              <button
                type="button"
                onClick={() => setDecision("PASS")}
                className={`py-2 px-3 rounded-lg font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  decision === "PASS"
                    ? "bg-emerald-950 text-emerald-300 border-emerald-600 shadow-sm"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PASS</span>
              </button>
              <button
                type="button"
                onClick={() => setDecision("REWORK")}
                className={`py-2 px-3 rounded-lg font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  decision === "REWORK"
                    ? "bg-amber-950 text-amber-300 border-amber-600 shadow-sm"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>REWORK</span>
              </button>
              <button
                type="button"
                onClick={() => setDecision("FAIL")}
                className={`py-2 px-3 rounded-lg font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  decision === "FAIL"
                    ? "bg-rose-950 text-rose-300 border-rose-600 shadow-sm"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>REJECT</span>
              </button>
            </div>
          </div>

          {/* Corrected Heat OCR (optional) */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">
              Corrected Heat Number Marking (If OCR corrected)
            </label>
            <input
              type="text"
              value={correctedHeat}
              onChange={(e) => setCorrectedHeat(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 outline-none"
            />
          </div>

          {/* Audit Comment */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">
              Audit Rationale & Justification <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Visual verification confirmed superficial mill scale rather than transverse crack. Approved for rolling."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 font-sans focus:border-cyan-500 outline-none resize-none"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 disabled:opacity-50"
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
