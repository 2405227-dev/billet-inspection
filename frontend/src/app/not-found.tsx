"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, ScanLine } from "lucide-react";

export default function NotFound() {
  return (
    <AppLayout>
      <div className="relative min-h-[75vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#ED1C27]/15 rounded-full blur-[140px]" />

        {/* Large 404 with Fiery Central Graphic (Signature E-Summit Layout) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-4 flex items-center justify-center select-none"
        >
          <div className="flex items-center text-[120px] sm:text-[180px] font-black leading-none tracking-tighter text-[#ED1C27] font-mono drop-shadow-[0_0_40px_rgba(237,28,39,0.5)]">
            <span>4</span>
            <div className="relative mx-1 sm:mx-2 w-24 sm:w-36 h-24 sm:h-36 rounded-full bg-[#ED1C27] flex items-center justify-center shadow-[0_0_30px_#ED1C27]">
              <ScanLine className="w-14 sm:w-20 h-14 sm:h-20 text-white animate-pulse" />
            </div>
            <span>4</span>
          </div>
        </motion.div>

        {/* Page Not Found Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-3"
        >
          Page Not Found
        </motion.h1>

        {/* Description with Red Link */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm sm:text-base text-white/50 max-w-md mx-auto mb-8 font-normal leading-relaxed"
        >
          The Page you are looking for either doesn't exist or an inspection error occurred. Go back, or head over to{" "}
          <Link href="/dashboard" className="text-[#ED1C27] font-semibold hover:underline underline-offset-4">
            Home
          </Link>
        </motion.p>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#ED1C27] hover:bg-[#ff2a37] text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(237,28,39,0.4)] active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Command Center
          </Link>
        </motion.div>
      </div>
    </AppLayout>
  );
}
