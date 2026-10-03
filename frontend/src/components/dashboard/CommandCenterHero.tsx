"use client";

import React from "react";
import { motion } from "framer-motion";
import { Play, Shield, Activity, ScanLine, ArrowRight } from "lucide-react";
import Link from "next/link";

interface HeroProps {
  totalInspected?: number;
  passRate?: number;
  activeBatch?: string;
}

export const CommandCenterHero: React.FC<HeroProps> = ({
  totalInspected = 1284,
  passRate = 93.8,
  activeBatch = "HEAT-26A-1042",
}) => {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a]/90 p-6 sm:p-10 backdrop-blur-2xl mb-8 shadow-2xl">
      {/* Ambient background glow (E-Summit Red / Amber) */}
      <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[550px] h-[280px] bg-[#ED1C27]/15 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-28 right-10 w-[400px] h-[220px] bg-[#ff6a00]/10 rounded-full blur-[110px]" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Industry Pill Badge (E-Summit / CaeliFi style) */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-[11px] sm:text-xs text-white/80 mb-5 backdrop-blur-md shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-[#ED1C27] animate-pulse shrink-0" />
          <span className="font-semibold text-white">NIT RAIPUR LINE #1</span>
          <span className="text-white/30">•</span>
          <span className="text-[#ED1C27] font-mono font-bold">100% IN-LINE BILLET INSPECTION</span>
          <span className="text-white/30">•</span>
          <span className="text-amber-400 font-mono">{activeBatch}</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12] mb-4"
        >
          AI-Powered Steel Billet Inspection.{" "}
          <br className="hidden sm:block" />
          <span className="text-gradient-fire">Real-Time Metrology & Defect Traceability.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs sm:text-base text-white/60 max-w-3xl mx-auto mb-6 leading-relaxed font-normal"
        >
          Continuous sub-millimeter dimensional verification ($\le \pm 1.0\%$), automated CLAHE tiled micro-crack segmentation,
          OCR Heat ID extraction, and cryptographic SHA-256 audit trails for every billet on the cooling bed.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/inspection"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#ED1C27] hover:bg-[#ff2a37] text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_24px_rgba(237,28,39,0.45)] hover:shadow-[0_0_30px_rgba(237,28,39,0.7)] active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-white" />
            Launch Live Camera Stream
          </Link>

          <Link
            href="/inspections"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-semibold text-xs sm:text-sm transition-all active:scale-[0.98]"
          >
            <Activity className="w-4 h-4 text-[#ED1C27]" />
            Inspection History ({totalInspected.toLocaleString()})
          </Link>

          <Link
            href="/audit"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#ff6a00]/10 hover:bg-[#ff6a00]/20 border border-[#ff6a00]/30 text-amber-300 font-semibold text-xs sm:text-sm transition-all active:scale-[0.98]"
          >
            <Shield className="w-4 h-4 text-amber-400" />
            Verify SHA-256 Chain
          </Link>
        </motion.div>

        {/* Quick KPI Strip (E-Summit signature layout) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto p-3.5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md"
        >
          <div className="text-center py-1 sm:border-r border-white/10">
            <div className="text-base sm:text-2xl font-bold font-mono text-white">
              {totalInspected.toLocaleString()}
            </div>
            <div className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5 font-mono">
              Total Billets
            </div>
          </div>
          <div className="text-center py-1 sm:border-r border-white/10">
            <div className="text-base sm:text-2xl font-bold font-mono text-emerald-400">
              {passRate.toFixed(1)}%
            </div>
            <div className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5 font-mono">
              First-Pass Yield
            </div>
          </div>
          <div className="text-center py-1 sm:border-r border-white/10">
            <div className="text-base sm:text-2xl font-bold font-mono text-[#ff8c00]">
              &lt; 180 ms
            </div>
            <div className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5 font-mono">
              Cycle Latency
            </div>
          </div>
          <div className="text-center py-1">
            <div className="text-base sm:text-2xl font-bold font-mono text-[#ED1C27]">
              100% SHA-256
            </div>
            <div className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5 font-mono">
              Audit Verified
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
