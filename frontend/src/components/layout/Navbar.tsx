"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Play,
  Square,
  FastForward,
  Wifi,
  Bell,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  startSimulator,
  stopSimulator,
  fetchSimulatorStatus,
  triggerSingleInspection,
} from "@/lib/api";

export const Navbar: React.FC<{ activeAlertsCount?: number }> = ({
  activeAlertsCount = 0,
}) => {
  const [timeStr, setTimeStr] = useState<string>("");
  const [isSimRunning, setIsSimRunning] = useState<boolean>(false);
  const [isSimLoading, setIsSimLoading] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toISOString().replace("T", " ").substring(0, 19) + " IST"
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchSimulatorStatus().then((s) => {
      if (s) setIsSimRunning(s.is_running);
    });
  }, []);

  const handleToggleSimulator = async () => {
    setIsSimLoading(true);
    try {
      if (isSimRunning) {
        await stopSimulator();
        setIsSimRunning(false);
      } else {
        await startSimulator(3.5);
        setIsSimRunning(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimLoading(false);
    }
  };

  const handleStepOnce = async () => {
    setIsSimLoading(true);
    try {
      await triggerSingleInspection({ scenario: "NORMAL" });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimLoading(false);
    }
  };

  return (
    <header className="h-16 bg-[#0c1220] border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      {/* Brand & Plant Identity */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wider text-slate-100 uppercase">
                NIT Raipur Billet Inspection Platform
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                PROD v2.4
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-slate-300 font-medium">Integrated Steel Rolling Line #1</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PLC SYNC ONLINE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Simulator Control Dock */}
      <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg shadow-inner">
        <div className="flex items-center gap-1.5 pr-3 border-r border-slate-800">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
            DEMO / SIMULATION MODE
          </span>
        </div>

        <button
          onClick={handleToggleSimulator}
          disabled={isSimLoading}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
            isSimRunning
              ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40 shadow-sm"
              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 shadow-sm"
          }`}
          title={isSimRunning ? "Stop Continuous Line Simulator" : "Start Continuous Line Simulator"}
        >
          {isSimRunning ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isSimRunning ? "Stop Feed" : "Auto Run"}</span>
        </button>

        <button
          onClick={handleStepOnce}
          disabled={isSimLoading || isSimRunning}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50"
          title="Inspect single simulated billet"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>Step Billet</span>
        </button>
      </div>

      {/* Right Telemetry: Time, Live WS, Alert Bell */}
      <div className="flex items-center gap-5">
        <div className="text-right hidden md:block">
          <div className="text-xs font-mono font-bold text-slate-200">{timeStr}</div>
          <div className="text-[10px] text-slate-400 font-mono">Conveyor Speed: 0.85 m/s</div>
        </div>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
            <Wifi className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">WS LIVE</span>
          </div>

          <div className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <Bell className="w-4 h-4" />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {activeAlertsCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
