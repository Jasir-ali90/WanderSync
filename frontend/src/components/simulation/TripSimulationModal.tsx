import { useState } from "react";
import { RotateCcw, Sparkles, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SimulationStep {
  day: number;
  title: string;
  location: string;
  activity: string;
  image: string;
}

const STEPS: SimulationStep[] = [
  { day: 1, title: "Departure & Arrival", location: "Gilgit Airport → Hunza", activity: "Scenic drive along Karakoram highway", image: "photo-1506744038136-46273834b3fb" },
  { day: 2, title: "Historical Forts", location: "Karimabad", activity: "Explored Baltit & Altit Forts", image: "photo-1512453979798-5ea266f8880c" },
  { day: 3, title: "Turquoise Waters", location: "Attabad Lake", activity: "Boating & Jet Skiing", image: "photo-1542051841857-5f90071e7989" },
];

export function TripSimulationModal({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  const step = STEPS[currentStep];

  const handleNext = () => {
    setCurrentStep((prev) => (prev + 1) % STEPS.length);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/90 p-4 backdrop-blur-2xl">
      <div className="w-full max-w-2xl space-y-6 rounded-3xl border border-brand-500/40 bg-gradient-to-b from-ink-900 via-ink-950 to-ink-900 p-6 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-700/60 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-6 text-brand-400 animate-spin" />
            <div>
              <h3 className="text-lg font-extrabold text-slate-100">✨ Experience My Trip — Cinematic Simulation</h3>
              <p className="text-xs text-slate-400">Animated day-by-day travel preview with interactive timeline controls.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm font-bold">✕</button>
        </div>

        {/* Cinematic Card */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-brand-500/30 shadow-2xl">
          <img
            src={`https://images.unsplash.com/${step.image}?auto=format&fit=crop&w=1000&q=80`}
            alt={step.title}
            className="h-full w-full object-cover transition-all duration-700 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />

          {/* Overlay Day Info */}
          <div className="absolute bottom-4 left-4 right-4 space-y-1">
            <span className="inline-block rounded-full bg-brand-500/80 px-3 py-1 text-xs font-bold text-ink-950">
              DAY {step.day} PREVIEW
            </span>
            <h4 className="text-xl font-extrabold text-white">{step.title}</h4>
            <p className="text-xs text-brand-200 flex items-center gap-1">
              <MapPin className="size-3.5 text-brand-400" /> {step.location} — {step.activity}
            </p>
          </div>
        </div>

        {/* Timeline Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {STEPS.map((s, idx) => (
              <button
                key={s.day}
                onClick={() => setCurrentStep(idx)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  currentStep === idx
                    ? "bg-brand-500 text-ink-950 shadow-lg shadow-brand-500/30"
                    : "bg-ink-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Day {s.day}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={handleNext} className="rounded-xl">
              Next Day →
            </Button>
            <Button size="sm" onClick={() => setCurrentStep(0)} className="rounded-xl">
              <RotateCcw className="size-3.5 mr-1" /> Replay
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
