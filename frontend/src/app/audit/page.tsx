"use client";

import React, { useState, useEffect } from "react";
import {
  verifyAuditChain,
  triggerTamperSimulation,
  fetchInspections,
  getApiUrl,
} from "@/lib/api";
import { AuditVerifyResult, InspectionSummary } from "@/lib/types";
import {
  ShieldCheck,
  ShieldAlert,
  FileSpreadsheet,
  FileText,
  Download,
  RefreshCw,
  Lock,
  CheckCircle2,
  AlertTriangle,
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
      // Re-run verify to demonstrate instant detection
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>Permanent Cryptographic Audit Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Append-Only SHA-256 Hash Chaining • Mathematical Immutability • Anti-Tampering Verification
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 disabled:opacity-50"
          >
            <Key className="w-4 h-4" />
            <span>{isVerifying ? "Verifying SHA-256..." : "Verify Audit Chain"}</span>
          </button>

          <button
            onClick={handleTamperTest}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700 text-xs font-semibold"
            title="Demonstrate Tamper Detection"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate DB Tamper</span>
          </button>
        </div>
      </div>

      {/* Verification Status Callout Card */}
      {verifyResult && (
        <div
          className={`border-2 rounded-xl p-6 shadow-xl space-y-3 ${
            verifyResult.is_valid
              ? "bg-emerald-950/40 border-emerald-600/80"
              : "bg-rose-950/40 border-rose-600/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {verifyResult.is_valid ? (
                <div className="p-3 bg-emerald-900/60 rounded-xl text-emerald-400 border border-emerald-700">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
              ) : (
                <div className="p-3 bg-rose-900/60 rounded-xl text-rose-400 border border-rose-700">
                  <ShieldAlert className="w-7 h-7 animate-pulse" />
                </div>
              )}
              <div>
                <h2
                  className={`text-lg font-extrabold tracking-wider uppercase font-mono ${
                    verifyResult.is_valid ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {verifyResult.is_valid ? "✓ AUDIT VERIFIED" : "⚠ AUDIT INTEGRITY FAILURE"}
                </h2>
                <div className="text-xs text-slate-300 font-mono mt-0.5">
                  {verifyResult.message}
                </div>
              </div>
            </div>

            <div className="text-right font-mono text-xs text-slate-400">
              <div>VERIFIED RECORDS: <span className="text-slate-100 font-bold">{verifyResult.total_records}</span></div>
              <div>VERIFIED AT: <span className="text-slate-300">{new Date(verifyResult.verified_at).toLocaleTimeString()}</span></div>
            </div>
          </div>

          {tamperMessage && (
            <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800 text-xs font-mono text-amber-300">
              Demo Test Action: {tamperMessage}
            </div>
          )}
        </div>
      )}

      {/* Export & Audit Reports Hub */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
              Official Quality Audit Downloads & Exports
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">OpenPyXL & ReportLab Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Excel Export */}
          <a
            href={getApiUrl("/api/export/excel")}
            download="billet_inspection_audit.xlsx"
            className="p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-600/60 rounded-xl flex flex-col justify-between space-y-3 transition-all group"
          >
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                XLSX
              </span>
            </div>
            <div>
              <div className="font-bold text-xs text-slate-200 group-hover:text-emerald-300">
                Master Audit Workbook
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                3-Sheet Excel (Inspection Audit, Defect Details, Summary)
              </div>
            </div>
          </a>

          {/* Batch PDF Report */}
          <a
            href={getApiUrl("/api/export/pdf")}
            target="_blank"
            rel="noreferrer"
            className="p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-600/60 rounded-xl flex flex-col justify-between space-y-3 transition-all group"
          >
            <div className="flex items-center justify-between">
              <FileText className="w-6 h-6 text-cyan-400" />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                PDF
              </span>
            </div>
            <div>
              <div className="font-bold text-xs text-slate-200 group-hover:text-cyan-300">
                Comprehensive Batch Report
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Full printable audit report with KPI summary table
              </div>
            </div>
          </a>

          {/* Inspections CSV */}
          <a
            href={getApiUrl("/api/export/csv?export_type=inspections")}
            download="inspection_audit.csv"
            className="p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col justify-between space-y-3 transition-all group"
          >
            <div className="flex items-center justify-between">
              <Download className="w-6 h-6 text-slate-300" />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                CSV
              </span>
            </div>
            <div>
              <div className="font-bold text-xs text-slate-200 group-hover:text-white">
                Inspections Raw CSV
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Standard flat data for enterprise ERP / MES ingestion
              </div>
            </div>
          </a>

          {/* Defect Details CSV */}
          <a
            href={getApiUrl("/api/export/csv?export_type=defects")}
            download="defect_details.csv"
            className="p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col justify-between space-y-3 transition-all group"
          >
            <div className="flex items-center justify-between">
              <Download className="w-6 h-6 text-slate-300" />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                CSV
              </span>
            </div>
            <div>
              <div className="font-bold text-xs text-slate-200 group-hover:text-white">
                Defect Breakdown CSV
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Granular micro-flaw dimensions, coordinates & crops
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* SHA-256 Hash Chaining Visualizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
              Cryptographic Audit Chain Block Explorer (Recent 10 Blocks)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">SHA-256(H_(n-1) + Record_n)</span>
        </div>

        <div className="space-y-2.5">
          {inspections.map((ins, idx) => (
            <div
              key={ins.id}
              className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono"
            >
              <div className="flex items-center gap-3">
                <span className="text-cyan-400 font-bold">{ins.id}</span>
                <span className="text-slate-200 font-sans font-semibold">{ins.billet_id}</span>
                <span className="text-slate-400">({ins.heat_number})</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    ins.status === "PASS"
                      ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                      : "bg-rose-950 text-rose-400 border-rose-800"
                  }`}
                >
                  {ins.status}
                </span>
              </div>

              <div className="text-slate-400 text-[11px] truncate max-w-md">
                <span className="text-slate-600">HASH: </span>
                <span className="text-cyan-300 select-all">{ins.audit_hash}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
