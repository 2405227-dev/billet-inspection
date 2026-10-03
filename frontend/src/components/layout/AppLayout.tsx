"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { getWsUrl } from "@/lib/api";
import { AlertItem } from "@/lib/types";
import { AlertCircle, X } from "lucide-react";

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
              }, 6000);
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
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      <Navbar activeAlertsCount={activeAlerts.length} />

      {/* Real-time Operator Urgent Toast Banner */}
      {toastAlert && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-rose-950/95 border-2 border-rose-600 rounded-xl p-4 shadow-2xl shadow-rose-950/80 backdrop-blur-md animate-bounce-short">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-900/80 text-rose-300">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-rose-900 text-rose-200 uppercase">
                    {toastAlert.severity} ALERT
                  </span>
                  <span className="text-xs text-rose-300 font-mono">
                    {toastAlert.details?.billet_id || "BILLET"}
                  </span>
                </div>
                <div className="font-bold text-sm text-white mt-1">{toastAlert.title}</div>
                <div className="text-xs text-rose-200/90 mt-0.5">{toastAlert.message}</div>
              </div>
            </div>
            <button
              onClick={() => setToastAlert(null)}
              className="text-rose-400 hover:text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
