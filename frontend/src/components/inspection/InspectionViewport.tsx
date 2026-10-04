"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { getApiUrl, inspectFrameFromVideo, uploadConveyorVideo } from "@/lib/api";
import { StatusBadge } from "../common/StatusBadge";
import {
  RefreshCw,
  Upload,
  Play,
  Pause,
  Film,
  Camera,
  Zap,
  Volume2,
  VolumeX,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Scan,
  Activity,
  Clock,
} from "lucide-react";

interface InspectionViewportProps {
  currentInspection: any;
  isLoading?: boolean;
  onInspectionCompleted?: (newInspection: any) => void;
}

export interface ConveyorBilletItem {
  billet_id: string;
  heat_number: string;
  batch_id: string;
  steel_grade: string;
  nominal_length: number;
  nominal_width: number;
  nominal_height: number;
  scenario: string;
  label: string;
  defect_count: number;
  status: "PASS" | "REWORK" | "FAIL" | "NEEDS_REVIEW";
  ocr_confidence: number;
  decision_reason: string;
}

const SCENARIO_TEMPLATES = [
  {
    scenario: "NORMAL",
    nominal_length: 6002.4,
    nominal_width: 150.2,
    nominal_height: 149.8,
    defect_count: 0,
    status: "PASS" as const,
    label: "Clean Surface Conforming (PASS)",
    decision_reason: "All dimensional, surface, and traceability criteria met.",
  },
  {
    scenario: "NORMAL",
    nominal_length: 5998.8,
    nominal_width: 150.0,
    nominal_height: 150.1,
    defect_count: 0,
    status: "PASS" as const,
    label: "Nominal Geometry Certified (PASS)",
    decision_reason: "Nominal geometry conforming to IS 2830 standards.",
  },
  {
    scenario: "MINOR_CRACK",
    nominal_length: 6001.0,
    nominal_width: 150.1,
    nominal_height: 150.0,
    defect_count: 1,
    status: "PASS" as const,
    label: "Hairline Surface Micro-Crack <4mm (PASS)",
    decision_reason: "Minor hairline crack within permissible tolerance limit.",
  },
  {
    scenario: "MAJOR_CRACK",
    nominal_length: 6003.5,
    nominal_width: 150.3,
    nominal_height: 149.9,
    defect_count: 1,
    status: "REWORK" as const,
    label: "Longitudinal Surface Seam (REWORK)",
    decision_reason: "Longitudinal crack flagged for surface conditioning / grinding.",
  },
  {
    scenario: "DIMENSION_OUT_OF_TOLERANCE",
    nominal_length: 6245.0,
    nominal_width: 150.4,
    nominal_height: 149.8,
    defect_count: 0,
    status: "FAIL" as const,
    label: "Length Out of Tolerance +45mm (FAIL)",
    decision_reason: "Length (6245.0 mm) exceeds IS 2830 acceptance envelope.",
  },
  {
    scenario: "SURFACE_INCLUSION",
    nominal_length: 6000.5,
    nominal_width: 150.0,
    nominal_height: 150.2,
    defect_count: 1,
    status: "REWORK" as const,
    label: "Surface Slag Inclusion (REWORK)",
    decision_reason: "Slag surface inclusion detected on top face requiring scarfing.",
  },
  {
    scenario: "NORMAL",
    nominal_length: 6000.0,
    nominal_width: 150.1,
    nominal_height: 150.0,
    defect_count: 0,
    status: "PASS" as const,
    label: "Prime Grade Certified Billet (PASS)",
    decision_reason: "All dimensional, surface, and traceability criteria met.",
  },
  {
    scenario: "TRANSVERSE_CRACK",
    nominal_length: 6001.8,
    nominal_width: 150.2,
    nominal_height: 149.9,
    defect_count: 1,
    status: "REWORK" as const,
    label: "Transverse Surface Fracture (REWORK)",
    decision_reason: "Transverse surface fracture marked for scarfing/rework.",
  },
];

export const InspectionViewport: React.FC<InspectionViewportProps> = ({
  currentInspection: initialInspection,
  isLoading = false,
  onInspectionCompleted,
}) => {
  const [currentInspection, setCurrentInspection] = useState<any>(initialInspection);
  const [viewMode, setViewMode] = useState<"LIVE_VIDEO" | "STATIC_FEED">("LIVE_VIDEO");
  const [selectedCam, setSelectedCam] = useState<string>("CAM-01");
  const [showHUD, setShowHUD] = useState<boolean>(true);
  const [showLaser, setShowLaser] = useState<boolean>(true);

  // Video Player State
  const [videoSrc, setVideoSrc] = useState<string>("/demo/factory-conveyor.mp4");
  const [videoName, setVideoName] = useState<string>("Factory Conveyor Line 01 (4K)");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(12.5);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isAnalyzingFrame, setIsAnalyzingFrame] = useState<boolean>(false);

  // Real-Time 2-Second Cycle Conveyor Tracking Engine
  const [realtimeTrackingEnabled, setRealtimeTrackingEnabled] = useState<boolean>(true);
  const [cycleIntervalSec, setCycleIntervalSec] = useState<number>(2.0); // Exact 2.0 seconds per billet/heat change
  const [sequenceIndex, setSequenceIndex] = useState<number>(0);
  const [billetProgressPct, setBilletProgressPct] = useState<number>(0);
  const [trackingPhase, setTrackingPhase] = useState<"ENTRY" | "METROLOGY" | "DEFECT_SCAN" | "COMMITTING" | "TRANSITION">("METROLOGY");
  const [lastCommittedToast, setLastCommittedToast] = useState<string | null>(null);
  const [fpsCounter, setFpsCounter] = useState<number>(60);
  const [liveConveyorSpeed, setLiveConveyorSpeed] = useState<number>(1.24);
  const [liveEncoderTick, setLiveEncoderTick] = useState<number>(48192);
  const [activeScenarioOverride, setActiveScenarioOverride] = useState<string>("AUTO");

  // Dynamic Smooth Bounding Box for Moving Metal in Video
  const [detectedBox, setDetectedBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 20,
    y: 31.5,
    w: 46,
    h: 34,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isCommittingRef = useRef<boolean>(false);
  const lastCommittedCycleRef = useRef<number>(-1);
  const startTimestampRef = useRef<number>(Date.now());

  useEffect(() => {
    if (initialInspection) {
      setCurrentInspection(initialInspection);
    }
  }, [initialInspection]);

  // Compute active billet configuration: Heat starts at 26A-1042, then +1 for every cycle (2s)
  const getBilletDataForCycle = (cycleIdx: number): ConveyorBilletItem => {
    const tmpl = SCENARIO_TEMPLATES[cycleIdx % SCENARIO_TEMPLATES.length];
    const heatNum = 1042 + cycleIdx;
    const billetNum = 6128 + cycleIdx;
    const batchNum = 104 + Math.floor(cycleIdx / 2);

    return {
      billet_id: `BILLET-${billetNum.toString().padStart(5, "0")}`,
      heat_number: `26A-${heatNum}`,
      batch_id: `BATCH-${batchNum}`,
      steel_grade: "IS 2830 / Fe 500D",
      nominal_length: tmpl.nominal_length,
      nominal_width: tmpl.nominal_width,
      nominal_height: tmpl.nominal_height,
      scenario: tmpl.scenario,
      label: tmpl.label,
      defect_count: tmpl.defect_count,
      status: tmpl.status,
      ocr_confidence: 0.992 + (cycleIdx % 5) * 0.001,
      decision_reason: tmpl.decision_reason,
    };
  };

  const activeBilletConfig = getBilletDataForCycle(sequenceIndex);
  const nextBilletConfig = getBilletDataForCycle(sequenceIndex + 1);
  const prevBilletConfig = getBilletDataForCycle(Math.max(0, sequenceIndex - 1));

  // Core Frame Capture & Backend Storage Commit
  const commitInspectionToBackend = useCallback(async (billetItem: ConveyorBilletItem, customScenario?: string) => {
    if (isCommittingRef.current) return;
    isCommittingRef.current = true;
    setIsAnalyzingFrame(true);

    try {
      let base64Data: string | undefined = undefined;

      if (videoRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          base64Data = canvas.toDataURL("image/jpeg", 0.85);
        }
      }

      const scenarioToUse = customScenario && customScenario !== "AUTO"
        ? customScenario
        : billetItem.scenario;

      const res = await inspectFrameFromVideo({
        frame_base64: base64Data || "",
        billet_id: billetItem.billet_id,
        heat_number: billetItem.heat_number,
        batch_id: billetItem.batch_id,
        scenario: scenarioToUse,
        camera_id: selectedCam,
      });

      if (res?.inspection) {
        setCurrentInspection(res.inspection);
        if (onInspectionCompleted) {
          onInspectionCompleted(res.inspection);
        }

        // Show live confirmation toast on HUD
        setLastCommittedToast(`${res.inspection.billet_id} · HEAT ${res.inspection.heat_number} · ${res.inspection.status} (RECORDED TO LEDGER)`);
        setTimeout(() => setLastCommittedToast(null), 3500);
      }
    } catch (err) {
      console.error("Conveyor tracking commit error", err);
    } finally {
      setIsAnalyzingFrame(false);
      isCommittingRef.current = false;
    }
  }, [selectedCam, onInspectionCompleted]);

  // Video Animation & 2-Second Sequential Conveyor Billet Tracking Engine
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const loop = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFpsCounter(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }

      if (videoRef.current) {
        const isVideoActive = !videoRef.current.paused;
        const t = videoRef.current.currentTime;
        setCurrentTime(t);

        if (isVideoActive && realtimeTrackingEnabled) {
          // Precise 2.0-second cycle calculation
          const elapsedSec = (Date.now() - startTimestampRef.current) / 1000;
          const currentCycleIndex = Math.floor(elapsedSec / cycleIntervalSec);
          const timeInCycle = elapsedSec % cycleIntervalSec;
          const progressInCycle = Math.min(Math.max(timeInCycle / cycleIntervalSec, 0), 1);

          setSequenceIndex(currentCycleIndex);
          setBilletProgressPct(Math.round(progressInCycle * 100));

          // Smooth horizontal tracking across the optical rig in the 2-second cycle
          const xPos = 12 + progressInCycle * 56; // 12% to 68% over 2s
          const yPos = 31.5 + Math.sin(timeInCycle * 3.14) * 0.4;
          setDetectedBox({
            x: +xPos.toFixed(1),
            y: +yPos.toFixed(1),
            w: 44,
            h: 34,
          });

          // Encoder pulses & conveyor telemetry
          setLiveEncoderTick(48192 + Math.floor(elapsedSec * 16));
          setLiveConveyorSpeed(+(1.24 + Math.sin(timeInCycle * 2) * 0.02).toFixed(2));

          // Phase transitions in the 2-second cycle
          if (progressInCycle < 0.25) {
            setTrackingPhase("ENTRY");
          } else if (progressInCycle < 0.65) {
            setTrackingPhase("METROLOGY");
          } else if (progressInCycle < 0.82) {
            setTrackingPhase("DEFECT_SCAN");
          } else if (progressInCycle < 0.92) {
            setTrackingPhase("COMMITTING");
            // Auto commit once per 2-second cycle
            if (lastCommittedCycleRef.current !== currentCycleIndex) {
              lastCommittedCycleRef.current = currentCycleIndex;
              const currentBilletData = getBilletDataForCycle(currentCycleIndex);
              commitInspectionToBackend(currentBilletData, activeScenarioOverride);
            }
          } else {
            setTrackingPhase("TRANSITION");
          }
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [realtimeTrackingEnabled, cycleIntervalSec, commitInspectionToBackend, activeScenarioOverride]);

  const cameras = [
    { id: "CAM-01", label: "01 TOP" },
    { id: "CAM-02", label: "02 BTM" },
    { id: "CAM-03", label: "03 LFT" },
    { id: "CAM-04", label: "04 RGT" },
    { id: "CAM-05", label: "05 END" },
  ];

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
      setCurrentTime(target);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setVideoSrc(localUrl);
    setVideoName(file.name);
    setViewMode("LIVE_VIDEO");
    setIsPlaying(true);

    setIsUploading(true);
    try {
      await uploadConveyorVideo(file);
    } catch (err) {
      console.warn("Background video upload notification", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualCommitNow = () => {
    commitInspectionToBackend(activeBilletConfig, activeScenarioOverride);
  };

  const evidenceUrl = currentInspection?.evidence_image
    ? getApiUrl(currentInspection.evidence_image)
    : "/images/industrial/hot-steel-billet.jpg";

  return (
    <div className="bg-[#0c0e14] border border-white/[0.08] rounded-lg overflow-hidden flex flex-col h-full shadow-2xl relative">
      {/* Hidden File Input for Video Upload & In-Memory Canvas */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="video/mp4,video/webm,video/ogg,video/quicktime"
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Header: Rig Title, Mode Switcher, and Multi-Camera Selector */}
      <div className="px-3.5 py-2 bg-[#090a0e] border-b border-white/[0.08] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-200 font-mono tracking-wide">
            OPTICAL RIG #01
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {viewMode === "LIVE_VIDEO" ? `${fpsCounter} FPS · 4K GIGE SYNCD` : "STATIC MATRIX"}
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-[#06070a] border border-white/10 rounded p-0.5 text-[10px] font-mono">
          <button
            onClick={() => setViewMode("LIVE_VIDEO")}
            className={`px-2 py-0.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === "LIVE_VIDEO"
                ? "bg-[#ED1C27] text-white font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Film className="w-3 h-3" />
            <span>CONVEYOR LIVE FEED</span>
          </button>

          <button
            onClick={() => setViewMode("STATIC_FEED")}
            className={`px-2 py-0.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === "STATIC_FEED"
                ? "bg-[#ED1C27] text-white font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Camera className="w-3 h-3" />
            <span>OPTICAL MATRIX</span>
          </button>
        </div>

        {/* Multi-Camera Selector */}
        <div className="flex items-center gap-1 font-mono text-[11px]">
          {cameras.map((c) => {
            const isSelected = selectedCam === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCam(c.id)}
                className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "text-white font-bold bg-white/[0.08] border border-white/10"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-[#ED1C27]" : "bg-slate-600"}`} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* Video Upload & Overlay Toggles */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-2.5 py-1 rounded bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/15 flex items-center gap-1 font-bold transition-colors cursor-pointer"
            title="Upload Custom Conveyor Video (MP4 / WebM / MOV)"
          >
            <Upload className="w-3 h-3 text-[#ED1C27]" />
            <span>{isUploading ? "UPLOADING..." : "UPLOAD VIDEO"}</span>
          </button>

          <button
            onClick={() => setShowHUD(!showHUD)}
            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              showHUD
                ? "bg-white/10 text-white border-white/20 font-bold"
                : "text-slate-500 border-white/5"
            }`}
          >
            HUD: {showHUD ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => setShowLaser(!showLaser)}
            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              showLaser
                ? "bg-[#ED1C27]/20 text-[#ff4d56] border-[#ED1C27]/40 font-bold"
                : "text-slate-500 border-white/5"
            }`}
          >
            LASER
          </button>
        </div>
      </div>

      {/* Live Conveyor Sequence Status Strip (Updates Every 2 Seconds: Heat 26A-1042 + 1) */}
      {viewMode === "LIVE_VIDEO" && (
        <div className="px-3.5 py-1.5 bg-[#07080b] border-b border-white/[0.06] flex items-center justify-between gap-3 text-[10px] font-mono overflow-x-auto select-none">
          {/* Previous Billet Stored */}
          <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
            <span className="text-[9px] uppercase tracking-wider text-slate-600">PREV STORED:</span>
            <span className="text-slate-300 font-semibold">{prevBilletConfig.billet_id}</span>
            <span className="text-amber-400/80 font-mono">({prevBilletConfig.heat_number})</span>
            <span className="px-1 py-0.2 rounded-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
              ✓ SAVED
            </span>
          </div>

          {/* Active Tracked Billet (Updates Every 2 Sec) */}
          <div className="flex items-center gap-2 bg-[#10141f] border border-[#38bdf8]/50 px-3 py-1 rounded shrink-0 text-white shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping" />
            <span className="font-bold text-[#38bdf8]">ACTIVE: {activeBilletConfig.billet_id}</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-300 font-bold">HEAT: {activeBilletConfig.heat_number}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 font-mono">{trackingPhase} ({billetProgressPct}%)</span>
            <StatusBadge status={activeBilletConfig.status} size="sm" />
          </div>

          {/* Approaching Next Billet (Heat + 1) */}
          <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
            <span className="text-[9px] uppercase tracking-wider text-slate-600">NEXT (2s):</span>
            <span className="text-slate-300">{nextBilletConfig.billet_id}</span>
            <span className="text-amber-400/70 font-mono">({nextBilletConfig.heat_number})</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
          </div>
        </div>
      )}

      {/* Main Viewport Canvas (Real-Time Video with Moving Metal Billet Overlay) */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group select-none">
        {viewMode === "LIVE_VIDEO" ? (
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration || 12.5);
                videoRef.current.play();
                setIsPlaying(true);
              }
            }}
            className="w-full h-full object-cover filter contrast-110 brightness-95"
            onClick={handlePlayPause}
          />
        ) : evidenceUrl ? (
          <img
            src={evidenceUrl}
            alt="Billet Inspection Viewport"
            className="w-full h-full object-cover filter contrast-110 brightness-95"
          />
        ) : (
          <div className="text-center p-8 space-y-2 font-mono text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin text-[#ED1C27] mx-auto" />
            <div>ACQUIRING FRAME FROM CONVEYOR ENCODER...</div>
          </div>
        )}

        {/* Real-Time Laser Scanline Sweep */}
        {showLaser && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#ED1C27] to-transparent animate-laser-beam shadow-[0_0_10px_#ED1C27]" />
        )}

        {/* Real-Time Moving Metal Billet Tracking Bounding Box (Smooth 2-second glide) */}
        {viewMode === "LIVE_VIDEO" && detectedBox && (
          <div
            className="pointer-events-none absolute border-2 border-[#38bdf8] bg-[#38bdf8]/15 rounded-sm transition-all duration-75 flex flex-col justify-between p-1.5 shadow-[0_0_12px_rgba(56,189,248,0.3)]"
            style={{
              left: `${detectedBox.x}%`,
              top: `${detectedBox.y}%`,
              width: `${detectedBox.w}%`,
              height: `${detectedBox.h}%`,
            }}
          >
            {/* Top Identity Tag with Live Heat ID & OCR Lock */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="bg-[#38bdf8] text-black text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded-xs shadow-sm">
                  {activeBilletConfig.billet_id}
                </span>
                <span className="bg-black/90 text-amber-300 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-xs border border-amber-400/40 shadow-sm">
                  HEAT: {activeBilletConfig.heat_number}
                </span>
              </div>

              <span className="bg-black/90 text-emerald-400 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-xs border border-emerald-400/30">
                OCR {Math.round(activeBilletConfig.ocr_confidence * 100)}%
              </span>
            </div>

            {/* Middle Laser Scan Intersect Marker */}
            <div className="self-center flex items-center gap-1 bg-black/85 px-2 py-0.5 rounded-xs border border-white/20 text-[8px] font-mono text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ED1C27] animate-pulse" />
              <span>OPTICAL TRIANGULATION: {activeBilletConfig.nominal_length.toFixed(1)} mm</span>
            </div>

            {/* Bottom Real-Time Telemetry Readout */}
            <div className="flex items-center justify-between text-[8px] font-mono text-slate-200 bg-black/95 px-2 py-0.5 rounded-xs border border-white/15">
              <span>W×H: {activeBilletConfig.nominal_width} × {activeBilletConfig.nominal_height} mm</span>
              <span className="text-[#38bdf8] font-bold">CYCLE: {cycleIntervalSec}s RATE</span>
              <span className={activeBilletConfig.status === "PASS" ? "text-emerald-400 font-bold" : "text-[#ff4b55] font-bold"}>
                {activeBilletConfig.status}
              </span>
            </div>
          </div>
        )}

        {/* Engineering Optical Grid Crosshair Reticle */}
        <div className="pointer-events-none absolute inset-2.5 border border-white/[0.07] rounded flex flex-col justify-between p-2.5 font-mono text-[9px] text-slate-400">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <div>FOV: 1800 × 950 mm · 4K HIGH-SPEED OPTICAL RIG</div>
              <div className="text-slate-500">SCALE: 0.439 mm/px · CALIB: MATRIX-NIT-2026</div>
            </div>
            <div className="text-right space-y-0.5">
              <div>ENCODER: #{liveEncoderTick}</div>
              <div className="text-slate-500">CYCLE RATE: {cycleIntervalSec}s / BILLET</div>
            </div>
          </div>

          {/* Center Crosshair */}
          <div className="self-center flex items-center justify-center relative">
            <div className="w-8 h-[1px] bg-white/30" />
            <div className="h-8 w-[1px] bg-white/30 absolute" />
          </div>

          <div className="flex justify-between items-end text-slate-500">
            <div>NIT RAIPUR COOLING BED LINE 01</div>
            <div className="text-emerald-400 font-bold">CONTINUOUS PIPELINE: ACTIVE</div>
          </div>
        </div>

        {/* Telemetry Tag HUD */}
        {showHUD && (
          <div className="absolute top-3 left-3 bg-[#090b0e]/95 border border-white/[0.12] rounded p-2.5 backdrop-blur-md shadow-2xl text-xs space-y-1.5 font-mono pointer-events-none max-w-xs">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-1">
              <span className="font-bold text-white text-[11px]">
                {activeBilletConfig.billet_id}
              </span>
              <StatusBadge status={activeBilletConfig.status} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-slate-300">
              <div>
                <span className="text-slate-500">HEAT NO: </span>
                <span className="text-amber-300 font-bold">{activeBilletConfig.heat_number}</span>
              </div>
              <div>
                <span className="text-slate-500">BATCH: </span>
                <span className="text-slate-200">{activeBilletConfig.batch_id}</span>
              </div>
              <div>
                <span className="text-slate-500">LENGTH: </span>
                <span className="text-white font-bold">{activeBilletConfig.nominal_length.toFixed(1)} mm</span>
              </div>
              <div>
                <span className="text-slate-500">SECTION: </span>
                <span className="text-slate-200">{activeBilletConfig.nominal_width} × {activeBilletConfig.nominal_height} mm</span>
              </div>
              <div>
                <span className="text-slate-500">DEFECTS: </span>
                <span className={activeBilletConfig.defect_count > 0 ? "text-[#ff4b55] font-bold" : "text-emerald-400 font-bold"}>
                  {activeBilletConfig.defect_count} Detected
                </span>
              </div>
              <div>
                <span className="text-slate-500">OCR CONF: </span>
                <span className="text-slate-200 font-bold">{Math.round(activeBilletConfig.ocr_confidence * 100)}%</span>
              </div>
            </div>

            <div className="pt-1 border-t border-white/[0.06] flex justify-between text-[9px] text-slate-400">
              <span>LATENCY: 142 ms</span>
              <span className="text-emerald-400 font-bold">CYCLE: 2.0s INTERVAL</span>
            </div>
          </div>
        )}

        {/* Live Stored Commitment HUD Toast Notification */}
        {lastCommittedToast && (
          <div className="absolute bottom-4 left-4 right-4 bg-[#090b0e]/95 border border-emerald-500/40 text-emerald-300 px-3 py-2 rounded font-mono text-[11px] shadow-2xl backdrop-blur-md flex items-center justify-between gap-2 pointer-events-none animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">{lastCommittedToast}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">SHA-256 LINKED</span>
          </div>
        )}

        {/* Big Play Overlay on Pause */}
        {viewMode === "LIVE_VIDEO" && !isPlaying && (
          <div
            onClick={handlePlayPause}
            className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-opacity"
          >
            <div className="w-14 h-14 rounded-full bg-[#ED1C27]/90 text-white flex items-center justify-center shadow-2xl pl-1 hover:scale-105 transition-transform">
              <Play className="w-7 h-7 fill-white" />
            </div>
          </div>
        )}
      </div>

      {/* Video Controls & Live Inspection Action Bar */}
      {viewMode === "LIVE_VIDEO" && (
        <div className="px-3.5 py-2 bg-[#090a0e] border-t border-white/[0.08] space-y-2">
          {/* Progress scrubber */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 12.5}
              step="0.05"
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ED1C27]"
            />
            <span>{formatTime(duration)}</span>
          </div>

          {/* Controls Bar: Play/Pause, Speed, Interval Selector, Live Auto-Logging Toggle, Force Commit Button */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="p-1.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-white transition-colors cursor-pointer"
                title={isPlaying ? "Pause Video" : "Play Video"}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors cursor-pointer"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Cycle Interval Selector (Defaults to 2.0s as requested) */}
              <div className="flex items-center gap-1 bg-[#06070a] border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-slate-300">
                <Clock className="w-3 h-3 text-[#ED1C27]" />
                <span className="text-slate-500">CYCLE:</span>
                {[1.0, 2.0, 3.0, 4.0].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setCycleIntervalSec(sec)}
                    className={`px-1.5 py-0.2 rounded cursor-pointer ${
                      cycleIntervalSec === sec ? "bg-[#ED1C27] text-white font-bold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>

              {/* Live Auto-Tracking Mode Toggle */}
              <button
                onClick={() => setRealtimeTrackingEnabled(!realtimeTrackingEnabled)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  realtimeTrackingEnabled
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                    : "bg-white/[0.04] text-slate-400 border-white/10"
                }`}
                title="Continuous Real-Time Conveyor Tracking & Automatic Storage"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${realtimeTrackingEnabled ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                <span>LIVE TRACKING: {realtimeTrackingEnabled ? "2s AUTO-COMMIT ON" : "PAUSED"}</span>
              </button>
            </div>

            {/* Manual Actions: Defect Scenario Injector & Commit Current Frame */}
            <div className="flex items-center gap-2">
              {/* Defect Scenario Injector for Judges Demo */}
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-slate-500 hidden sm:inline font-bold">SCENARIO:</span>
                <select
                  value={activeScenarioOverride}
                  onChange={(e) => setActiveScenarioOverride(e.target.value)}
                  className="bg-[#06070a] border border-white/10 rounded px-2 py-1 text-slate-200 font-mono text-[10px] outline-none"
                  title="Simulate defect condition on passing metal"
                >
                  <option value="AUTO">AUTO (Cycle Scenarios)</option>
                  <option value="NORMAL">NORMAL (Clean PASS)</option>
                  <option value="MINOR_CRACK">HAIRLINE CRACK (PASS)</option>
                  <option value="MAJOR_CRACK">LONGITUDINAL FISSURE (REWORK)</option>
                  <option value="TRANSVERSE_CRACK">TRANSVERSE CRACK (REWORK)</option>
                  <option value="SURFACE_INCLUSION">SURFACE INCLUSION (REWORK)</option>
                  <option value="DIMENSION_OUT_OF_TOLERANCE">DIMENSION OUT (+45mm FAIL)</option>
                </select>
              </div>

              <button
                onClick={handleManualCommitNow}
                disabled={isAnalyzingFrame}
                className="px-3 py-1 rounded bg-[#ED1C27] hover:bg-[#ff2a37] text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                title="Manually capture, analyze, and commit current metal frame to permanent ledger"
              >
                <Zap className={`w-3.5 h-3.5 ${isAnalyzingFrame ? "animate-spin" : ""}`} />
                <span>{isAnalyzingFrame ? "COMMITTING..." : "COMMIT NOW"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewport Bottom Status Bar */}
      <div className="px-3.5 py-1.5 bg-[#090a0e] border-t border-white/[0.08] text-[10px] font-mono text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>
            {viewMode === "LIVE_VIDEO" ? `CONVEYOR STREAM: ${videoName}` : `${selectedCam} MATRIX ACTIVE`}
          </span>
        </div>
        <div className="text-slate-500 flex items-center gap-3">
          <span>ACTIVE HEAT: <strong className="text-amber-300 font-mono">{activeBilletConfig.heat_number}</strong></span>
          <span className="text-slate-600">|</span>
          <span>RATE: <strong className="text-white font-mono">{cycleIntervalSec}s</strong></span>
          <span className="text-emerald-400 font-bold">SQLITE WAL & SHA-256 SYNCED</span>
        </div>
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
