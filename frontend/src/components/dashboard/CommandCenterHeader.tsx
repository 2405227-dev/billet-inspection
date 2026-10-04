"use client";

import React from "react";
import Link from "next/link";
import { Zap, Activity } from "lucide-react";

interface HeaderProps {
  totalInspected?: number;
  passRate?: number;
  activeBatch?: string;
  onTrigger?: () => void;
  isTriggering?: boolean;
}

export const CommandCenterHeader: React.FC<HeaderProps> = ({
  totalInspected = 1284,
  passRate = 97.8,
  activeBatch = "HEAT 26A-1042",
  onTrigger,
  isTriggering = false,
}) => {
  return (
    <div className="relative rounded-lg border border-white/[0.08] bg-[#0c0e14] overflow-hidden p-5 sm:p-6 mb-5">
      {/* Background Industrial Photography Layer */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-10 mix-blend-luminosity filter brightness-70"
        style={{ backgroundImage: "url('/images/industrial/steel-mill-dark.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0c0e14] via-[#0c0e14]/95 to-[#0c0e14]/80" />

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 uppercase tracking-widest">
            <span className="text-slate-300 font-bold">STATION 01</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">NIT RAIPUR COOLING BED</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300">{activeBatch}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Optical Metrology & Surface Quality Console
          </h1>

          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Real-time automated dimensioning, crack segmentation, and cryptographic audit ledger.
          </p>
        </div>

        {/* Operational Telemetry & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 border-t lg:border-t-0 lg:border-l border-white/[0.08] pt-4 lg:pt-0 lg:pl-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider">RIG STATE</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ONLINE (AUTO)
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider">CAMERA ARRAY</span>
              <span className="text-slate-200 font-bold mt-0.5 block">05 / 05 SYNCD</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider">THROUGHPUT</span>
              <span className="text-slate-200 font-bold mt-0.5 block">12 BILLETS/MIN</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider">MEAN LATENCY</span>
              <span className="text-slate-200 font-bold mt-0.5 block">&lt; 185 ms</span>
            </div>
          </div>

          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              onClick={onTrigger}
              disabled={isTriggering}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded bg-[#ED1C27] hover:bg-[#ff2a37] text-white text-xs font-bold font-mono transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Zap className={`w-3.5 h-3.5 ${isTriggering ? "animate-spin" : ""}`} />
              <span>{isTriggering ? "INSPECTING..." : "INSPECT FRAME"}</span>
            </button>

            <Link
              href="/inspection"
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 text-[11px] font-mono transition-colors text-center"
            >
              <span>LIVE RIG VIEW &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

