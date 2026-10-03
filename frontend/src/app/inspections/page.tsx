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

  const paginatedList = inspections.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(inspections.length / pageSize) || 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ScrollText className="w-6 h-6 text-[#ED1C27]" />
            <span>Permanent Billet Inspection Registry</span>
          </h1>
          <p className="text-xs text-white/50 mt-1">
            100% Traceability • Every Billet Retrievable • Cryptographic SHA-256 Audit Records
          </p>
        </div>

        {/* Quick Export Actions */}
        <div className="flex items-center gap-2.5">
          <a
            href={getApiUrl("/api/export/excel")}
            download="billet_inspection_audit.xlsx"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-sm font-mono"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Excel</span>
          </a>

          <a
            href={getApiUrl("/api/export/pdf")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#ED1C27] hover:bg-[#ff2a37] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(237,28,39,0.4)] font-mono"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Batch PDF</span>
          </a>

          <button
            onClick={loadInspections}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#ED1C27]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 shadow-xl space-y-3 backdrop-blur-xl">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Global Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Billet ID, Heat Number, Batch ID, or Inspection ID..."
              className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-3 py-2 text-xs text-white font-mono focus:border-[#ED1C27] focus:ring-1 focus:ring-[#ED1C27] outline-none transition-all"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#ED1C27] outline-none"
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
              className="w-full py-2 bg-[#ED1C27] hover:bg-[#ff2a37] text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(237,28,39,0.35)] font-mono"
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
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs font-semibold border border-white/10 font-mono transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Main Inspections Data Table */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/60 text-white/50 font-mono text-[11px] uppercase tracking-wider">
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
            <tbody className="divide-y divide-white/5 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-white/50">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ED1C27]" />
                    Querying permanent audit database...
                  </td>
                </tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-white/40 font-sans">
                    No inspection records matching query.
                  </td>
                </tr>
              ) : (
                paginatedList.map((ins) => (
                  <tr
                    key={ins.id}
                    className="hover:bg-white/[0.04] transition-colors group"
                  >
                    <td className="py-3 px-3 font-bold text-[#ED1C27]">
                      <Link href={`/inspections/${ins.id}`} className="hover:underline">
                        {ins.id}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-white/40 text-[11px]">
                      {new Date(ins.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-white font-sans">
                      {ins.billet_id}
                    </td>
                    <td className="py-3 px-3 text-white font-bold">{ins.heat_number}</td>
                    <td className="py-3 px-3 text-white/50">{ins.batch_id}</td>
                    <td className="py-3 px-3 text-white">{ins.length_mm}</td>
                    <td className="py-3 px-3 text-white/70">
                      {ins.width_mm} × {ins.height_mm}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={
                          ins.defect_count > 0 ? "text-[#ED1C27] font-bold" : "text-emerald-400 font-bold"
                        }
                      >
                        {ins.defect_count}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-white/70">
                      {Math.round(ins.ocr_confidence * 100)}%
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={ins.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-white/40 text-[11px]">
                      {ins.processing_latency_ms} ms
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        <Link
                          href={`/inspections/${ins.id}`}
                          className="px-3 py-1 rounded-full bg-white/10 hover:bg-[#ED1C27] hover:text-white text-white text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </Link>
                        <a
                          href={getApiUrl(`/api/inspections/${ins.id}/report`)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold transition-colors"
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
        <div className="px-5 py-3.5 bg-black/80 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/40">
          <div>
            Showing {Math.min((page - 1) * pageSize + 1, inspections.length)} –{" "}
            {Math.min(page * pageSize, inspections.length)} of {inspections.length} recorded billets
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 border border-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white/70">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 border border-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
