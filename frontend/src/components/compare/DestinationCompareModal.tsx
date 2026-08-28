import { Scale, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DestinationCompareModalProps {
  onClose: () => void;
}

export function DestinationCompareModal({ onClose }: DestinationCompareModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/90 p-4 backdrop-blur-2xl">
      <div className="w-full max-w-3xl space-y-6 rounded-3xl border border-brand-500/40 bg-gradient-to-b from-ink-900 via-ink-950 to-ink-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-ink-700 pb-4">
          <div className="flex items-center gap-2">
            <Scale className="size-6 text-brand-400" />
            <div>
              <h3 className="text-lg font-extrabold text-slate-100">Smart Destination Comparison</h3>
              <p className="text-xs text-slate-400">Side-by-side budget, crowd levels, best seasons, and AI recommendations.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm font-bold">✕</button>
        </div>

        {/* Comparison Table Grid */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="space-y-3 font-bold text-slate-400 pt-8">
            <p>Est. 5-Day Budget</p>
            <p>Best Season</p>
            <p>Crowd Level</p>
            <p>Adventure Rating</p>
            <p>Family Friendly</p>
          </div>

          {/* Dest 1 */}
          <div className="rounded-2xl border border-brand-500/30 bg-ink-950 p-4 space-y-3 text-center">
            <h4 className="font-extrabold text-slate-100 text-sm">🇵🇰 Hunza Valley</h4>
            <p className="font-bold text-brand-300">$850</p>
            <p className="text-slate-300">Apr – Oct</p>
            <p className="text-emerald-400 font-semibold">Low / Moderate</p>
            <p className="text-brand-400 font-bold">9.5 / 10</p>
            <p className="text-emerald-400 font-bold">✓ High</p>
          </div>

          {/* Dest 2 */}
          <div className="rounded-2xl border border-cyan-500/30 bg-ink-950 p-4 space-y-3 text-center">
            <h4 className="font-extrabold text-slate-100 text-sm">🇦🇪 Dubai</h4>
            <p className="font-bold text-cyan-300">$2,100</p>
            <p className="text-slate-300">Nov – Mar</p>
            <p className="text-amber-400 font-semibold">High Crowd</p>
            <p className="text-cyan-400 font-bold">8.0 / 10</p>
            <p className="text-emerald-400 font-bold">✓ High</p>
          </div>
        </div>

        {/* AI Recommendation Banner */}
        <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4 flex items-center gap-3">
          <Sparkles className="size-6 text-brand-400 animate-spin shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-brand-300">🏆 AI Recommendation Verdict</p>
            <p className="text-slate-300 mt-0.5 leading-relaxed">
              Based on your budget preference ($1,000 limit) and mountain interest, <strong>Hunza Valley</strong> is your best match!
            </p>
          </div>
        </div>

        <div className="text-center">
          <Button size="sm" onClick={onClose} className="rounded-xl">
            Close Comparison
          </Button>
        </div>
      </div>
    </div>
  );
}
