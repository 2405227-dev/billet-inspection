"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchInspections, getApiUrl } from "@/lib/api";
import { InspectionSummary } from "@/lib/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  ArrowUpDown,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function InspectionsHistoryPage() {
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [defectFilter, setDefectFilter] = useState<string>("ALL");
  const [heatFilter, setHeatFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  const loadInspections = async () => {
    setLoading(true);
    try {
      const data = await fetchInspections({
        search: search.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        heat_number: heatFilter.trim() || undefined,
        defect_type: defectFilter !== "ALL" ? defectFilter : undefined,
        limit: 100,
      });
      setInspections(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInspections();
  }, [statusFilter, defectFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadInspections();
  };

  // Client-side pagination
  const paginatedList = inspections.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(inspections.length / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-cyan-400" />
            <span>Permanent Billet Inspection Registry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            100% Traceability • Every Billet Retrievable • Cryptographic SHA-256 Audit Records
          </p>
        </div>

        {/* Quick Export Actions */}
        <div className="flex items-center gap-2.5">
          <a
            href={getApiUrl("/api/export/excel")}
            download="billet_inspection_audit.xlsx"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 text-xs font-bold transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Audit Excel</span>
          </a>

          <a
            href={getApiUrl("/api/export/csv?export_type=inspections")}
            download="inspection_audit.csv"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </a>

          <a
            href={getApiUrl("/api/export/pdf")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Batch PDF</span>
          </a>

          <button
            onClick={loadInspections}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Global Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Billet ID, Heat Number, Batch ID, or Inspection ID..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 font-mono focus:border-cyan-500 outline-none"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:border-cyan-500 outline-none"
            >
              <option value="ALL">All Verdicts (PASS / FAIL / REWORK)</option>
              <option value="PASS">PASS ONLY</option>
              <option value="REWORK">REWORK ONLY</option>
              <option value="FAIL">FAIL (REJECTED) ONLY</option>
              <option value="NEEDS_REVIEW">NEEDS REVIEW ONLY</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
            >
              Filter Records
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setDefectFilter("ALL");
                setHeatFilter("");
                loadInspections();
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Main Inspections Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#090f1d] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3">Inspection ID</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Billet ID</th>
                <th className="py-3 px-3">Heat Number</th>
                <th className="py-3 px-3">Batch</th>
                <th className="py-3 px-3">Length (mm)</th>
                <th className="py-3 px-3">W × H (mm)</th>
                <th className="py-3 px-3">Defects</th>
                <th className="py-3 px-3">OCR Conf</th>
                <th className="py-3 px-3">Verdict</th>
                <th className="py-3 px-3">Latency</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                    Querying permanent audit database...
                  </td>
                </tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500 font-sans">
                    No inspection records matching query.
                  </td>
                </tr>
              ) : (
                paginatedList.map((ins) => (
                  <tr
                    key={ins.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3 px-3 font-bold text-cyan-400">
                      <Link href={`/inspections/${ins.id}`} className="hover:underline">
                        {ins.id}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(ins.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-100 font-sans">
                      {ins.billet_id}
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-bold">{ins.heat_number}</td>
                    <td className="py-3 px-3 text-slate-400">{ins.batch_id}</td>
                    <td className="py-3 px-3 text-slate-200">{ins.length_mm}</td>
                    <td className="py-3 px-3 text-slate-200">
                      {ins.width_mm} × {ins.height_mm}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={
                          ins.defect_count > 0 ? "text-rose-400 font-bold" : "text-emerald-400"
                        }
                      >
                        {ins.defect_count}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {Math.round(ins.ocr_confidence * 100)}%
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={ins.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {ins.processing_latency_ms} ms
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        <Link
                          href={`/inspections/${ins.id}`}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-cyan-400" />
                          <span>View</span>
                        </Link>
                        <a
                          href={getApiUrl(`/api/inspections/${ins.id}/report`)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                          title="Print PDF Certificate"
                        >
                          PDF
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="px-4 py-3 bg-[#080d17] border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            Showing {Math.min((page - 1) * pageSize + 1, inspections.length)} –{" "}
            {Math.min(page * pageSize, inspections.length)} of {inspections.length} recorded billets
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 border border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 border border-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
