import { useState } from "react";
import { Leaf } from "lucide-react";

export function CarbonTrackerWidget() {
  const [transport, setTransport] = useState<"flight" | "car" | "train">("flight");
  const [distanceKm, setDistanceKm] = useState(850);

  const factor = transport === "flight" ? 0.25 : transport === "car" ? 0.17 : 0.04;
  const totalCO2Kg = Math.round(distanceKm * factor);

  return (
    <div className="rounded-3xl border border-emerald-500/30 bg-ink-900/90 p-6 backdrop-blur-2xl shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-ink-700/60 pb-3">
        <div className="flex items-center gap-2">
          <Leaf className="size-5 text-emerald-400 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-100">Travel Carbon Footprint Estimator</h3>
        </div>
        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          Eco Impact: {totalCO2Kg < 100 ? "Low 🌱" : totalCO2Kg < 250 ? "Moderate ⚠️" : "High 🔴"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Transport Mode</label>
          <select
            value={transport}
            onChange={(e) => setTransport(e.target.value as any)}
            className="h-9 w-full rounded-xl border border-ink-700 bg-ink-950 px-2.5 text-xs text-slate-200"
          >
            <option value="flight">Flight (High Impact)</option>
            <option value="car">Personal Car (Medium)</option>
            <option value="train">Train / Electric (Eco-Friendly)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Distance (km)</label>
          <input
            type="number"
            value={distanceKm}
            onChange={(e) => setDistanceKm(Number(e.target.value))}
            className="h-9 w-full rounded-xl border border-ink-700 bg-ink-950 px-3 text-xs text-slate-100"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
        <p className="text-[10px] uppercase font-bold text-emerald-400">Estimated CO2 Emissions</p>
        <p className="text-xl font-extrabold text-emerald-300">{totalCO2Kg} kg CO2</p>
        <p className="text-[10px] text-slate-400 mt-1">💡 Choose shared or train transport to offset ~65% of emissions.</p>
      </div>
    </div>
  );
}
