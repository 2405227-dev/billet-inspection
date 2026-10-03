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
} from "lucide-react";

interface NavLinkItem {
  name: string;
  link: string;
  icon: React.ComponentType<{ className?: string }>;
}

const leftNavItems: NavLinkItem[] = [
  { name: "COMMAND CENTER", link: "/dashboard", icon: Activity },
  { name: "LIVE STREAM", link: "/inspection", icon: Camera },
  { name: "INSPECTIONS", link: "/inspections", icon: Layers },
];

const rightNavItems: NavLinkItem[] = [
  { name: "DEFECTS", link: "/defects", icon: Eye },
  { name: "AUDIT", link: "/audit", icon: ShieldCheck },
  { name: "REPORTS", link: "/reports", icon: FileSpreadsheet },
];

export const BilletNavbar = () => {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > 50);
  });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const allItems = [...leftNavItems, ...rightNavItems];

  return (
    <header className="fixed top-0 left-0 w-full z-[9999] pt-3 px-3 sm:px-6 pointer-events-none">
      {/* Desktop 3-Segment E-Summit Floating Navbar */}
      <div className="hidden lg:flex w-full justify-center pointer-events-auto">
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{
            y: visible ? 8 : 0,
            opacity: 1,
            width: visible ? "80%" : "94%",
            backgroundColor: visible ? "rgba(10, 10, 10, 0.94)" : "rgba(10, 10, 10, 0.75)",
            backdropFilter: "blur(20px)",
            boxShadow: visible
              ? "0 24px 48px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.12), 0 1px 0 rgba(255, 255, 255, 0.12) inset"
              : "0 10px 30px -6px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)",
          }}
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 30,
          }}
          className="relative flex items-center justify-between rounded-full border border-white/10 px-6 py-2.5 max-w-7xl"
        >
          {/* Left Links */}
          <div
            className="flex items-center gap-1.5"
            onMouseLeave={() => setHoveredLink(null)}
          >
            {leftNavItems.map((item) => {
              const isActive =
                pathname === item.link ||
                (item.link !== "/dashboard" && pathname.startsWith(item.link));
              const isHovered = hoveredLink === item.link;
              const Icon = item.icon;

              return (
                <Link
                  key={item.link}
                  href={item.link}
                  onMouseEnter={() => setHoveredLink(item.link)}
                  className={`
                    relative px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wider transition-colors flex items-center gap-1.5 font-mono
                    ${isActive ? "text-white font-bold" : "text-white/60 hover:text-white"}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="esummit-nav-active"
                      className="absolute inset-0 rounded-full bg-[#ED1C27]/20 border border-[#ED1C27]/50 shadow-[0_0_16px_rgba(237,28,39,0.35)]"
                      transition={{ type: "spring", stiffness: 320, damping: 32 }}
                    />
                  )}
                  {isHovered && !isActive && (
                    <motion.div
                      layoutId="esummit-nav-hover"
                      className="absolute inset-0 rounded-full bg-white/[0.08]"
                      transition={{ type: "spring", stiffness: 320, damping: 32 }}
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? "text-[#ED1C27]" : "text-white/50"}`} />
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Center Brand Identity (E-Summit / BilletVision Style) */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-1 rounded-full group transition-all"
          >
            <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-[#ED1C27]/20 border border-[#ED1C27]/50 group-hover:border-[#ED1C27] transition-all shadow-[0_0_15px_rgba(237,28,39,0.4)]">
              <ScanLine className="w-4 h-4 text-[#ED1C27] animate-pulse" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-black tracking-widest text-white font-mono flex items-center gap-1.5">
                BILLETVISION
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ED1C27] text-white font-bold shadow-[0_0_8px_#ED1C27]">
                  26
                </span>
              </span>
              <span className="text-[8px] tracking-widest text-white/50 uppercase -mt-0.5">
                AI INDUSTRIAL INSPECTION
              </span>
            </div>
          </Link>

          {/* Right Links & Red Profile Avatar */}
          <div
            className="flex items-center gap-2"
            onMouseLeave={() => setHoveredLink(null)}
          >
            {rightNavItems.map((item) => {
              const isActive = pathname === item.link || (item.link !== "/dashboard" && pathname.startsWith(item.link));
              const isHovered = hoveredLink === item.link;
              const Icon = item.icon;

              return (
                <Link
                  key={item.link}
                  href={item.link}
                  onMouseEnter={() => setHoveredLink(item.link)}
                  className={`
                    relative px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wider transition-colors flex items-center gap-1.5 font-mono
                    ${isActive ? "text-white font-bold" : "text-white/60 hover:text-white"}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="esummit-nav-active"
                      className="absolute inset-0 rounded-full bg-[#ED1C27]/20 border border-[#ED1C27]/50 shadow-[0_0_16px_rgba(237,28,39,0.35)]"
                      transition={{ type: "spring", stiffness: 320, damping: 32 }}
                    />
                  )}
                  {isHovered && !isActive && (
                    <motion.div
                      layoutId="esummit-nav-hover"
                      className="absolute inset-0 rounded-full bg-white/[0.08]"
                      transition={{ type: "spring", stiffness: 320, damping: 32 }}
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? "text-[#ED1C27]" : "text-white/50"}`} />
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}

            {/* Signature E-Summit Red Circular Avatar Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div
                title="Line #1 Operator Active"
                className="w-7 h-7 rounded-full bg-[#ED1C27] text-white font-bold text-xs flex items-center justify-center shadow-[0_0_12px_rgba(237,28,39,0.5)] transition-transform hover:scale-105 cursor-pointer"
              >
                D
              </div>

              <Link
                href="/settings"
                title="Calibration & System Settings"
                className={`
                  p-1.5 rounded-full border border-white/10 bg-white/[0.04] text-white/60 hover:text-white hover:border-[#ED1C27]/60 hover:bg-[#ED1C27]/10 transition-all
                  ${pathname === "/settings" ? "border-[#ED1C27] text-white bg-[#ED1C27]/20" : ""}
                `}
              >
                <Settings className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.nav>
      </div>

      {/* Mobile E-Summit Style Navbar */}
      <div className="flex lg:hidden w-full pointer-events-auto">
        <motion.div
          animate={{
            y: visible ? 4 : 0,
            backdropFilter: "blur(20px)",
            backgroundColor: "rgba(10, 10, 10, 0.94)",
          }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
          className="relative mx-auto flex w-full items-center justify-between rounded-2xl border border-white/10 px-4 py-2.5 shadow-2xl"
        >
          {/* Mobile Left: Icon */}
          <div className="w-7 h-7 rounded-lg bg-[#ED1C27]/20 border border-[#ED1C27]/50 flex items-center justify-center">
            <ScanLine className="w-4 h-4 text-[#ED1C27]" />
          </div>

          {/* Mobile Center: Logo */}
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <span className="text-xs font-black tracking-wider text-white font-mono">
              BILLETVISION
            </span>
            <span className="text-[9px] px-1 rounded bg-[#ED1C27] text-white font-bold">
              26
            </span>
          </Link>

          {/* Mobile Right: Red Avatar + Menu Toggle */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#ED1C27] text-white font-bold text-[10px] flex items-center justify-center shadow-[0_0_8px_#ED1C27]">
              D
            </div>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle Navigation"
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-white"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-2 mx-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0a0a]/98 p-4 backdrop-blur-2xl shadow-2xl lg:hidden pointer-events-auto"
          >
            <nav className="flex flex-col gap-1">
              {allItems.map((item) => {
                const isActive = pathname === item.link;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.link}
                    href={item.link}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all font-mono
                      ${
                        isActive
                          ? "bg-[#ED1C27]/20 text-white border border-[#ED1C27]/50"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#ED1C27]" : "text-white/40"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              <div className="my-2 border-t border-white/10" />

              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:bg-white/5 font-mono"
              >
                <Settings className="w-4 h-4 text-white/40" />
                <span>CALIBRATION & SETTINGS</span>
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
