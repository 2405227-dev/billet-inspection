"use client";

import React, { useState } from "react";
import { DefectItem } from "@/lib/types";
import { SeverityBadge } from "../common/StatusBadge";
import { getApiUrl } from "@/lib/api";
import { Bug, ZoomIn, Eye, ScanLine } from "lucide-react";

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
    <div className="industrial-panel p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-[#ED1C27]" />
          <h3 className="font-semibold text-xs text-white uppercase tracking-wider font-mono">
            Surface Defect & Crack Segmentation ({defects?.length || 0})
          </h3>
        </div>
        <div className="text-[11px] font-mono text-white/40">
          Ensemble Seg v3.2 • CLAHE Overlap 256px
        </div>
      </div>

      {(!defects || defects.length === 0) ? (
        <div className="bg-black/40 border border-white/[0.06] rounded-lg p-6 text-center text-white/50 font-mono text-xs">
          ✓ NO SURFACE CRACKS, SEAMS, LAPS, OR SCAB DEFECTS DETECTED
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Defect List Table */}
          <div className="lg:col-span-2 space-y-2 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-white/40 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Conf</th>
                  <th className="py-2.5 px-3">Length</th>
                  <th className="py-2.5 px-3">Width</th>
                  <th className="py-2.5 px-3">Area</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-mono">
                {defects.map((d) => {
                  const isSelected = selectedDefect?.id === d.id;
                  return (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedDefect(d)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#ED1C27]/10 text-white border-l-2 border-[#ED1C27]"
                          : "hover:bg-white/[0.02] text-white/70"
                      }`}
                    >
                      <td className="py-3 px-3 font-semibold text-white">{d.id}</td>
                      <td className="py-3 px-3 capitalize font-sans text-white/90">
                        {d.defect_type.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 px-3">
                        <SeverityBadge severity={d.severity} />
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">
                        {Math.round(d.confidence * 100)}%
                      </td>
                      <td className="py-3 px-3 text-white/80">{d.length_mm} mm</td>
                      <td className="py-3 px-3 text-white/80">{d.width_mm} mm</td>
                      <td className="py-3 px-3 text-white/80">{d.area_mm2} mm²</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDefect(d);
                          }}
                          className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-[#ED1C27] hover:text-white text-white/80 text-[10px] font-mono transition-colors"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Zoomed Defect Evidence Crop Preview Pane */}
          <div className="bg-black/50 border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 mb-3">
                <span className="text-[11px] font-bold text-white font-mono">
                  {selectedDefect ? `${selectedDefect.id} OPTICAL CROP` : "SELECT DEFECT"}
                </span>
                {selectedDefect && <SeverityBadge severity={selectedDefect.severity} />}
              </div>

              {selectedDefect?.crop_path ? (
                <div className="aspect-square bg-black rounded-lg overflow-hidden border border-white/10 flex items-center justify-center relative group">
                  <img
                    src={getApiUrl(selectedDefect.crop_path)}
                    alt={selectedDefect.defect_type}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-mono text-[#ED1C27] font-bold border border-white/10">
                    OPTICAL 4× TILE
                  </div>
                </div>
              ) : (
                <div className="aspect-square bg-black/30 rounded-lg border border-white/[0.06] flex items-center justify-center text-white/40 font-mono text-xs text-center p-6">
                  Select a defect to inspect high-resolution sub-millimeter evidence
                </div>
              )}
            </div>

            {selectedDefect && (
              <div className="pt-3 mt-3 border-t border-white/[0.08] text-[11px] font-mono text-white/50 space-y-1.5">
                <div className="flex justify-between">
                  <span>Class:</span>
                  <span className="text-white font-sans capitalize">
                    {selectedDefect.defect_type.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Dimensions:</span>
                  <span className="text-white font-semibold">
                    {selectedDefect.length_mm} × {selectedDefect.width_mm} mm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Surface Area:</span>
                  <span className="text-white">{selectedDefect.area_mm2} mm²</span>
                </div>
                <div className="flex justify-between">
                  <span>Orientation:</span>
                  <span className="text-white">{selectedDefect.orientation_deg || 0}°</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
