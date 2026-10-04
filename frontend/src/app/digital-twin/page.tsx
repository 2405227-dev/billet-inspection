"use client";

import React, { useState, useEffect } from "react";
import { Boxes, Search, ChevronRight, Layers, ShieldAlert, Sparkles } from "lucide-react";
import { apiGet } from "@/lib/api";
import { InspectionSummary } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DigitalTwinIndexPage() {
  const router = useRouter();
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        const data = await apiGet<InspectionSummary[]>("/api/inspections?limit=30");
        setInspections(data);
      } catch (err) {
        console.error("Failed to load inspections", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInspections();
  }, []);

  const filtered = inspections.filter(
    (i) =>
      i.billet_id.toLowerCase().includes(search.toLowerCase()) ||
      i.heat_number.toLowerCase().includes(search.toLowerCase()) ||
      i.batch_id.toLowerCase().includes(search.toLowerCase()) ||
      i.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="p-5 rounded-lg bg-[#0c0e12] border border-white/10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-white/10 text-slate-300 rounded border border-white/10">
              TRACEABILITY REPOSITORY
            </span>
            <span className="text-xs font-mono text-slate-400">
              PHYSICAL TO DIGITAL TWIN ENTITY LINKER
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight font-mono">
            DIGITAL BILLET TWIN DIRECTORY
          </h1>
          <p className="text-xs text-slate-400">
            Select an individual billet to inspect its full multi-modal history, 3D/2D defect map, and timeline.
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0c0e12] border border-white/10 font-mono text-xs">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search Billet ID (e.g. BILLET-0001), Heat Number (26A-1042), or Batch ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-xs"
          />
        </div>

        {/* Grid of Billets */}
        {loading ? (
          <div className="p-8 text-center font-mono text-xs text-slate-500">
            Loading digital twin entities...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-slate-500">
            No billet twins found matching query.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((b) => {
              const isPass = b.status === "PASS";
              const isFail = b.status === "FAIL";
              return (
                <Link
                  key={b.id}
                  href={`/digital-twin/${b.billet_id || b.id}`}
                  className="p-4 rounded-lg bg-[#0c0e12] hover:bg-[#12151c] border border-white/10 hover:border-white/20 transition-all space-y-3 group font-mono"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-[#ED1C27]" />
                      <span className="font-bold text-white text-xs">{b.billet_id}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isPass
                          ? "bg-emerald-500/20 text-emerald-400"
                          : isFail
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-500">Heat:</span>{" "}
                      <span className="text-white">{b.heat_number}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Batch:</span>{" "}
                      <span className="text-white">{b.batch_id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Defects:</span>{" "}
                      <span className="text-white font-bold">{b.defect_count}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Dimensions:</span>{" "}
                      <span className="text-white">{b.length_mm} mm</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{new Date(b.timestamp).toLocaleTimeString()}</span>
                    <span className="text-[#ED1C27] font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      View Twin &rarr;
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
  );
}
