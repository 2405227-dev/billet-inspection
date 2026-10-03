"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScanEye,
  ScrollText,
  ShieldCheck,
  FileSpreadsheet,
  Settings2,
  BarChart3,
  Layers,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: "Command Center", href: "/dashboard", icon: LayoutDashboard },
  { name: "Live Inspection", href: "/inspection", icon: ScanEye, badge: "LIVE" },
  { name: "Every Billet Record", href: "/inspections", icon: ScrollText },
  { name: "Defect Analytics", href: "/defects", icon: BarChart3 },
  { name: "Audit Trail & Verification", href: "/audit", icon: ShieldCheck },
  { name: "Reports & Exports", href: "/reports", icon: FileSpreadsheet },
  { name: "Settings & Tolerances", href: "/settings", icon: Settings2 },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#090e18] border-r border-slate-800/80 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* Navigation Sections */}
        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
            Operations & QA
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-cyan-950/70 text-cyan-300 border border-cyan-700/50 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-cyan-400" : "text-slate-400"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Station Metrology Parameters Status Card */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Optical Metrology
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">CALIB OK</span>
          </div>
          <div className="space-y-1 text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
            <div className="flex justify-between">
              <span>Resolution:</span>
              <span className="text-slate-200">4096 × 2160</span>
            </div>
            <div className="flex justify-between">
              <span>Scale Ratio:</span>
              <span className="text-slate-200">0.439 mm/px</span>
            </div>
            <div className="flex justify-between">
              <span>Uncertainty:</span>
              <span className="text-emerald-400">±0.12 mm</span>
            </div>
            <div className="flex justify-between">
              <span>Active Cameras:</span>
              <span className="text-slate-200">5 / 5 Views</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operator Footer Status */}
      <div className="p-4 border-t border-slate-800/80 bg-[#070b13]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
            QA
          </div>
          <div className="text-xs">
            <div className="font-bold text-slate-200">Operator #104</div>
            <div className="text-[10px] text-slate-500 font-mono">Shift A • Station Alpha</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
