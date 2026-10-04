"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, AlertOctagon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="bg-[#0c0e14] border border-white/[0.08] rounded-lg p-8 max-w-md w-full space-y-4">
        <div className="w-10 h-10 rounded bg-[#ED1C27]/10 border border-[#ED1C27]/30 text-[#ED1C27] flex items-center justify-center mx-auto">
          <AlertOctagon className="w-5 h-5" />
        </div>

        <div className="space-y-1 font-mono">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">
            ERROR 404 / ENCODER INVALID
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Record / Viewport Not Found
          </h1>
        </div>

        <p className="text-xs text-slate-400 font-sans leading-relaxed">
          The requested inspection record, telemetry stream, or station route could not be resolved by the local registry index.
        </p>

        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#ED1C27] hover:bg-[#ff2a37] text-white font-mono font-bold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Command Center</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
