"use client";

import React from "react";
import Link from "next/link";
import { InspectionSummary } from "@/lib/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ArrowRight, Clock } from "lucide-react";

interface QueueProps {
  inspections: InspectionSummary[];
}

export const InspectionQueue: React.FC<QueueProps> = ({ inspections }) => {
  return (
    <div className="bg-[#0c0e14] border border-white/[0.08] rounded-xl p-5 flex flex-col justify-between shadow-lg h-full">
      <div>
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ED1C27]" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
              INSPECTION QUEUE
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">
              LIVE · {inspections.length} BILLETS
            </span>
          </div>
          <Link
            href="/inspections"
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
          >
            <span>REGISTRY</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {inspections.length === 0 ? (
            <div className="text-center py-10 text-xs font-mono text-slate-500">
              Awaiting next billet stream on conveyor.
            </div>
          ) : (
            inspections.map((ins) => (
              <Link
                key={ins.id}
                href={`/inspections/${ins.id}`}
                className="py-2.5 px-2 -mx-2 rounded hover:bg-white/[0.03] flex items-center justify-between transition-colors block group font-mono text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 group-hover:text-white transition-colors">
                      {ins.billet_id}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {ins.heat_number}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {ins.length_mm} × {ins.width_mm} × {ins.height_mm} mm · {ins.defect_count} defects
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500">
                    {new Date(ins.timestamp).toLocaleTimeString()}
                  </span>
                  <StatusBadge status={ins.status} size="sm" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>ALL RECORDS COMMITTED TO SQLITE</span>
        <span className="text-emerald-400">SHA-256 LINKED</span>
      </div>
    </div>
  );
};
