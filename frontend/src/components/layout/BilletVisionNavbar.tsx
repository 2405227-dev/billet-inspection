"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import {
  Activity,
  Camera,
  Layers,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  Menu,
  X,
  Eye,
  ScanLine,
  User,
} from "lucide-react";

interface NavItem {
  name: string;
  link: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: "COMMAND CENTER", link: "/dashboard", icon: Activity },
  { name: "LIVE INSPECTION", link: "/inspection", icon: Camera },
  { name: "INSPECTIONS", link: "/inspections", icon: Layers },
  { name: "DEFECTS", link: "/defects", icon: Eye },
  { name: "AUDIT", link: "/audit", icon: ShieldCheck },
  { name: "REPORTS", link: "/reports", icon: FileSpreadsheet },
];

export const BilletVisionNavbar = () => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 30);
  });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="fixed top-0 left-0 w-full z-50 transition-all duration-300 pointer-events-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pointer-events-auto">
        <motion.nav
          animate={{
            backgroundColor: scrolled ? "rgba(12, 14, 18, 0.94)" : "rgba(13, 15, 20, 0.8)",
            backdropFilter: "blur(16px)",
            borderColor: scrolled ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.08)",
            boxShadow: scrolled
              ? "0 12px 28px -6px rgba(0, 0, 0, 0.8), 0 1px 0 rgba(255, 255, 255, 0.05) inset"
              : "0 4px 16px -2px rgba(0, 0, 0, 0.4)",
          }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="relative flex items-center justify-between rounded-xl border px-4 sm:px-5 py-2.5"
        >
          {/* Brand Identity */}
          <Link href="/dashboard" className="flex items-center gap-3 shrink-0 group">
            <div className="w-7 h-7 rounded-md bg-[#161a22] border border-white/10 flex items-center justify-center group-hover:border-[#ED1C27]/50 transition-colors">
              <ScanLine className="w-4 h-4 text-[#ED1C27]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xs font-bold tracking-wider text-white font-mono">
                  BILLETVISION
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-white/70 font-mono">
                  v2.4
                </span>
              </div>
              <span className="text-[9px] tracking-widest text-slate-400 font-mono mt-0.5">
                NIT RAIPUR · LINE 01
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.link ||
                (item.link !== "/dashboard" && pathname.startsWith(item.link));
              const Icon = item.icon;

              return (
                <Link
                  key={item.link}
                  href={item.link}
                  className={`
                    relative px-3 py-1.5 rounded-md text-[11px] font-semibold tracking-wider transition-colors flex items-center gap-1.5 font-mono
                    ${
                      isActive
                        ? "text-white bg-white/[0.05]"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                    }
                  `}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#ED1C27]" : "text-slate-500"}`} />
                  <span>{item.name}</span>

                  {/* Clean Bottom Red Active Indicator Line (Restrained) */}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active-line"
                      className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#ED1C27] rounded-full"
                      transition={{ type: "spring", stiffness: 350, damping: 35 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Section: System Online, Telemetry & Operator Avatar */}
          <div className="hidden sm:flex items-center gap-3 shrink-0 font-mono text-[11px]">
            {/* System Online Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#07080a] border border-white/5 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-300">LINE 01 ONLINE</span>
            </div>

            {/* Camera Metric */}
            <div className="hidden xl:flex items-center gap-1 text-[10px] text-slate-400">
              <span className="text-slate-500">CAM:</span>
              <span className="text-slate-200 font-bold">05/05</span>
            </div>

            {/* Operator Badge */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
              <div className="w-6 h-6 rounded bg-[#161a22] border border-white/10 text-white/80 flex items-center justify-center text-[10px] font-bold">
                OP
              </div>
              <span className="text-[10px] text-slate-400">OP-104</span>
            </div>

            {/* Settings Button */}
            <Link
              href="/settings"
              title="Calibration & System Settings"
              className={`
                p-1.5 rounded-md border border-white/10 bg-white/[0.02] text-slate-400 hover:text-white hover:border-white/20 transition-all
                ${pathname === "/settings" ? "border-[#ED1C27]/50 text-white bg-[#ED1C27]/10" : ""}
              `}
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-white/80"
              aria-label="Toggle Menu"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </motion.nav>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="mt-2 rounded-xl border border-white/10 bg-[#0d0f14]/98 p-3 backdrop-blur-xl shadow-2xl lg:hidden"
            >
              <div className="flex flex-col gap-1 font-mono text-xs">
                {navItems.map((item) => {
                  const isActive = pathname === item.link;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.link}
                      href={item.link}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors
                        ${
                          isActive
                            ? "bg-white/[0.08] text-white font-bold border-l-2 border-[#ED1C27]"
                            : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-[#ED1C27]" : "text-slate-500"}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                <div className="my-1.5 border-t border-white/5" />

                <Link
                  href="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/[0.04] hover:text-white"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>CALIBRATION & SETTINGS</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
