"use client";

import React from "react";
import { DimensionItem } from "@/lib/types";
import { Ruler, Check, X } from "lucide-react";

interface DimensionalTableProps {
  dimensions: DimensionItem[];
  length_mm: number;
  width_mm: number;
  height_mm: number;
  status: string;
}

export const DimensionalTable: React.FC<DimensionalTableProps> = ({
  dimensions,
  length_mm,
  width_mm,
  height_mm,
  status,
}) => {
  const items: DimensionItem[] = dimensions && dimensions.length > 0 ? dimensions : [
    {
      dimension_name: "Length (L)",
      measured_value_mm: length_mm || 6000,
      nominal_mm: 6000,
      expected_min_mm: 5800,
      expected_max_mm: 6200,
      deviation_pct: roundPct(((length_mm || 6000) - 6000) / 6000 * 100),
      status: (length_mm >= 5800 && length_mm <= 6200) ? "PASS" : "FAIL",
      camera_id: "CAM-01",
    },
    {
      dimension_name: "Width (W)",
      measured_value_mm: width_mm || 150,
      nominal_mm: 150,
      expected_min_mm: 147,
      expected_max_mm: 153,
      deviation_pct: roundPct(((width_mm || 150) - 150) / 150 * 100),
      status: (width_mm >= 147 && width_mm <= 153) ? "PASS" : "FAIL",
      camera_id: "CAM-01",
    },
    {
      dimension_name: "Height (H)",
      measured_value_mm: height_mm || 150,
      nominal_mm: 150,
      expected_min_mm: 147,
      expected_max_mm: 153,
      deviation_pct: roundPct(((height_mm || 150) - 150) / 150 * 100),
      status: (height_mm >= 147 && height_mm <= 153) ? "PASS" : "FAIL",
      camera_id: "CAM-01",
    },
  ];

  return (
    <div className="industrial-panel p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-[#ED1C27]" />
          <h3 className="font-semibold text-xs text-white uppercase tracking-wider font-mono">
            Calibrated Dimensional Metrology & Tolerances
          </h3>
        </div>
        <div className="text-[11px] font-mono text-white/50">
          Target Accuracy: <span className="text-emerald-400 font-semibold">&le; &plusmn;1.0%</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] text-white/40 font-mono text-[10px] uppercase tracking-wider">
              <th className="py-2.5 px-3">Parameter</th>
              <th className="py-2.5 px-3">Measured</th>
              <th className="py-2.5 px-3">Nominal</th>
              <th className="py-2.5 px-3">Tolerance Envelope</th>
              <th className="py-2.5 px-3">Deviation</th>
              <th className="py-2.5 px-3">Tolerance Bar</th>
              <th className="py-2.5 px-3 text-right">Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] font-mono">
            {items.map((dim, idx) => {
              const isPass = dim.status === "PASS";
              const devAbs = Math.abs(dim.deviation_pct);
              const barWidth = Math.min(devAbs * 40, 100);

              return (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3 font-sans font-medium text-white">
                    {dim.dimension_name}
                  </td>
                  <td className="py-3 px-3 text-white font-bold">
                    {dim.measured_value_mm} <span className="text-[10px] text-white/40 font-normal">mm</span>
                  </td>
                  <td className="py-3 px-3 text-white/50">
                    {dim.nominal_mm} mm
                  </td>
                  <td className="py-3 px-3 text-white/60">
                    [{dim.expected_min_mm} – {dim.expected_max_mm} mm]
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-semibold ${
                        isPass ? "text-white" : "text-[#ff4b55]"
                      }`}
                    >
                      {dim.deviation_pct > 0 ? `+${dim.deviation_pct}` : dim.deviation_pct}%
                    </span>
                  </td>
                  <td className="py-3 px-3 w-36">
                    <div className="w-full bg-black/80 rounded-full h-1.5 overflow-hidden border border-white/10 flex items-center">
                      <div
                        className={`h-full rounded-full ${
                          isPass ? "bg-emerald-400" : "bg-[#ED1C27]"
                        }`}
                        style={{ width: `${Math.max(barWidth, 8)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isPass
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-[#ED1C27]/10 text-[#ff4b55] border-[#ED1C27]/30"
                      }`}
                    >
                      {isPass ? <Check className="w-3 h-3" strokeWidth={3} /> : <X className="w-3 h-3" strokeWidth={3} />}
                      {dim.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function roundPct(val: number): number {
  return Math.round(val * 100) / 100;
}
