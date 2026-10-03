"use client";

import React from "react";
import { StatsOverview } from "@/lib/types";
import { GlowCard } from "@/components/ui/GlowCard";
import {
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Clock,
  Scan,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import { motion } from "framer-motion";

interface KPICardsProps {
  stats: StatsOverview | null;
}

export const KPICards: React.FC<KPICardsProps> = ({ stats }) => {
  const total = stats?.total_inspections || 0;
  const passCount = stats?.pass_count || 0;
  const failCount = stats?.fail_count || 0;
  const reworkCount = stats?.rework_count || 0;
  const reviewCount = stats?.review_count || 0;
  const passRate = stats?.pass_rate_pct || 0;
  const avgLatency = stats?.avg_latency_ms || 0;
  const ocrRate = stats?.ocr_success_rate_pct || 0;

  const cards = [
    {
      title: "TOTAL BILLETS",
      value: total.toLocaleString(),
      subtext: "Continuous In-Line",
      icon: Layers,
      glow: "cyan" as const,
      textColor: "text-cyan-400",
      badge: "100% Tracked",
      badgeColor: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    },
    {
      title: "PASS RATE",
      value: `${passRate.toFixed(1)}%`,
      subtext: `${passCount.toLocaleString()} Billets Conforming`,
      icon: CheckCircle2,
      glow: "emerald" as const,
      textColor: "text-emerald-400",
      badge: "ISO 9001",
      badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    },
    {
      title: "REWORK",
      value: reworkCount.toLocaleString(),
      subtext: "Surface Grinding Required",
      icon: AlertTriangle,
      glow: "amber" as const,
      textColor: "text-amber-400",
      badge: `${Math.round((reworkCount / Math.max(total, 1)) * 100)}%`,
      badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
    {
      title: "REJECTED (FAIL)",
      value: failCount.toLocaleString(),
      subtext: "Critical Dimensional / Crack",
      icon: XCircle,
      glow: "rose" as const,
      textColor: "text-rose-400",
      badge: `${Math.round((failCount / Math.max(total, 1)) * 100)}%`,
      badgeColor: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    },
    {
      title: "NEEDS REVIEW",
      value: reviewCount.toLocaleString(),
      subtext: "Operator Sign-Off Required",
      icon: HelpCircle,
      glow: "amber" as const,
      textColor: "text-yellow-400",
      badge: "Action Req",
      badgeColor: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    },
    {
      title: "OCR CONFIDENCE",
      value: `${ocrRate}%`,
      subtext: "Heat & Grade Extraction",
      icon: Scan,
      glow: "blue" as const,
      textColor: "text-blue-400",
      badge: ">=90% Conf",
      badgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    },
    {
      title: "CYCLE LATENCY",
      value: `${avgLatency} ms`,
      subtext: "5-Cam Edge Inference",
      icon: Clock,
      glow: "cyan" as const,
      textColor: "text-cyan-300",
      badge: "< 250ms",
      badgeColor: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <GlowCard
              glowColor={c.glow}
              className="p-4 flex flex-col justify-between h-full bg-[#070b14]/90 border-white/10"
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[10px] font-bold font-mono tracking-wider text-slate-400 uppercase truncate">
                  {c.title}
                </span>
                <Icon className={`w-4 h-4 ${c.textColor} shrink-0`} />
              </div>

              <div className="flex items-baseline justify-between gap-1 my-1">
                <span className={`text-xl font-black font-mono tracking-tight text-white`}>
                  {c.value}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border uppercase shrink-0 ${c.badgeColor}`}
                >
                  {c.badge}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 font-sans truncate mt-1">
                {c.subtext}
              </div>
            </GlowCard>
          </motion.div>
        );
      })}
    </div>
  );
};
