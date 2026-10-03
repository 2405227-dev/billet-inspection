"use client";

import React, { useState } from "react";
import { DefectItem } from "@/lib/types";
import { SeverityBadge } from "../common/StatusBadge";
import { getApiUrl } from "@/lib/api";
import { Bug, ZoomIn, Eye, Sparkles, Layers } from "lucide-react";

interface DefectMapViewerProps {
  defects: DefectItem[];
  evidenceImageUrl?: string;
}

export const DefectMapViewer: React.FC<DefectMapViewerProps> = ({
  defects,
  evidenceImageUrl,
}) => {
  const [selectedDefect, setSelectedDefect] = useState<DefectItem | null>(
    defects && defects.length > 0 ? defects[0] : null
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
            Surface Defect & Fine-Crack Analysis ({defects?.length || 0})
          </h3>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Ensemble Seg v3.2.0 • Multi-scale CLAHE
        </div>
      </div>

      {(!defects || defects.length === 0) ? (
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-6 text-center text-slate-400 font-mono text-xs">
          ✓ NO SURFACE CRACKS, SEAMS, LAPS, OR FLAKING DEFECTS DETECTED
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Defect List Table */}
          <div className="lg:col-span-2 space-y-2 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                  <th className="py-2 px-2.5">ID</th>
                  <th className="py-2 px-2.5">Class</th>
                  <th className="py-2 px-2.5">Severity</th>
                  <th className="py-2 px-2.5">Confidence</th>
                  <th className="py-2 px-2.5">Length</th>
                  <th className="py-2 px-2.5">Width</th>
                  <th className="py-2 px-2.5">Area</th>
                  <th className="py-2 px-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {defects.map((d) => {
                  const isSelected = selectedDefect?.id === d.id;
                  return (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedDefect(d)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-cyan-950/50 text-cyan-200 border-l-2 border-cyan-400"
                          : "hover:bg-slate-800/40 text-slate-300"
                      }`}
                    >
                      <td className="py-2.5 px-2.5 font-bold text-slate-200">{d.id}</td>
                      <td className="py-2.5 px-2.5 capitalize font-sans">
                        {d.defect_type.replace(/_/g, " ")}
                      </td>
                      <td className="py-2.5 px-2.5">
                        <SeverityBadge severity={d.severity} />
                      </td>
                      <td className="py-2.5 px-2.5 font-bold text-slate-200">
                        {Math.round(d.confidence * 100)}%
                      </td>
                      <td className="py-2.5 px-2.5">{d.length_mm} mm</td>
                      <td className="py-2.5 px-2.5">{d.width_mm} mm</td>
                      <td className="py-2.5 px-2.5">{d.area_mm2} mm²</td>
                      <td className="py-2.5 px-2.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDefect(d);
                          }}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-sans"
                        >
                          Zoom Crop
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Zoomed Defect Evidence Crop Preview Pane */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-bold text-slate-300 font-mono">
                  {selectedDefect ? `${selectedDefect.id} HIGH-RES CROP` : "SELECT DEFECT"}
                </span>
                {selectedDefect && <SeverityBadge severity={selectedDefect.severity} />}
              </div>

              {selectedDefect?.crop_path ? (
                <div className="aspect-square bg-black rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center relative group">
                  <img
                    src={getApiUrl(selectedDefect.crop_path)}
                    alt={selectedDefect.defect_type}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/90 px-1.5 py-0.5 rounded text-[10px] font-mono text-cyan-300 border border-slate-700">
                    OPTICAL ×4 CROP
                  </div>
                </div>
              ) : (
                <div className="aspect-square bg-slate-900/40 rounded-lg border border-slate-800 flex items-center justify-center text-slate-500 font-mono text-xs text-center p-4">
                  Select a defect to inspect high-resolution sub-millimeter evidence
                </div>
              )}
            </div>

            {selectedDefect && (
              <div className="pt-3 mt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Class:</span>
                  <span className="text-slate-200 capitalize">
                    {selectedDefect.defect_type.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Dimensions:</span>
                  <span className="text-slate-200">
                    {selectedDefect.length_mm} × {selectedDefect.width_mm} mm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Surface Area:</span>
                  <span className="text-slate-200">{selectedDefect.area_mm2} mm²</span>
                </div>
                <div className="flex justify-between">
                  <span>Orientation:</span>
                  <span className="text-slate-200">{selectedDefect.orientation_deg || 0}°</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
