import { useState } from "react";
import { Luggage, Check, Plus, CloudRain } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PackingItem {
  id: string;
  name: string;
  category: "Clothing" | "Essentials" | "Activities";
  packed: boolean;
}

export function SmartPackingPanel() {
  const [items, setItems] = useState<PackingItem[]>([
    { id: "1", name: "Heavy Winter Jacket", category: "Clothing", packed: true },
    { id: "2", name: "Waterproof Hiking Shoes", category: "Activities", packed: false },
    { id: "3", name: "Power Bank & Camera Charger", category: "Essentials", packed: true },
    { id: "4", name: "Thermal Gloves & Scarf", category: "Clothing", packed: false },
  ]);

  const [newItem, setNewItem] = useState("");

  const togglePacked = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, packed: !item.packed } : item))
    );
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem) return;
    setItems([
      ...items,
      { id: Date.now().toString(), name: newItem, category: "Essentials", packed: false },
    ]);
    setNewItem("");
  };

  const packedCount = items.filter((i) => i.packed).length;
  const progressPct = Math.round((packedCount / items.length) * 100);

  return (
    <div className="space-y-6 rounded-3xl border border-brand-500/30 bg-ink-900/90 p-6 backdrop-blur-2xl shadow-2xl">
      <div className="flex items-center justify-between border-b border-ink-700/60 pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-100">
            <Luggage className="size-5 text-brand-400" /> Weather-Aware AI Packing Assistant
          </h3>
          <p className="text-xs text-slate-400">Tailored checklist generated automatically based on destination weather & planned activities.</p>
        </div>
        <span className="text-xs font-bold text-brand-300">{packedCount}/{items.length} Packed ({progressPct}%)</span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full rounded-full bg-ink-950 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 transition-all duration-500" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Rain Alert Weather Tip */}
      <div className="flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-300 font-semibold">
        <CloudRain className="size-4 shrink-0 text-cyan-400 animate-pulse" />
        <span>🌧️ Smart Forecast Sync: Rain is expected on Day 2 in Hunza. Waterproof shoes & rain jacket have been auto-added.</span>
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => togglePacked(item.id)}
            className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
              item.packed
                ? "border-emerald-500/30 bg-emerald-500/10 text-slate-300 line-through"
                : "border-ink-700/60 bg-ink-950/80 text-slate-100 hover:border-brand-500/40"
            }`}
          >
            <span className="text-xs font-semibold">{item.name}</span>
            <div className={`grid size-6 place-items-center rounded-lg border ${item.packed ? "bg-emerald-500 border-emerald-500 text-ink-950" : "border-ink-600"}`}>
              {item.packed && <Check className="size-4 stroke-[3]" />}
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Item */}
      <form onSubmit={handleAddItem} className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add custom packing item..."
          className="h-10 flex-1 rounded-xl border border-ink-700 bg-ink-950 px-3 text-xs text-slate-100 focus:border-brand-500 focus:outline-none"
        />
        <Button size="sm" type="submit" className="rounded-xl">
          <Plus className="size-4 mr-1" /> Add Item
        </Button>
      </form>
    </div>
  );
}
