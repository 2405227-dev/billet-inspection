"use client";

import React, { useState, useEffect } from "react";
import {
  verifyAuditChain,
  triggerTamperSimulation,
  fetchInspections,
  getApiUrl,
} from "@/lib/api";
import { AuditVerifyResult, InspectionSummary } from "@/lib/types";
import { GlowCard } from "@/components/ui/GlowCard";
import {
  ShieldCheck,
  ShieldAlert,
  FileSpreadsheet,
  FileText,
  Download,
  RefreshCw,
  Lock,
  CheckCircle2,
  Flame,
  Key,
} from "lucide-react";

export default function AuditCenterPage() {
  const [verifyResult, setVerifyResult] = useState<AuditVerifyResult | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [tamperMessage, setTamperMessage] = useState<string | null>(null);

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

  useEffect(() => {
    handleVerify();
    fetchInspections({ limit: 10 }).then(setInspections);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#ED1C27]" />
            <span>Cryptographic Audit & Compliance Center</span>
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Append-Only SHA-256 Hash Chaining • Mathematical Immutability • Anti-Tampering Verification
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ED1C27] hover:bg-[#ff2a37] text-white text-xs font-bold shadow-[0_0_20px_rgba(237,28,39,0.4)] disabled:opacity-50 font-mono transition-all"
          >
            <Key className="w-4 h-4" />
            <span>{isVerifying ? "Verifying Chain..." : "Verify Audit Chain"}</span>
          </button>

          <button
            onClick={handleTamperTest}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/5 hover:bg-rose-950 text-white/70 hover:text-rose-300 border border-white/10 hover:border-rose-500/40 text-xs font-semibold font-mono transition-all"
            title="Demonstrate Tamper Detection"
          >
            <Flame className="w-3.5 h-3.5 text-[#ED1C27]" />
            <span>Simulate DB Tamper</span>
          </button>
        </div>
      </div>

      {/* Verification Status Callout Card */}
      {verifyResult && (
        <div
          className={`border rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-xl ${
            verifyResult.is_valid
              ? "bg-[#07130c]/90 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
              : "bg-[#18090b]/90 border-[#ED1C27]/50 shadow-[0_0_30px_rgba(237,28,39,0.25)]"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {verifyResult.is_valid ? (
                <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              ) : (
                <div className="p-3 bg-[#ED1C27]/20 rounded-2xl text-[#ED1C27] border border-[#ED1C27]/40">
                  <ShieldAlert className="w-8 h-8 animate-pulse" />
                </div>
              )}
              <div>
                <h2
                  className={`text-lg font-black tracking-wider uppercase font-mono ${
                    verifyResult.is_valid ? "text-emerald-300" : "text-[#ED1C27]"
                  }`}
                >
                  {verifyResult.is_valid ? "✓ AUDIT CHAIN VALID & VERIFIED" : "⚠ AUDIT INTEGRITY FAILURE"}
                </h2>
                <div className="text-xs text-white/70 font-mono mt-1">
                  {verifyResult.message}
                </div>
              </div>
            </div>

            <div className="text-right font-mono text-xs text-white/50">
              <div>VERIFIED RECORDS: <span className="text-white font-bold">{verifyResult.total_records}</span></div>
              <div>VERIFIED AT: <span className="text-white/70">{new Date(verifyResult.verified_at).toLocaleTimeString()}</span></div>
            </div>
          </div>

          {tamperMessage && (
            <div className="p-3.5 bg-black/80 rounded-xl border border-white/10 text-xs font-mono text-amber-300">
              Demo Test Action: {tamperMessage}
            </div>
          )}
        </div>
      )}

      {/* Export & Audit Reports Hub */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[#ED1C27]" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
              Official Quality Audit Downloads & Exports
            </h3>
          </div>
          <span className="text-[10px] font-mono text-white/40">OpenPyXL & ReportLab Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Excel Export */}
          <a
            href={getApiUrl("/api/export/excel")}
            download="billet_inspection_audit.xlsx"
            className="p-5 bg-black/60 hover:bg-black border border-white/10 hover:border-emerald-500/50 rounded-2xl flex flex-col justify-between space-y-4 transition-all group"
          >
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                XLSX
              </span>
            </div>
            <div>
              <div className="font-bold text-xs text-white group-hover:text-emerald-300 transition-colors">
                Master Audit Workbook
              </div>
              <div className="text-[10px] text-white/40 mt-1">
                3-Sheet Excel (Inspection Audit, Defect Details, Summary)
              </div>
            </div>
          </a>

          {/* Batch PDF Report */}
          <a
            href={getApiUrl("/api/export/pdf")}
            target="_blank"
            rel="noreferrer"
            className="p-5 bg-black/60 hover:bg-black border border-white/10 hover:border-[#ED1C27]/60 rounded-2xl flex flex-col justify-between space-y-4 transition-all group"
          >
            <div className="flex items-center justify-between">
              <FileText className="w-6 h-6 text-[#ED1C27]" />
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ED1C27]/20 text-[#ED1C27] border border-[#ED1C27]/40">
                PDF
              </span>
            </div>
            <div>
              <div className="font-bold text-xs text-white group-hover:text-[#ED1C27] transition-colors">
                Comprehensive Batch Report
              </div>
              <div className="text-[10px] text-white/40 mt-1">
                Full printable audit report with KPI summary table
              </div>
            </div>
          </a>

          {/* Inspections CSV */}
          <a
            href={getApiUrl("/api/export/csv?export_type=inspections")}
            download="inspection_audit.csv"
            className="p-5 bg-black/60 hover:bg-black border border-white/10 hover:border-white/20 rounded-2xl flex flex-col justify-between space-y-4 transition-all group"
          >
            <div className="flex items-center justify-between">
              <Download className="w-6 h-6 text-white/60" />
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/15">
                CSV
              </span>
            </div>
            <div>
              <div className="font-bold text-xs text-white group-hover:text-white/90">
                Inspections Raw CSV
              </div>
              <div className="text-[10px] text-white/40 mt-1">
                Standard flat data for enterprise ERP / MES ingestion
              </div>
            </div>
          </a>

          {/* Defect Details CSV */}
          <a
            href={getApiUrl("/api/export/csv?export_type=defects")}
            download="defect_details.csv"
            className="p-5 bg-black/60 hover:bg-black border border-white/10 hover:border-white/20 rounded-2xl flex flex-col justify-between space-y-4 transition-all group"
          >
            <div className="flex items-center justify-between">
              <Download className="w-6 h-6 text-white/60" />
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/15">
                CSV
              </span>
            </div>
            <div>
              <div className="font-bold text-xs text-white group-hover:text-white/90">
                Defect Breakdown CSV
              </div>
              <div className="text-[10px] text-white/40 mt-1">
                Granular micro-flaw dimensions, coordinates & crops
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* SHA-256 Hash Chaining Visualizer */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#ED1C27]" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
              Cryptographic Audit Chain Block Explorer (Recent 10 Blocks)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-white/40">SHA-256(H_(n-1) + Record_n)</span>
        </div>

        <div className="space-y-2.5">
          {inspections.map((ins) => (
            <div
              key={ins.id}
              className="p-3.5 bg-black/60 border border-white/10 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono"
            >
              <div className="flex items-center gap-3">
                <span className="text-[#ED1C27] font-bold">{ins.id}</span>
                <span className="text-white font-sans font-semibold">{ins.billet_id}</span>
                <span className="text-white/50">({ins.heat_number})</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    ins.status === "PASS"
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                      : "bg-[#ED1C27]/15 text-[#ED1C27] border-[#ED1C27]/40"
                  }`}
                >
                  {ins.status}
                </span>
              </div>

              <div className="text-white/50 text-[11px] truncate max-w-md">
                <span className="text-white/30">HASH: </span>
                <span className="text-white select-all">{ins.audit_hash}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
