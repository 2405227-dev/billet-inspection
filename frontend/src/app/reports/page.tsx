"use client";

import React, { useState } from "react";
import { getApiUrl } from "@/lib/api";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Filter,
  Layers,
  FileCheck,
  Shield,
  Calendar,
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

  const reportCards = [
    {
      title: "DAILY PRODUCTION REPORT",
      desc: "Complete 24-hour summary of cooling-bed inspections, first-pass yield, and dimensional variance breakdown.",
      format: "PDF",
      formatColor: "bg-red-500/15 text-red-300 border-red-500/30",
      actionUrl: batchPdfUrl,
      actionLabel: "Generate PDF",
      icon: FileText,
    },
    {
      title: "SHIFT QUALITY & REWORK REPORT",
      desc: "Detailed metallurgical defect registry, operator disposition overrides, and conditioning queue assignments.",
      format: "XLSX",
      formatColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      actionUrl: excelUrl,
      actionLabel: "Export Excel",
      icon: FileSpreadsheet,
    },
    {
      title: "BILLET TRACEABILITY & AUDIT EXPORT",
      desc: "Complete SHA-256 cryptographic chain validation, Heat/Batch mapping, and raw metrology telemetry.",
      format: "CSV",
      formatColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      actionUrl: csvUrl,
      actionLabel: "Export CSV",
      icon: Download,
    },
    {
      title: "SURFACE DEFECT BREAKDOWN FEED",
      desc: "Granular micro-flaw dimensions, coordinates, classification confidence, and optical crop references.",
      format: "CSV",
      formatColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      actionUrl: defectCsvUrl,
      actionLabel: "Export Defect CSV",
      icon: Download,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 uppercase tracking-wider mb-1">
          <span>REPORT CENTER</span>
          <span>·</span>
          <span className="text-[#ED1C27] font-semibold">QUALITY AUDIT & DATA EXPORT</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Audit Reports & Compliance Exports
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Generate filtered Excel workbooks, batch audit certificates, and enterprise ERP data feeds.
        </p>
      </div>

      {/* Filter Parameters Panel */}
      <div className="bg-[#0c0e14] border border-white/[0.08] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
            REPORT SCOPE & FILTERS
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="space-y-1">
            <label className="text-slate-400 block text-[11px]">Heat Number Filter</label>
            <input
              type="text"
              value={heatNumber}
              onChange={(e) => setHeatNumber(e.target.value)}
              placeholder="e.g. 26A-1042 (All heats if empty)"
              className="w-full bg-[#08090d] border border-white/10 rounded px-3 py-2 text-white focus:border-[#ED1C27] outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 block text-[11px]">Quality Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#08090d] border border-white/10 rounded px-3 py-2 text-white focus:border-[#ED1C27] outline-none"
            >
              <option value="ALL">All Verdicts (PASS, REWORK, FAIL)</option>
              <option value="PASS">PASS Only (First-time Yield)</option>
              <option value="REWORK">REWORK Only (Grinding Queue)</option>
              <option value="FAIL">FAIL Only (Rejected Billets)</option>
              <option value="NEEDS_REVIEW">NEEDS REVIEW Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document-Style Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportCards.map((r, i) => {
          const Icon = r.icon;
          return (
            <div
              key={i}
              className="bg-[#0c0e14] border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${r.formatColor}`}>
                    {r.format}
                  </span>
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>
                <h3 className="font-bold text-sm text-white font-mono">
                  {r.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {r.desc}
                </p>
              </div>

              <a
                href={r.actionUrl}
                target={r.format === "PDF" ? "_blank" : undefined}
                download={r.format !== "PDF" ? true : undefined}
                rel="noreferrer"
                className="w-full py-2 rounded bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-mono font-bold text-center flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{r.actionLabel}</span>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
