import React from "react";
import { DimensionItem } from "@/lib/types";
import { Ruler, Check, X, AlertCircle } from "lucide-react";

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
  // If no items provided, generate standard 3-axis representation
  const items: DimensionItem[] = dimensions && dimensions.length > 0 ? dimensions : [
    {
      dimension_name: "Length",
      measured_value_mm: length_mm || 6000,
      nominal_mm: 6000,
      expected_min_mm: 5800,
      expected_max_mm: 6200,
      deviation_pct: roundPct(((length_mm || 6000) - 6000) / 6000 * 100),
      status: (length_mm >= 5800 && length_mm <= 6200) ? "PASS" : "FAIL",
      camera_id: "CAM-01",
    },
    {
      dimension_name: "Width",
      measured_value_mm: width_mm || 150,
      nominal_mm: 150,
      expected_min_mm: 147,
      expected_max_mm: 153,
      deviation_pct: roundPct(((width_mm || 150) - 150) / 150 * 100),
      status: (width_mm >= 147 && width_mm <= 153) ? "PASS" : "FAIL",
      camera_id: "CAM-01",
    },
    {
      dimension_name: "Height",
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
            Dimensional Metrology & Tolerances
          </h3>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Target Error: <span className="text-emerald-400 font-bold">&le; &plusmn;1.0%</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
              <th className="py-2.5 px-3">Parameter</th>
              <th className="py-2.5 px-3">Measured</th>
              <th className="py-2.5 px-3">Nominal</th>
              <th className="py-2.5 px-3">Allowed Tolerance</th>
              <th className="py-2.5 px-3">Deviation</th>
              <th className="py-2.5 px-3">Tolerance Compliance</th>
              <th className="py-2.5 px-3 text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {items.map((dim, idx) => {
              const isPass = dim.status === "PASS";
              const devAbs = Math.abs(dim.deviation_pct);
              const barWidth = Math.min(devAbs * 35, 100);

              return (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-sans font-bold text-slate-200">
                    {dim.dimension_name}
                  </td>
                  <td className="py-3 px-3 text-slate-100 font-bold text-sm">
                    {dim.measured_value_mm} <span className="text-[10px] text-slate-500 font-normal">mm</span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {dim.nominal_mm} mm
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    [{dim.expected_min_mm} – {dim.expected_max_mm} mm]
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-bold ${
                        isPass ? "text-slate-200" : "text-rose-400"
                      }`}
                    >
                      {dim.deviation_pct > 0 ? `+${dim.deviation_pct}` : dim.deviation_pct}%
                    </span>
                  </td>
                  <td className="py-3 px-3 w-40">
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 flex items-center">
                      <div
                        className={`h-full rounded-full ${
                          isPass ? "bg-cyan-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${Math.max(barWidth, 8)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${
                        isPass
                          ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                          : "bg-rose-950 text-rose-400 border-rose-800"
                      }`}
                    >
                      {isPass ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
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
