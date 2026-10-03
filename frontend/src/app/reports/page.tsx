"use client";

import React, { useState } from "react";
import { getApiUrl } from "@/lib/api";
import { GlowCard } from "@/components/ui/GlowCard";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Filter,
  Layers,
} from "lucide-react";

export default function ReportsGeneratorPage() {
  const [heatNumber, setHeatNumber] = useState<string>("");
  const [status, setStatus] = useState<string>("ALL");

  const buildQuery = (base: string) => {
    const params = new URLSearchParams();
    if (heatNumber.trim()) params.append("heat_number", heatNumber.trim());
    if (status !== "ALL") params.append("status", status);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const excelUrl = getApiUrl(buildQuery("/api/export/excel"));
  const csvUrl = getApiUrl(buildQuery("/api/export/csv?export_type=inspections"));
  const defectCsvUrl = getApiUrl(buildQuery("/api/export/csv?export_type=defects"));
  const batchPdfUrl = getApiUrl(buildQuery("/api/export/pdf"));

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <FileSpreadsheet className="w-6 h-6 text-[#ED1C27]" />
          <span>Metallurgical Audit Reports & Data Export Center</span>
        </h1>
        <p className="text-xs text-white/50 mt-1">
          Generate filtered Excel workbooks, batch audit certificates, and ERP data feeds
        </p>
      </div>

      {/* Filter Parameters */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Filter className="w-4 h-4 text-[#ED1C27]" />
          <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
            Report Scope & Filter Criteria
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="space-y-1.5">
            <label className="text-white/70 font-sans font-semibold block">
              Filter by Heat Number (Optional)
            </label>
            <input
              type="text"
              value={heatNumber}
              onChange={(e) => setHeatNumber(e.target.value)}
              placeholder="e.g. 26A-1042 (Leave empty for all heats)"
              className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ED1C27] focus:ring-1 focus:ring-[#ED1C27] outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-white/70 font-sans font-semibold block">
              Filter by Quality Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ED1C27] outline-none transition-all"
            >
              <option value="ALL">All Verdicts (PASS, REWORK, FAIL)</option>
              <option value="PASS">PASS Only (First-time Yield)</option>
              <option value="REWORK">REWORK Only (Grinding queue)</option>
              <option value="FAIL">FAIL Only (Rejected billets)</option>
              <option value="NEEDS_REVIEW">NEEDS REVIEW Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Multi-Sheet Excel */}
        <GlowCard glowColor="emerald" className="bg-[#0a0a0a] border-white/10 p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                XLSX
              </span>
            </div>
            <h3 className="font-bold text-base text-white font-sans">
              Complete Billet Inspection Audit Workbook
            </h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Generates official 3-sheet Excel spreadsheet with individual billet rows, micro-defect details, and aggregated yield summary statistics.
            </p>
          </div>

          <a
            href={excelUrl}
            download="billet_inspection_audit.xlsx"
            className="w-full py-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 rounded-full text-xs font-bold text-center flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] font-mono transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Audit Excel (.xlsx)</span>
          </a>
        </GlowCard>

        {/* 2. Comprehensive Batch PDF Report */}
        <GlowCard glowColor="rose" className="bg-[#0a0a0a] border-white/10 p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <FileText className="w-8 h-8 text-[#ED1C27]" />
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#ED1C27]/20 text-[#ED1C27] border border-[#ED1C27]/40">
                PDF
              </span>
            </div>
            <h3 className="font-bold text-base text-white font-sans">
              Comprehensive Printable Batch Audit Certificate
            </h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Official PDF certificate with plant header, KPI yield summary, metallurgical defect tables, and permanent QA audit signatures.
            </p>
          </div>

          <a
            href={batchPdfUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 bg-[#ED1C27] hover:bg-[#ff2a37] text-white rounded-full text-xs font-bold text-center flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(237,28,39,0.4)] font-mono transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Generate Batch PDF Report</span>
          </a>
        </GlowCard>
      </div>
    </div>
  );
}
