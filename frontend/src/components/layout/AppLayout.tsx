"use client";

import React, { useState, useEffect } from "react";
import { BilletNavbar } from "./BilletNavbar";
import { ParticleField } from "@/components/ui/ParticleField";
import { getWsUrl } from "@/lib/api";
import { AlertItem } from "@/lib/types";
import { AlertCircle, X, ShieldAlert, Radio, Cpu, Activity } from "lucide-react";
import Link from "next/link";

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeAlerts, setActiveAlerts] = useState<AlertItem[]>([]);
  const [toastAlert, setToastAlert] = useState<AlertItem | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      try {
        const wsUrl = getWsUrl("/ws/alerts");
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "OPERATOR_ALERT") {
              const newAlert = msg.data as AlertItem;
              setActiveAlerts((prev) => [newAlert, ...prev.slice(0, 20)]);
              setToastAlert(newAlert);
              setTimeout(() => {
                setToastAlert((curr) => (curr?.id === newAlert.id ? null : curr));
              }, 7000);
            }
          } catch (e) {
            console.error("WS Parse error", e);
          }
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (err) {
        console.error("WS Alert connection failed", err);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 relative">
      {/* Ambient Canvas Particles (CaeliFi style) */}
      <ParticleField />

      {/* Floating Spring Navbar (E-Cell / E-Summit style) */}
      <BilletNavbar />

      {/* Real-time Operator Urgent Toast Banner */}
      {toastAlert && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-[#13090e]/95 border border-rose-500/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(239,68,68,0.3)] backdrop-blur-xl animate-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                    {toastAlert.severity} DEFECT ALERT
                  </span>
                  <span className="text-xs text-rose-300 font-mono font-semibold">
                    {toastAlert.details?.billet_id || "BILLET"}
                  </span>
                </div>
                <div className="font-bold text-sm text-white mt-1.5">{toastAlert.title}</div>
                <div className="text-xs text-slate-300 mt-1 leading-relaxed">{toastAlert.message}</div>
                {toastAlert.details?.billet_id && (
                  <Link
                    href={`/inspections/${toastAlert.details.billet_id}`}
                    className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold mt-2 underline underline-offset-4"
                  >
                    Inspect Defect Evidence &rarr;
                  </Link>
                )}
              </div>
            </div>
            <button
              onClick={() => setToastAlert(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative z-10">
        {children}
      </main>

      {/* Industrial Precision Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#070b14]/80 backdrop-blur-md py-6 px-4 sm:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-slate-300 font-medium">NIT RAIPUR LINE #1 AUTOMATION</span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-slate-500">ISO 9001 / ASTM E384 COMPLIANT</span>
          </div>
          <div className="flex items-center gap-6 font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>GIGE 4K CAM: 5/5</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>OPC-UA: 12ms</span>
            </span>
            <span className="text-slate-500">BILLETVISION v2.4.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
