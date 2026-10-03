"use client";

import React, { useState } from "react";
import { getApiUrl } from "@/lib/api";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Filter,
  Search,
  Calendar,
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          <span>Metallurgical Audit Reports & Data Export Center</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Generate filtered Excel workbooks, batch audit certificates, and ERP data feeds
        </p>
      </div>

      {/* Filter Parameters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <Filter className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
            Report Scope & Filter Criteria
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="space-y-1">
            <label className="text-slate-300 font-sans font-semibold block">
              Filter by Heat Number (Optional)
            </label>
            <input
              type="text"
              value={heatNumber}
              onChange={(e) => setHeatNumber(e.target.value)}
              placeholder="e.g. 26A-1042 (Leave empty for all heats)"
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:border-cyan-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-sans font-semibold block">
              Filter by Quality Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:border-cyan-500 outline-none"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Multi-Sheet Excel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                XLSX
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-100 font-sans">
              Complete Billet Inspection Audit Workbook
            </h3>
            <p className="text-xs text-slate-400">
              Generates official 3-sheet Excel spreadsheet with individual billet rows, micro-defect details, and aggregated yield summary statistics.
            </p>
          </div>

          <a
            href={excelUrl}
            download="billet_inspection_audit.xlsx"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold text-center flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Audit Excel (.xlsx)</span>
          </a>
        </div>

        {/* 2. Comprehensive Batch PDF Report */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FileText className="w-8 h-8 text-cyan-400" />
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                PDF
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-100 font-sans">
              Comprehensive Printable Batch Audit Certificate
            </h3>
            <p className="text-xs text-slate-400">
              Official PDF certificate with plant header, KPI yield summary, metallurgical defect tables, and permanent QA audit signatures.
            </p>
          </div>

          <a
            href={batchPdfUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold text-center flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Generate Batch PDF Report</span>
          </a>
        </div>
      </div>
    </div>
  );
}
