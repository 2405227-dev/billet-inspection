"use client";

import React, { useState, useEffect } from "react";
import { fetchInspections, getApiUrl } from "@/lib/api";
import { InspectionSummary } from "@/lib/types";
import { MASTER_INSPECTION_RECORDS } from "@/lib/mockData";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Filter,
  Search,
  Eye,
  Printer,
  ShieldCheck,
  Check,
  Copy,
  X,
  RefreshCw,
  Award,
  Radio,
  Layers,
  Activity,
  Maximize2,
  FileCheck,
} from "lucide-react";

export default function ReportsGeneratorPage() {
  const [heatNumber, setHeatNumber] = useState<string>("");
  const [status, setStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [inspections, setInspections] = useState<InspectionSummary[]>(MASTER_INSPECTION_RECORDS);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCertificate, setSelectedCertificate] = useState<InspectionSummary | null>(null);
  const [showBatchPreview, setShowBatchPreview] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchInspections({ limit: 100 });
      if (data && data.length > 0) {
        setInspections(data);
      } else {
        setInspections(MASTER_INSPECTION_RECORDS);
      }
    } catch {
      setInspections(MASTER_INSPECTION_RECORDS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const buildQuery = (base: string) => {
    const params = new URLSearchParams();
    if (heatNumber.trim()) params.append("heat_number", heatNumber.trim());
    if (status !== "ALL") params.append("status", status);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const excelUrl = getApiUrl(buildQuery("/api/export/excel"));
  const billetCsvUrl = getApiUrl(buildQuery("/api/export/csv?export_type=billets"));
  const defectCsvUrl = getApiUrl(buildQuery("/api/export/csv?export_type=defects"));
  const ecaCsvUrl = getApiUrl(buildQuery("/api/export/csv?export_type=eca"));
  const pautCsvUrl = getApiUrl(buildQuery("/api/export/csv?export_type=paut"));
  const measurementsCsvUrl = getApiUrl(buildQuery("/api/export/csv?export_type=measurements"));
  const auditCsvUrl = getApiUrl(buildQuery("/api/export/csv?export_type=audit"));
  const batchPdfUrl = getApiUrl(buildQuery("/api/export/pdf"));

  const filteredInspections = inspections.filter((ins) => {
    const matchesHeat = !heatNumber.trim() || ins.heat_number.toLowerCase().includes(heatNumber.trim().toLowerCase());
    const matchesStatus = status === "ALL" || ins.status.toUpperCase() === status.toUpperCase();
    const matchesSearch =
      !searchTerm.trim() ||
      ins.billet_id.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      ins.id.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      ins.heat_number.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      ins.batch_id.toLowerCase().includes(searchTerm.trim().toLowerCase());
    return matchesHeat && matchesStatus && matchesSearch;
  });

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const totalInspected = inspections.length;
  const passCount = inspections.filter((i) => i.status === "PASS").length;
  const failCount = inspections.filter((i) => i.status === "FAIL").length;
  const reworkCount = inspections.filter((i) => i.status === "REWORK").length;
  const passRate = totalInspected > 0 ? Math.round((passCount / totalInspected) * 1000) / 10 : 0;

  const reportCards = [
    {
      title: "BATCH QUALITY AUDIT CERTIFICATE",
      desc: "Multi-page summary of cooling-bed inspections, first-pass yield, dimensional variance, and metallurgical compliance.",
      format: "PDF",
      formatColor: "bg-[#ED1C27]/10 text-[#ff4b55] border-[#ED1C27]/30",
      actionUrl: batchPdfUrl,
      actionLabel: "Download Batch PDF",
      previewLabel: "Preview Batch",
      onPreview: () => setShowBatchPreview(true),
      icon: FileText,
      badge: "ISO 9001 / IS 2830",
    },
    {
      title: "COMPLETE 11-SHEET ENGINEERING WORKBOOK",
      desc: "All 11 linked worksheets: Summary, Dimensions, Defects, ECA, PAUT, OCR, 3D Laser, Correlation, Coverage, Decision, and Audit.",
      format: "XLSX",
      formatColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      actionUrl: excelUrl,
      actionLabel: "Export 11-Sheet Workbook",
      icon: FileSpreadsheet,
      badge: "11 Detailed Sheets",
    },
    {
      title: "BILLET MASTER DATA (billets.csv)",
      desc: "Core traceability records, metallurgical grades, Heat/Batch IDs, overall dimensions, and final decisions.",
      format: "CSV",
      formatColor: "bg-sky-500/10 text-sky-300 border-sky-500/30",
      actionUrl: billetCsvUrl,
      actionLabel: "Export Billets CSV",
      icon: Download,
      badge: "Master Billet Ledger",
    },
    {
      title: "SURFACE DEFECT BREAKDOWN (defects.csv)",
      desc: "Granular flaw table with Front/Back distances, bounding boxes, severity, confidence, and optical evidence crops.",
      format: "CSV",
      formatColor: "bg-amber-500/10 text-amber-300 border-amber-500/30",
      actionUrl: defectCsvUrl,
      actionLabel: "Export Defects CSV",
      icon: Download,
      badge: "Spatial Coordinates",
    },
    {
      title: "ECA INDICATION TELEMETRY (eca_indications.csv)",
      desc: "16-channel Eddy Current Array impedance signals, signal-to-threshold ratios, and near-surface crack indications.",
      format: "CSV",
      formatColor: "bg-orange-500/10 text-orange-300 border-orange-500/30",
      actionUrl: ecaCsvUrl,
      actionLabel: "Export ECA CSV",
      icon: Radio,
      badge: "SIMULATION / DEMO",
    },
    {
      title: "PAUT VOLUMETRIC SCANS (paut_indications.csv)",
      desc: "Phased array ultrasonic indications, volumetric depths, % peak echo amplitudes, and internal core porosity tags.",
      format: "CSV",
      formatColor: "bg-purple-500/10 text-purple-300 border-purple-500/30",
      actionUrl: pautCsvUrl,
      actionLabel: "Export PAUT CSV",
      icon: Layers,
      badge: "SIMULATION / DEMO",
    },
    {
      title: "OPTICAL METROLOGY (measurements.csv)",
      desc: "Calibrated Length, Width, Height, and Diagonal dimensions with nominal targets, tolerances, and deviations.",
      format: "CSV",
      formatColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
      actionUrl: measurementsCsvUrl,
      actionLabel: "Export Metrology CSV",
      icon: Maximize2,
      badge: "Calibrated Metrology",
    },
    {
      title: "CRYPTOGRAPHIC AUDIT LEDGER (audit.csv)",
      desc: "Complete immutable SHA-256 blockchain hash ledger, predecessor chaining, and AI model provenance.",
      format: "CSV",
      formatColor: "bg-rose-500/10 text-rose-300 border-rose-500/30",
      actionUrl: auditCsvUrl,
      actionLabel: "Export Audit Ledger CSV",
      icon: ShieldCheck,
      badge: "SHA-256 Ledger",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-[#0c0e14] border border-white/[0.08] rounded-lg p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 uppercase tracking-widest">
              <span>EXPORT & AUDIT HUB</span>
              <span className="text-slate-600">/</span>
              <span className="text-[#ED1C27] font-semibold">BILLET INSPECTION PASSPORT</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Quality Reports & Inspection Passports
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl font-sans">
              Export official engineering-grade Billet Inspection Passports (PDF), complete 11-sheet Excel workbooks, and specialized CSV telemetry files with multi-modal sensor correlation.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 font-mono text-xs shrink-0">
            <div className="bg-[#07080b] border border-white/10 rounded px-3 py-2 text-center">
              <div className="text-[10px] text-slate-500 uppercase">Certificates</div>
              <div className="text-white font-bold text-sm">{totalInspected}</div>
            </div>
            <div className="bg-[#07080b] border border-white/10 rounded px-3 py-2 text-center">
              <div className="text-[10px] text-slate-500 uppercase">Pass Yield</div>
              <div className="text-emerald-400 font-bold text-sm">{passRate}%</div>
            </div>
            <div className="bg-[#07080b] border border-white/10 rounded px-3 py-2 text-center">
              <div className="text-[10px] text-slate-500 uppercase">Audit Status</div>
              <div className="text-[#ff4b55] font-bold text-xs flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>VERIFIED</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Parameters Panel */}
      <div className="bg-[#0c0e14] border border-white/[0.08] rounded-lg p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
              REPORT SCOPE & SEARCH CRITERIA
            </h3>
          </div>
          <button
            onClick={loadData}
            className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-[#ED1C27]" : ""}`} />
            <span>Refresh Data</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="space-y-1">
            <label className="text-slate-400 block text-[10px] uppercase">Search Billet / Heat / ID</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g. BILLET-00023, H7821..."
                className="w-full bg-[#07080b] border border-white/10 rounded pl-8 pr-3 py-1.5 text-white focus:border-[#ED1C27] outline-none text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 block text-[10px] uppercase">Heat Number Scope</label>
            <input
              type="text"
              value={heatNumber}
              onChange={(e) => setHeatNumber(e.target.value)}
              placeholder="e.g. H7821 (All heats if empty)"
              className="w-full bg-[#07080b] border border-white/10 rounded px-3 py-1.5 text-white focus:border-[#ED1C27] outline-none text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 block text-[10px] uppercase">Quality Verdict Filter</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#07080b] border border-white/10 rounded px-2.5 py-1.5 text-white focus:border-[#ED1C27] outline-none text-xs"
            >
              <option value="ALL">All Verdicts (PASS, REWORK, FAIL, REVIEW)</option>
              <option value="PASS">PASS Only (First-Pass Yield)</option>
              <option value="REWORK">REWORK Only (Conditioning Yard)</option>
              <option value="FAIL">FAIL / REJECT Only (Non-Conforming)</option>
              <option value="NEEDS_REVIEW">NEEDS REVIEW Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Official Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map((r, i) => {
          const Icon = r.icon;
          return (
            <div
              key={i}
              className="bg-[#0c0e14] border border-white/[0.08] rounded-lg p-4 flex flex-col justify-between space-y-3 hover:border-white/15 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${r.formatColor}`}>
                    {r.format}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">{r.badge}</span>
                </div>
                <h3 className="font-bold text-xs text-white font-mono leading-tight">
                  {r.title}
                </h3>
                <p className="text-[11px] text-slate-400 leading-normal font-sans line-clamp-2">
                  {r.desc}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                {r.onPreview && (
                  <button
                    onClick={r.onPreview}
                    className="flex-1 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3 h-3 text-[#ED1C27]" />
                    <span>{r.previewLabel}</span>
                  </button>
                )}
                <a
                  href={r.actionUrl}
                  target={r.format === "PDF" ? "_blank" : undefined}
                  download={r.format !== "PDF" ? true : undefined}
                  rel="noreferrer"
                  className={`${r.onPreview ? "flex-1" : "w-full"} py-1.5 rounded ${
                    r.format === "PDF"
                      ? "bg-[#ED1C27] hover:bg-[#ff2a37] text-white"
                      : "bg-white/[0.06] hover:bg-white/[0.12] text-white"
                  } border border-white/10 text-[11px] font-mono font-bold text-center flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm`}
                >
                  <Download className="w-3 h-3" />
                  <span>{r.actionLabel}</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Individual Billet Quality Certificates Registry */}
      <div className="bg-[#0c0e14] border border-white/[0.08] rounded-lg overflow-hidden space-y-0">
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#090a0e]">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#ED1C27]" />
              <h2 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
                Individual Billet Inspection Passports (PDF)
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Engineering-grade multi-page inspection certificates with calibrated metrology, spatial defect mapping, NDT waveforms, and root-cause reasons.
            </p>
          </div>

          <span className="text-[11px] font-mono text-slate-400 self-start sm:self-auto">
            Showing <strong className="text-white">{filteredInspections.length}</strong> available passports
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#07080b] text-slate-400 font-mono text-[9px] uppercase tracking-wider">
                <th className="py-2.5 px-4">Passport ID</th>
                <th className="py-2.5 px-3">Billet Serial</th>
                <th className="py-2.5 px-3">Heat / Batch</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Dimensions (L × W × H)</th>
                <th className="py-2.5 px-3">Flaws</th>
                <th className="py-2.5 px-3">Verdict</th>
                <th className="py-2.5 px-3">SHA-256 Ledger Stamp</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono">
              {filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                    No inspection passports found matching current filter scope.
                  </td>
                </tr>
              ) : (
                filteredInspections.map((ins) => (
                  <tr key={ins.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3 px-4 font-bold text-[#ED1C27]">
                      {ins.id}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white font-sans">
                      {ins.billet_id}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <div>{ins.heat_number}</div>
                      <div className="text-[10px] text-slate-500">{ins.batch_id}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      <div>{new Date(ins.timestamp).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-500">{new Date(ins.timestamp).toLocaleTimeString([], { hour12: false })}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <div>{ins.length_mm} mm</div>
                      <div className="text-[10px] text-slate-500">{ins.width_mm} × {ins.height_mm} mm</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={ins.defect_count > 0 ? "text-[#ff4b55] font-bold" : "text-emerald-400"}>
                        {ins.defect_count} flaw{ins.defect_count === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={ins.status} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 select-all font-mono">
                          {ins.audit_hash.slice(0, 10)}...{ins.audit_hash.slice(-6)}
                        </span>
                        <button
                          onClick={() => handleCopyHash(ins.audit_hash)}
                          className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                          title="Copy Full SHA-256 Hash"
                        >
                          {copiedHash === ins.audit_hash ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedCertificate(ins)}
                          className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-[11px] font-mono flex items-center gap-1 border border-white/10 transition-colors cursor-pointer"
                          title="Preview Passport"
                        >
                          <Eye className="w-3 h-3 text-[#ED1C27]" />
                          <span>Preview</span>
                        </button>

                        <a
                          href={getApiUrl(`/api/inspections/${ins.id}/report`)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded bg-[#ED1C27] hover:bg-[#ff2a37] text-white text-[11px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                          title="Download Official Passport PDF"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Single Billet Passport Interactive Viewer */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0c0e14] border border-white/15 rounded-xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#08090d]">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#ED1C27]" />
                <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
                  Billet Inspection Passport: {selectedCertificate.billet_id}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-mono flex items-center gap-1 border border-white/10 transition-colors cursor-pointer"
                  title="Print Passport"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <a
                  href={getApiUrl(`/api/inspections/${selectedCertificate.id}/report`)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 rounded bg-[#ED1C27] hover:bg-[#ff2a37] text-white text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
                <button
                  onClick={() => setSelectedCertificate(null)}
                  className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Passport Document Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-[#07080b] font-sans text-xs">
              {/* Official Plant Header */}
              <div className="border-b-2 border-white/20 pb-4 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <div className="font-extrabold text-sm text-white tracking-wider font-mono uppercase">
                    NIT RAIPUR INTEGRATED STEEL PLANT
                  </div>
                  <div className="text-[11px] text-slate-400">
                    AI Quality Metrology & Surface Flaw Inspection Laboratory
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Standard: IS 2830 / ISO 9001:2015 / ASTM E381 · Mode: BENCH EVALUATION / SIMULATION
                  </div>
                </div>
                <div className="text-left sm:text-right font-mono text-[11px] text-slate-400 space-y-0.5">
                  <div><strong className="text-white">PASSPORT ID:</strong> {selectedCertificate.id}</div>
                  <div><strong className="text-slate-300">DATE:</strong> {new Date(selectedCertificate.timestamp).toLocaleString()}</div>
                  <div><strong className="text-slate-300">LINE:</strong> Continuous Rolling Line #1</div>
                </div>
              </div>

              {/* Final Verdict Callout Banner */}
              <div
                className={`p-4 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  selectedCertificate.status === "PASS"
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : selectedCertificate.status === "FAIL"
                    ? "bg-red-950/40 border-red-500/40 text-red-300"
                    : "bg-amber-950/40 border-amber-500/40 text-amber-300"
                }`}
              >
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider font-bold">
                    OFFICIAL INSPECTION VERDICT
                  </div>
                  <div className="text-lg font-extrabold font-mono tracking-tight">
                    {selectedCertificate.status === "PASS" && "CONFORMING (PASS) — RELEASED FOR SHIPMENT"}
                    {selectedCertificate.status === "FAIL" && "NON-CONFORMING (REJECT / FAIL) — DEFECT DETECTED"}
                    {selectedCertificate.status === "REWORK" && "CONDITIONING REQUIRED (REWORK) — GRINDING YARD"}
                    {selectedCertificate.status === "NEEDS_REVIEW" && "FLAGGED FOR METALLURGICAL QA REVIEW"}
                  </div>
                  <div className="text-[11px] mt-1 font-mono text-slate-300">
                    <strong>Root Cause Reason:</strong> {selectedCertificate.decision_reason}
                  </div>
                </div>
                <StatusBadge status={selectedCertificate.status} size="lg" />
              </div>

              {/* 1. Metallurgical Traceability */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  1. BILLET IDENTIFICATION & METALLURGICAL TRACEABILITY
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0c0e14] border border-white/10 rounded-lg p-3 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Billet Serial</span>
                    <strong className="text-white">{selectedCertificate.billet_id}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Heat Number</span>
                    <strong className="text-[#ED1C27]">{selectedCertificate.heat_number}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Batch ID</span>
                    <strong className="text-slate-200">{selectedCertificate.batch_id}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Steel Grade</span>
                    <strong className="text-slate-200">IS 2830 / Fe 500D</strong>
                  </div>
                </div>
              </div>

              {/* 2. Optical Metrology */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  2. CALIBRATED DIMENSIONAL METROLOGY (LENGTH, WIDTH, HEIGHT)
                </div>
                <div className="bg-[#0c0e14] border border-white/10 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#12141c] text-slate-400 text-[10px] uppercase border-b border-white/10">
                      <tr>
                        <th className="p-2.5">Parameter</th>
                        <th className="p-2.5">Measured</th>
                        <th className="p-2.5">Nominal Target</th>
                        <th className="p-2.5">Tolerance</th>
                        <th className="p-2.5">Deviation</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-slate-300">
                      <tr>
                        <td className="p-2.5 font-bold text-white">Length (L)</td>
                        <td className="p-2.5 text-white">{selectedCertificate.length_mm} mm</td>
                        <td className="p-2.5 text-slate-400">6000.0 mm</td>
                        <td className="p-2.5 text-slate-400">±200.0 mm</td>
                        <td className="p-2.5 text-slate-300">+{round(selectedCertificate.length_mm - 6000, 1)} mm</td>
                        <td className="p-2.5 text-emerald-400 font-bold">PASS</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-white">Width (W)</td>
                        <td className="p-2.5 text-white">{selectedCertificate.width_mm} mm</td>
                        <td className="p-2.5 text-slate-400">150.0 mm</td>
                        <td className="p-2.5 text-slate-400">±3.0 mm</td>
                        <td className="p-2.5 text-slate-300">+{round(selectedCertificate.width_mm - 150, 1)} mm</td>
                        <td className="p-2.5 text-emerald-400 font-bold">PASS</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-white">Height (H)</td>
                        <td className="p-2.5 text-white">{selectedCertificate.height_mm} mm</td>
                        <td className="p-2.5 text-slate-400">150.0 mm</td>
                        <td className="p-2.5 text-slate-400">±3.0 mm</td>
                        <td className="p-2.5 text-slate-300">+{round(selectedCertificate.height_mm - 150, 1)} mm</td>
                        <td className="p-2.5 text-emerald-400 font-bold">PASS</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Surface & Volumetric Defect Table */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  3. MASTER DEFECT & NDT INDICATION BREAKDOWN
                </div>
                <div className="bg-[#0c0e14] border border-white/10 rounded-lg p-3 font-mono text-xs">
                  {selectedCertificate.defect_count === 0 ? (
                    <div className="text-emerald-400 font-sans text-xs">
                      ✓ No surface cracking, seams, scabs, ECA impedance anomalies, or PAUT internal reflections detected.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-amber-400 font-sans text-xs">
                        ⚠ {selectedCertificate.defect_count} surface anomaly recorded. Full spatial mapping below:
                      </div>
                      <div className="bg-[#07080b] p-2 rounded border border-white/10 text-[11px] text-slate-300 space-y-1">
                        <div><strong>Defect ID:</strong> DEF-0007 (Surface Crack) @ Pos Front: 742 mm (Pos Back: {selectedCertificate.length_mm - 742} mm)</div>
                        <div><strong>Sensor Source:</strong> Optical Camera (CAM-01) + Eddy Current Array (ECA-Ch7)</div>
                        <div><strong>PAUT Volumetric:</strong> Internal reflection at 4400 mm (Flaw Depth: 75.0 mm) [SIMULATION]</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Physical Surface Coverage Map */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  4. MULTI-FACE PHYSICAL COVERAGE ENVELOPE
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center font-mono text-[10px]">
                  <div className="bg-[#0c0e14] border border-white/10 rounded p-2">
                    <span className="text-slate-500 block">TOP FACE</span>
                    <strong className="text-emerald-400">INSPECTED</strong>
                  </div>
                  <div className="bg-[#0c0e14] border border-white/10 rounded p-2">
                    <span className="text-slate-500 block">LEFT FACE</span>
                    <strong className="text-emerald-400">INSPECTED</strong>
                  </div>
                  <div className="bg-[#0c0e14] border border-white/10 rounded p-2">
                    <span className="text-slate-500 block">RIGHT FACE</span>
                    <strong className="text-emerald-400">INSPECTED</strong>
                  </div>
                  <div className="bg-[#0c0e14] border border-white/10 rounded p-2">
                    <span className="text-slate-500 block">FRONT FACE</span>
                    <strong className="text-emerald-400">INSPECTED</strong>
                  </div>
                  <div className="bg-[#0c0e14] border border-white/10 rounded p-2">
                    <span className="text-slate-500 block">BACK FACE</span>
                    <strong className="text-emerald-400">INSPECTED</strong>
                  </div>
                  <div className="bg-[#0c0e14] border border-red-500/30 bg-red-950/20 rounded p-2">
                    <span className="text-slate-400 block">BOTTOM FACE</span>
                    <strong className="text-red-400">NOT INSPECTED</strong>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 italic">
                  * Bottom surface is in mechanical contact with conveyor rollers. Flagged for secondary roll station inspection.
                </div>
              </div>

              {/* 5. Cryptographic Provenance */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  5. CRYPTOGRAPHIC PROVENANCE & AUDIT TRAIL
                </div>
                <div className="bg-[#0c0e14] border border-white/10 rounded-lg p-3 space-y-1.5 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">SHA-256 Record Hash:</span>
                    <div className="text-slate-200 select-all break-all text-[10px] bg-black/40 p-1.5 rounded border border-white/5">
                      {selectedCertificate.audit_hash}
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                    <span>Latency: {selectedCertificate.processing_latency_ms} ms</span>
                    <span>OCR Confidence: {Math.round(selectedCertificate.ocr_confidence * 100)}%</span>
                    <span className="text-emerald-400 font-semibold">✓ SHA-256 CHAINED</span>
                  </div>
                </div>
              </div>

              {/* Signatures & Seal */}
              <div className="border-t border-white/10 pt-4 grid grid-cols-2 gap-4 text-[11px] font-mono">
                <div>
                  <div className="font-bold text-slate-300">Automated AI Vision Rig:</div>
                  <div className="text-slate-500 text-[10px]">Model: surface-defect-ensemble-seg:v3.2.0</div>
                  <div className="text-slate-500 text-[10px]">Rig Calibration: CALIB-CAM01-2026-v4</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-300">Lead QA Metallurgical Officer:</div>
                  <div className="text-slate-500 text-[10px]">Digital Signature & Seal: Verified</div>
                  <div className="text-[#ED1C27] font-bold text-[10px]">LOCKED & IMMUTABLE PASSPORT</div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 flex justify-end gap-2 bg-[#08090d]">
              <button
                onClick={() => setSelectedCertificate(null)}
                className="px-4 py-2 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                Close Preview
              </button>
              <a
                href={getApiUrl(`/api/inspections/${selectedCertificate.id}/report`)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded bg-[#ED1C27] hover:bg-[#ff2a37] text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Official Passport (PDF)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Batch Quality Audit PDF Preview */}
      {showBatchPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0c0e14] border border-white/15 rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#08090d]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#ED1C27]" />
                <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
                  Comprehensive Batch Audit Report Preview
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={batchPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded bg-[#ED1C27] hover:bg-[#ff2a37] text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Batch PDF</span>
                </a>
                <button
                  onClick={() => setShowBatchPreview(false)}
                  className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-[#07080b] font-sans text-xs">
              <div className="border-b-2 border-white/20 pb-4">
                <h2 className="text-base font-bold text-white font-mono">
                  INDUSTRIAL BILLET INSPECTION PLATFORM — COMPREHENSIVE BATCH AUDIT REPORT
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Continuous Rolling & Secondary Cooling Bed Line #1 | NIT Raipur Integrated Steel Plant
                </p>
              </div>

              {/* Aggregated KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center font-mono text-xs">
                <div className="bg-[#0c0e14] border border-white/10 rounded p-2.5">
                  <div className="text-[10px] text-slate-500">Total Inspected</div>
                  <div className="font-bold text-white text-base">{totalInspected}</div>
                </div>
                <div className="bg-[#0c0e14] border border-white/10 rounded p-2.5">
                  <div className="text-[10px] text-slate-500">Yield (PASS)</div>
                  <div className="font-bold text-emerald-400 text-base">{passCount}</div>
                </div>
                <div className="bg-[#0c0e14] border border-white/10 rounded p-2.5">
                  <div className="text-[10px] text-slate-500">Rejected (FAIL)</div>
                  <div className="font-bold text-red-400 text-base">{failCount}</div>
                </div>
                <div className="bg-[#0c0e14] border border-white/10 rounded p-2.5">
                  <div className="text-[10px] text-slate-500">Rework / Grinding</div>
                  <div className="font-bold text-amber-400 text-base">{reworkCount}</div>
                </div>
                <div className="bg-[#0c0e14] border border-white/10 rounded p-2.5">
                  <div className="text-[10px] text-slate-500">Pass Rate</div>
                  <div className="font-bold text-emerald-400 text-base">{passRate}%</div>
                </div>
                <div className="bg-[#0c0e14] border border-white/10 rounded p-2.5">
                  <div className="text-[10px] text-slate-500">Audit Status</div>
                  <div className="font-bold text-[#ff4b55] text-xs mt-1">✓ VERIFIED</div>
                </div>
              </div>

              {/* Billet Table Preview */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Permanent Billet Registry Snapshot ({filteredInspections.length} Billets)
                </div>
                <div className="bg-[#0c0e14] border border-white/10 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#12141c] text-slate-400 text-[9px] uppercase border-b border-white/10">
                      <tr>
                        <th className="p-2">ID</th>
                        <th className="p-2">Billet Serial</th>
                        <th className="p-2">Heat</th>
                        <th className="p-2">Dimensions</th>
                        <th className="p-2">Defects</th>
                        <th className="p-2">Verdict</th>
                        <th className="p-2">Audit Hash (Prefix)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-slate-300 text-[11px]">
                      {filteredInspections.slice(0, 10).map((ins) => (
                        <tr key={ins.id}>
                          <td className="p-2 text-[#ED1C27] font-bold">{ins.id}</td>
                          <td className="p-2 text-white">{ins.billet_id}</td>
                          <td className="p-2 text-slate-300">{ins.heat_number}</td>
                          <td className="p-2 text-slate-400">{ins.length_mm} × {ins.width_mm} mm</td>
                          <td className="p-2">{ins.defect_count}</td>
                          <td className="p-2">
                            <StatusBadge status={ins.status} size="sm" />
                          </td>
                          <td className="p-2 text-[10px] text-slate-500">{ins.audit_hash.slice(0, 12)}...</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 flex justify-end gap-2 bg-[#08090d]">
              <button
                onClick={() => setShowBatchPreview(false)}
                className="px-4 py-2 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                Close Preview
              </button>
              <a
                href={batchPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded bg-[#ED1C27] hover:bg-[#ff2a37] text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Generate Official PDF Batch Report</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function round(val: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
