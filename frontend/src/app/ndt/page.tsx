"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Radio, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function NDTStationRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/inspection/eca");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 font-mono text-center">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-[#0c0e14] border border-amber-500/40 text-amber-400">
          <Radio className="w-6 h-6 animate-pulse" />
        </div>
        <ArrowRight className="w-4 h-4 text-slate-500" />
        <div className="p-3 rounded-lg bg-[#0c0e14] border border-emerald-500/40 text-emerald-400">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-lg font-bold text-white tracking-wide">
          REDIRECTING TO SPECIALIZED INSPECTION STATIONS
        </h1>
        <p className="text-xs text-slate-400 max-w-md">
          NDT inspection has been separated into dedicated ECA (Surface) and PAUT (Volumetric) inspection stations.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2 text-xs">
        <Link
          href="/inspection/eca"
          className="px-4 py-2 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 flex items-center gap-2"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Open ECA Inspection</span>
        </Link>
        <Link
          href="/inspection/paut"
          className="px-4 py-2 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-2"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Open PAUT Inspection</span>
        </Link>
      </div>
    </div>
  );
}
