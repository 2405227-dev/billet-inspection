"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Radio,
  Boxes,
  Cpu,
  ChevronDown,
  AlertTriangle,
  Terminal,
  Sliders,
  SlidersHorizontal,
} from "lucide-react";

interface SubNavItem {
  name: string;
  link: string;
  desc?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  name: string;
  link?: string;
  icon: React.ComponentType<{ className?: string }>;
  items?: SubNavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    name: "COMMAND CENTER",
    link: "/dashboard",
    icon: Activity,
  },
  {
    name: "INSPECTION",
    icon: Camera,
    items: [
      {
        name: "Live Inspection",
        link: "/inspection",
        desc: "Live camera stream, tracking & metrology",
        icon: Camera,
      },
      {
        name: "ECA Inspection",
        link: "/inspection/eca",
        desc: "Eddy Current Array surface & near-surface inspection",
        icon: Radio,
      },
      {
        name: "PAUT Inspection",
        link: "/inspection/paut",
        desc: "Phased Array Ultrasonic volumetric core inspection",
        icon: Activity,
      },
    ],
  },
  {
    name: "QUALITY",
    icon: Layers,
    items: [
      {
        name: "Inspections",
        link: "/inspections",
        desc: "Historical inspection records database",
        icon: Layers,
      },
      {
        name: "Defects",
        link: "/defects",
        desc: "Defect taxonomy & severity classification",
        icon: Eye,
      },
      {
        name: "Review Queue",
        link: "/inspections?status=NEEDS_REVIEW",
        desc: "Human-in-the-loop disposition queue",
        icon: AlertTriangle,
      },
    ],
  },
  {
    name: "TRACEABILITY",
    icon: Boxes,
    items: [
      {
        name: "Digital Billet Twin",
        link: "/digital-twin",
        desc: "3D/2D spatial defect model & timeline",
        icon: Boxes,
      },
      {
        name: "Audit Trail",
        link: "/audit",
        desc: "SHA-256 immutable ledger & tamper verification",
        icon: ShieldCheck,
      },
      {
        name: "Reports",
        link: "/reports",
        desc: "Excel workbooks, CSVs & PDF passports",
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    name: "SYSTEM",
    icon: Settings,
    items: [
      {
        name: "Cameras",
        link: "/system#cameras",
        desc: "GigE optical multi-camera status",
        icon: Camera,
      },
      {
        name: "Sensors",
        link: "/system#sensors",
        desc: "ECA and PAUT instrument HAL adapters",
        icon: Radio,
      },
      {
        name: "Encoder",
        link: "/system#encoder",
        desc: "Millimeter position & speed tracking",
        icon: Sliders,
      },
      {
        name: "PLC / OPC-UA",
        link: "/system#plc",
        desc: "Industrial discrete I/O & reject actuation",
        icon: Terminal,
      },
      {
        name: "Configuration",
        link: "/settings",
        desc: "Dimensional tolerances & defect thresholds",
        icon: Settings,
      },
    ],
  },
];

export const BilletVisionNavbar: React.FC = () => {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  const isGroupActive = (group: NavGroup): boolean => {
    if (group.link) {
      return pathname === group.link;
    }
    if (group.items) {
      return group.items.some(
        (item) => pathname === item.link || (item.link.includes("?") && pathname === item.link.split("?")[0])
      );
    }
    return false;
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#080a0f]/95 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={navRef}>
        <div className="flex items-center justify-between h-14">
          {/* LEFT: Compact Brand & System Status */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded bg-[#13161f] border border-white/10 flex items-center justify-center group-hover:border-[#ED1C27]/60 transition-colors">
                <ScanLine className="w-4 h-4 text-[#ED1C27]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-xs font-bold tracking-wider text-white font-mono">
                    BILLET VISION
                  </span>
                  <span className="text-[9px] px-1 py-0.2 rounded-sm bg-white/10 text-white/70 font-mono">
                    HMI
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] tracking-wider text-slate-400 font-mono">
                    LINE 01 • ONLINE
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* CENTER: 5 Primary Navigation Items with Dropdowns */}
          <nav className="hidden lg:flex items-center gap-1 font-mono text-[11px]">
            {NAV_GROUPS.map((group) => {
              const active = isGroupActive(group);
              const isOpen = openDropdown === group.name;
              const Icon = group.icon;

              if (group.link) {
                return (
                  <Link
                    key={group.name}
                    href={group.link}
                    className={`
                      relative px-3 py-1.5 rounded text-[11px] font-semibold tracking-wider transition-colors flex items-center gap-1.5
                      ${
                        active
                          ? "text-white bg-white/[0.06] border border-white/10"
                          : "text-slate-400 hover:text-white hover:bg-white/[0.03] border border-transparent"
                      }
                    `}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? "text-[#ED1C27]" : "text-slate-500"}`} />
                    <span>{group.name}</span>
                    {active && (
                      <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#ED1C27] rounded-full" />
                    )}
                  </Link>
                );
              }

              return (
                <div key={group.name} className="relative">
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : group.name)}
                    onMouseEnter={() => setOpenDropdown(group.name)}
                    className={`
                      px-3 py-1.5 rounded text-[11px] font-semibold tracking-wider transition-colors flex items-center gap-1.5
                      ${
                        active || isOpen
                          ? "text-white bg-white/[0.06] border border-white/10"
                          : "text-slate-400 hover:text-white hover:bg-white/[0.03] border border-transparent"
                      }
                    `}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? "text-[#ED1C27]" : "text-slate-500"}`} />
                    <span>{group.name}</span>
                    <ChevronDown
                      className={`w-3 h-3 text-slate-500 transition-transform duration-150 ${
                        isOpen ? "rotate-180 text-white" : ""
                      }`}
                    />
                    {active && (
                      <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#ED1C27] rounded-full" />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 2, scale: 0.98 }}
                        transition={{ duration: 0.12 }}
                        onMouseLeave={() => setOpenDropdown(null)}
                        className="absolute top-full left-0 mt-1 w-64 bg-[#0d1017] border border-white/10 rounded-lg p-1.5 shadow-2xl backdrop-blur-xl z-50 font-mono"
                      >
                        <div className="px-2 py-1 text-[9px] text-slate-500 font-bold uppercase tracking-wider border-b border-white/5 mb-1">
                          {group.name} MODULES
                        </div>
                        <div className="space-y-0.5">
                          {group.items?.map((subItem) => {
                            const isSubActive =
                              pathname === subItem.link ||
                              (subItem.link.includes("?") && pathname === subItem.link.split("?")[0]);
                            const SubIcon = subItem.icon;
                            return (
                              <Link
                                key={subItem.link}
                                href={subItem.link}
                                onClick={() => setOpenDropdown(null)}
                                className={`
                                  flex items-start gap-2.5 p-2 rounded transition-colors group
                                  ${
                                    isSubActive
                                      ? "bg-white/[0.08] text-white"
                                      : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                                  }
                                `}
                              >
                                <SubIcon
                                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                                    isSubActive ? "text-[#ED1C27]" : "text-slate-500 group-hover:text-slate-300"
                                  }`}
                                />
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold leading-tight">
                                    {subItem.name}
                                  </span>
                                  {subItem.desc && (
                                    <span className="text-[10px] text-slate-500 leading-tight mt-0.5">
                                      {subItem.desc}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* RIGHT: Structured Telemetry Strip */}
          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] shrink-0">
            {/* Camera Status */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#11141c] border border-white/5 text-slate-400">
              <span className="text-slate-500 text-[10px]">CAM:</span>
              <span className="text-slate-200 font-bold text-[10px]">05/05</span>
            </div>

            {/* Operator Badge */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#11141c] border border-white/5 text-slate-300">
              <div className="w-4 h-4 rounded bg-white/10 text-white flex items-center justify-center text-[9px] font-bold">
                OP
              </div>
              <span className="text-[10px] text-slate-300 font-bold">OP-104</span>
            </div>

            {/* Settings Quick Access */}
            <Link
              href="/settings"
              title="System Configuration & Tolerances"
              className={`
                p-1.5 rounded border transition-colors
                ${
                  pathname === "/settings"
                    ? "bg-[#ED1C27]/20 border-[#ED1C27]/50 text-white"
                    : "bg-[#11141c] border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                }
              `}
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-1.5 rounded border border-white/10 bg-white/5 text-white/80 hover:text-white"
              aria-label="Toggle Menu"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Accordion Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-white/10 py-3 font-mono space-y-2"
            >
              {NAV_GROUPS.map((group) => {
                if (group.link) {
                  return (
                    <Link
                      key={group.name}
                      href={group.link}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
                    >
                      <group.icon className="w-4 h-4 text-slate-400" />
                      <span>{group.name}</span>
                    </Link>
                  );
                }

                return (
                  <div key={group.name} className="space-y-1">
                    <div className="px-3 py-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {group.name}
                    </div>
                    <div className="pl-3 space-y-0.5 border-l border-white/10 ml-2">
                      {group.items?.map((sub) => (
                        <Link
                          key={sub.link}
                          href={sub.link}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-slate-300 hover:bg-white/5 hover:text-white"
                        >
                          <sub.icon className="w-3.5 h-3.5 text-slate-500" />
                          <span>{sub.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
