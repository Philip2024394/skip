import React from "react";

// ── Mini bar-chart component ─────────────────────────────────────────────────
const BarChart = ({ data, color = "hsl(320,50%,50%)" }: { data: { label: string; value: number }[]; color?: string }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <span className="text-[8px] text-white/40 font-medium">{d.value > 0 ? (typeof d.value === "number" && d.value < 10 ? d.value : d.value > 999 ? `${(d.value / 1000).toFixed(1)}k` : d.value) : ""}</span>
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{ height: `${Math.max((d.value / max) * 52, d.value > 0 ? 4 : 0)}px`, background: color }}
          />
          <span className="text-[8px] text-white/40 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

export default BarChart;
