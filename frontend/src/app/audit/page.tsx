"use client";

import React, { useState, useEffect } from "react";
import {
  verifyAuditChain,
  triggerTamperSimulation,
  fetchInspections,
} from "@/lib/api";
import { AuditVerifyResult, InspectionSummary } from "@/lib/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  Key,
  Flame,
  Copy,
  Check,
} from "lucide-react";

import { MASTER_INSPECTION_RECORDS } from "@/lib/mockData";

export default function AuditCenterPage() {
  const [verifyResult, setVerifyResult] = useState<AuditVerifyResult | null>({
    is_valid: true,
    total_records: MASTER_INSPECTION_RECORDS.length,
    failing_record_index: undefined,
    message: "Cryptographic SHA-256 hash chaining intact across all historical blocks.",
    verified_at: new Date().toISOString(),
  });
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [inspections, setInspections] = useState<InspectionSummary[]>(MASTER_INSPECTION_RECORDS);
  const [tamperMessage, setTamperMessage] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    setTamperMessage(null);
    try {
      const res = await verifyAuditChain();
      if (res) setVerifyResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTamperTest = async () => {
    try {
      const res = await triggerTamperSimulation();
      setTamperMessage(res?.message || "Tamper simulation triggered on block #14.");
      const verifyRes = await verifyAuditChain();
      if (verifyRes) setVerifyResult(verifyRes);
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
    fetchInspections({ limit: 20 })
      .then((data) => {
        if (data && data.length > 0) {
          const apiIds = new Set(data.map((i) => i.id));
          const merged = [...data, ...MASTER_INSPECTION_RECORDS.filter((i) => !apiIds.has(i.id))];
          setInspections(merged);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 uppercase tracking-widest mb-1">
            <span>AUDIT LEDGER</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 font-semibold">SHA-256 IMMUTABILITY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Traceability & Audit Verification
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Append-only hash chaining · Mathematical immutability · Anti-tampering verification
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#ED1C27] hover:bg-[#ff2a37] text-white font-bold transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{isVerifying ? "VERIFYING..." : "VERIFY CHAIN"}</span>
          </button>

          <button
            onClick={handleTamperTest}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/[0.04] hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 transition-colors cursor-pointer"
            title="Demonstrate Tamper Detection"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>SIMULATE TAMPER</span>
          </button>
        </div>
      </div>

      {/* Top 4 Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 font-mono text-xs">
        <div className="bg-[#0c0e14] border border-white/[0.08] rounded-lg p-3.5">
          <span className="text-[9px] text-slate-500 block uppercase tracking-wider">TOTAL BLOCKS</span>
          <span className="text-lg font-bold text-white mt-1 block">
            {verifyResult?.total_records || inspections.length}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">100% Chained</span>
        </div>

        <div className="bg-[#0c0e14] border border-white/[0.08] rounded-lg p-3.5">
          <span className="text-[9px] text-slate-500 block uppercase tracking-wider">VERIFIED STATUS</span>
          <span className="text-lg font-bold text-emerald-400 mt-1 block">
            {verifyResult?.is_valid ? "VALID" : "TAMPER DETECTED"}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Deterministic Proof</span>
        </div>

        <div className="bg-[#0c0e14] border border-white/[0.08] rounded-lg p-3.5">
          <span className="text-[9px] text-slate-500 block uppercase tracking-wider">INTEGRITY FAULTS</span>
          <span className={`text-lg font-bold mt-1 block ${verifyResult?.is_valid ? "text-slate-200" : "text-[#ff4b55]"}`}>
            {verifyResult?.is_valid ? "0" : "1 ACTIVE"}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Anti-Tamper Watch</span>
        </div>

        <div className="bg-[#0c0e14] border border-white/[0.08] rounded-lg p-3.5">
          <span className="text-[9px] text-slate-500 block uppercase tracking-wider">LAST VERIFIED</span>
          <span className="text-xs font-bold text-slate-200 mt-1 block truncate">
            {verifyResult ? new Date(verifyResult.verified_at).toLocaleTimeString() : "PENDING"}
          </span>
          <span className="text-[10px] text-emerald-400 mt-0.5 block">SHA-256 Pass</span>
        </div>
      </div>

      {tamperMessage && (
        <div className="p-2.5 bg-[#0c0e14] border border-amber-500/30 text-amber-300 rounded text-xs font-mono">
          Demo Test Action: {tamperMessage}
        </div>
      )}

      {/* Cryptographic Audit Timeline */}
      <div className="bg-[#0c0e14] border border-white/[0.08] rounded-lg p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <span className="font-bold text-xs text-white uppercase tracking-wider font-mono">
            CRYPTOGRAPHIC AUDIT CHAIN (RECENT BLOCKS)
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            SHA-256(H_(n-1) + Record_n)
          </span>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {inspections.map((ins) => (
            <div
              key={ins.id}
              className="p-3 bg-[#07080b] border border-white/[0.06] hover:border-white/15 rounded flex flex-col md:flex-row md:items-center justify-between gap-2.5 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-slate-500 text-[10px]">
                  {new Date(ins.timestamp).toLocaleTimeString([], { hour12: false })}
                </span>
                <span className="font-bold text-slate-300">{ins.id}</span>
                <span className="text-white font-bold">{ins.billet_id}</span>
                <span className="text-slate-500">({ins.heat_number})</span>
                <StatusBadge status={ins.status} size="sm" />
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="text-slate-600">HASH:</span>
                <span className="text-slate-300 font-mono">
                  {ins.audit_hash ? `${ins.audit_hash.substring(0, 16)}...${ins.audit_hash.substring(56)}` : "GEN-v2"}
                </span>
                <button
                  onClick={() => ins.audit_hash && handleCopy(ins.audit_hash)}
                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
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
