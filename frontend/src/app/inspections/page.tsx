"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchInspections, getApiUrl } from "@/lib/api";
import { InspectionSummary } from "@/lib/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { IndustrialHeroBackground } from "@/components/ui/IndustrialHeroBackground";
import {
  ScrollText,
  Search,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  Database,
  Filter,
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Operational Header with Industrial Backdrop */}
      <IndustrialHeroBackground
        imageSrc="/images/industrial/steel-mill-dark.jpg"
        accent="red"
        className="p-6 sm:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#ED1C27]/20 text-[#ED1C27] border border-[#ED1C27]/40 tracking-wider">
                <Database className="w-3.5 h-3.5" />
                <span>INSPECTION REGISTRY</span>
              </span>
              <span className="text-white/40 text-xs font-mono">· LINE 01 COOLING BED</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Permanent Billet Quality Records
            </h1>
            <p className="text-xs text-white/60 max-w-2xl">
              Immutable ledger of optical metrology, surface defect classifications, and end-face OCR heat numbers with SHA-256 cryptographic verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href={getApiUrl("/api/export/excel")}
              download="billet_inspection_audit.xlsx"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/90 border border-white/10 text-xs font-mono font-semibold transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Excel</span>
            </a>

            <a
              href={getApiUrl("/api/export/pdf")}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ED1C27] hover:bg-[#ff2a37] text-white text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(237,28,39,0.3)]"
            >
              <FileText className="w-4 h-4" />
              <span>Batch Certificate PDF</span>
            </a>

            <button
              onClick={loadInspections}
              className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10 transition-colors"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#ED1C27]" : ""}`} />
            </button>
          </div>
        </div>
      </IndustrialHeroBackground>

      {/* Query & Filter Toolbar */}
      <div className="industrial-panel p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Global Search */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Billet ID, Heat Number, Batch ID, or Inspection ID..."
              className="w-full bg-black/60 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white font-mono focus:border-[#ED1C27] focus:ring-1 focus:ring-[#ED1C27] outline-none transition-all placeholder:text-white/30"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 font-mono focus:border-[#ED1C27] outline-none"
            >
              <option value="ALL">All Quality Verdicts</option>
              <option value="PASS">PASS ONLY</option>
              <option value="REWORK">REWORK ONLY</option>
              <option value="FAIL">FAIL (REJECTED) ONLY</option>
              <option value="NEEDS_REVIEW">REVIEW REQUIRED ONLY</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="md:col-span-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-[#ED1C27] hover:bg-[#ff2a37] text-white rounded-lg text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(237,28,39,0.25)]"
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
              className="px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white rounded-lg text-xs font-mono border border-white/10 transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Main Industrial Data Table */}
      <div className="industrial-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-black/40 text-white/40 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3.5">Inspection ID</th>
                <th className="py-3 px-3.5">Timestamp</th>
                <th className="py-3 px-3.5">Billet ID</th>
                <th className="py-3 px-3.5">Heat No</th>
                <th className="py-3 px-3.5">Batch</th>
                <th className="py-3 px-3.5">Length (mm)</th>
                <th className="py-3 px-3.5">W × H (mm)</th>
                <th className="py-3 px-3.5">Defects</th>
                <th className="py-3 px-3.5">OCR Conf</th>
                <th className="py-3 px-3.5">Verdict</th>
                <th className="py-3 px-3.5">Latency</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-14 text-center text-white/40">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#ED1C27]" />
                    <span>Querying permanent audit database...</span>
                  </td>
                </tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-14 text-center text-white/40 font-sans">
                    No inspection records matching query.
                  </td>
                </tr>
              ) : (
                paginatedList.map((ins) => (
                  <tr
                    key={ins.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-3 px-3.5 font-bold text-[#ED1C27]">
                      <Link href={`/inspections/${ins.id}`} className="hover:underline">
                        {ins.id}
                      </Link>
                    </td>
                    <td className="py-3 px-3.5 text-white/40 text-[11px]">
                      {new Date(ins.timestamp).toLocaleTimeString([], { hour12: false })}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-white font-sans">
                      {ins.billet_id}
                    </td>
                    <td className="py-3 px-3.5 text-white/80">{ins.heat_number}</td>
                    <td className="py-3 px-3.5 text-white/40">{ins.batch_id}</td>
                    <td className="py-3 px-3.5 text-white">{ins.length_mm}</td>
                    <td className="py-3 px-3.5 text-white/70">
                      {ins.width_mm} × {ins.height_mm}
                    </td>
                    <td className="py-3 px-3.5">
                      <span
                        className={
                          ins.defect_count > 0 ? "text-[#ff4b55] font-bold" : "text-emerald-400 font-medium"
                        }
                      >
                        {ins.defect_count}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-white/60">
                      {Math.round(ins.ocr_confidence * 100)}%
                    </td>
                    <td className="py-3 px-3.5">
                      <StatusBadge status={ins.status} size="sm" />
                    </td>
                    <td className="py-3 px-3.5 text-white/40 text-[11px]">
                      {ins.processing_latency_ms} ms
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        <Link
                          href={`/inspections/${ins.id}`}
                          className="px-2.5 py-1 rounded bg-white/[0.06] hover:bg-[#ED1C27] hover:text-white text-white/80 text-[11px] font-mono flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </Link>
                        <a
                          href={getApiUrl(`/api/inspections/${ins.id}/report`)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white text-[11px] font-mono transition-colors"
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

        {/* Table Pagination Footer */}
        <div className="px-4 py-3 bg-black/50 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-white/40">
          <div>
            Showing {Math.min((page - 1) * pageSize + 1, inspections.length)} –{" "}
            {Math.min(page * pageSize, inspections.length)} of {inspections.length} recorded billets
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-white disabled:opacity-20 border border-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white/70">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-white disabled:opacity-20 border border-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
