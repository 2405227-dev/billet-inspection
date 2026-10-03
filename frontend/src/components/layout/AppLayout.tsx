"use client";

import React, { useState, useEffect } from "react";
import { BilletVisionNavbar } from "./BilletVisionNavbar";
import { getWsUrl } from "@/lib/api";
import { AlertItem } from "@/lib/types";
import { AlertCircle, X, ShieldAlert, Radio, Cpu } from "lucide-react";
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
    <div className="min-h-screen bg-[#07080b] text-slate-200 flex flex-col font-sans antialiased selection:bg-[#ED1C27]/30 selection:text-white relative">
      {/* Precision Floating Navbar */}
      <BilletVisionNavbar />

      {/* Real-time Operator Urgent Toast Banner */}
      {toastAlert && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-[#130b0e] border border-[#ED1C27]/40 rounded-xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#ED1C27]/20 text-[#ED1C27] border border-[#ED1C27]/30 shrink-0">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#ED1C27]/20 text-[#ED1C27] uppercase">
                    {toastAlert.severity} ALERT
                  </span>
                  <span className="text-xs text-white/80 font-mono font-semibold">
                    {toastAlert.details?.billet_id || "BILLET"}
                  </span>
                </div>
                <div className="font-semibold text-sm text-white mt-1">{toastAlert.title}</div>
                <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toastAlert.message}</div>
                {toastAlert.details?.billet_id && (
                  <Link
                    href={`/inspections/${toastAlert.details.billet_id}`}
                    className="inline-flex items-center gap-1 text-xs text-[#ED1C27] hover:text-[#ff4d56] font-semibold mt-2 underline underline-offset-4 font-mono"
                  >
                    View Inspection Record &rarr;
                  </Link>
                )}
              </div>
            </div>
            <button
              onClick={() => setToastAlert(null)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative z-10">
        {children}
      </main>

      {/* Precision Industrial Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#090b0e] py-4 px-4 sm:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>NIT RAIPUR LINE 01</span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500">ISO 9001 / ASTM E384 COMPLIANT</span>
          </div>
          <div className="flex items-center gap-5 text-slate-400">
            <span>5/5 GIGE CAMERAS</span>
            <span>OPC-UA: 12ms</span>
            <span className="text-slate-500">BILLETVISION v2.4.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
