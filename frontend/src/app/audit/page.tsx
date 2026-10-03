"use client";

import React, { useState, useEffect } from "react";
import {
  verifyAuditChain,
  triggerTamperSimulation,
  fetchInspections,
  getApiUrl,
} from "@/lib/api";
import { AuditVerifyResult, InspectionSummary } from "@/lib/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  ShieldCheck,
  ShieldAlert,
  FileSpreadsheet,
  FileText,
  Download,
  Key,
  Flame,
  Copy,
  Check,
} from "lucide-react";

export default function AuditCenterPage() {
  const [verifyResult, setVerifyResult] = useState<AuditVerifyResult | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [tamperMessage, setTamperMessage] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    setTamperMessage(null);
    try {
      const res = await verifyAuditChain();
      setVerifyResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTamperTest = async () => {
    try {
      const res = await triggerTamperSimulation();
      setTamperMessage(res.message);
      const verifyRes = await verifyAuditChain();
      setVerifyResult(verifyRes);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  useEffect(() => {
    handleVerify();
    fetchInspections({ limit: 12 }).then(setInspections);
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 uppercase tracking-wider mb-1">
            <span>AUDIT LOG</span>
            <span>·</span>
            <span className="text-[#ED1C27] font-semibold">CRYPTOGRAPHIC IMMUTABILITY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Traceability & Audit Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Append-Only SHA-256 Hash Chaining · Mathematical Immutability · Anti-Tampering Verification
          </p>
        </div>

        <div className="flex items-center gap-2.5 font-mono text-xs">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#ED1C27] hover:bg-[#ff2a37] text-white font-bold transition-colors disabled:opacity-50"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{isVerifying ? "VERIFYING..." : "VERIFY AUDIT CHAIN"}</span>
          </button>

          <button
            onClick={handleTamperTest}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 transition-colors"
            title="Demonstrate Tamper Detection"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>SIMULATE TAMPER</span>
          </button>
        </div>
      </div>

      {/* Top 4 Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
        <div className="bg-[#0c0e14] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] text-slate-500 block uppercase">TOTAL RECORDS</span>
          <span className="text-xl font-bold text-white mt-1 block">
            {verifyResult?.total_records || inspections.length}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">100% Chained</span>
        </div>

        <div className="bg-[#0c0e14] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] text-slate-500 block uppercase">VERIFIED RECORDS</span>
          <span className="text-xl font-bold text-emerald-400 mt-1 block">
            {verifyResult?.is_valid ? verifyResult.total_records : 0}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Deterministic</span>
        </div>

        <div className="bg-[#0c0e14] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] text-slate-500 block uppercase">INTEGRITY ISSUES</span>
          <span className={`text-xl font-bold mt-1 block ${verifyResult?.is_valid ? "text-slate-200" : "text-[#ED1C27]"}`}>
            {verifyResult?.is_valid ? "0" : "1 DETECTED"}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Anti-Tamper Monitor</span>
        </div>

        <div className="bg-[#0c0e14] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] text-slate-500 block uppercase">LAST VERIFICATION</span>
          <span className="text-sm font-bold text-slate-200 mt-1 block truncate">
            {verifyResult ? new Date(verifyResult.verified_at).toLocaleTimeString() : "PENDING"}
          </span>
          <span className="text-[10px] text-emerald-400 mt-0.5 block">SHA-256 Validated</span>
        </div>
      </div>

      {tamperMessage && (
        <div className="p-3 bg-[#0c0e14] border border-amber-500/30 text-amber-300 rounded-lg text-xs font-mono">
          Demo Test Action: {tamperMessage}
        </div>
      )}

      {/* Vertical Cryptographic Audit Timeline */}
      <div className="bg-[#0c0e14] border border-white/[0.08] rounded-xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <span className="font-bold text-xs text-white uppercase tracking-wider font-mono">
            CRYPTOGRAPHIC AUDIT CHAIN (RECENT BLOCKS)
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            SHA-256(H_(n-1) + Record_n)
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {inspections.map((ins, idx) => (
            <div
              key={ins.id}
              className="p-3.5 bg-[#08090d] border border-white/[0.05] hover:border-white/15 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-[11px]">
                  {new Date(ins.timestamp).toLocaleTimeString()}
                </span>
                <span className="font-bold text-slate-200">{ins.id}</span>
                <span className="text-white font-bold">{ins.billet_id}</span>
                <span className="text-slate-400">({ins.heat_number})</span>
                <StatusBadge status={ins.status} size="sm" />
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="text-slate-600">HASH:</span>
                <span className="text-slate-300 font-mono">
                  {ins.audit_hash ? `${ins.audit_hash.substring(0, 16)}...${ins.audit_hash.substring(56)}` : "GEN-v2"}
                </span>
                <button
                  onClick={() => ins.audit_hash && handleCopy(ins.audit_hash)}
                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Copy Full SHA-256 Hash"
                >
                  {copiedHash === ins.audit_hash ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
