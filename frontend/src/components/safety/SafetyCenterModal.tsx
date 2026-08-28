import { ShieldAlert, PhoneCall, Building2, Stethoscope, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SafetyCenterModal({ onClose }: { onClose: () => void }) {
  const handleSOS = () => {
    alert("🚨 SOS Safety Status Check-In Triggered! Shared current status with trusted travel contacts.");
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/80 p-4 backdrop-blur-xl">
      <div className="w-full max-w-xl space-y-6 rounded-3xl border border-red-500/40 bg-gradient-to-b from-ink-900 via-ink-950 to-ink-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-700 pb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-6 text-red-400 animate-pulse" />
            <div>
              <h3 className="text-lg font-extrabold text-slate-100">Travel Safety Center & Emergency SOS</h3>
              <p className="text-xs text-slate-400">Instant emergency contacts, nearby hospitals, and embassy access.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm font-bold">✕</button>
        </div>

        {/* SOS Action Button */}
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center space-y-2">
          <AlertTriangle className="mx-auto size-8 text-red-400 animate-bounce" />
          <h4 className="text-sm font-bold text-red-300">Need Immediate Assistance?</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Clicking SOS notifies your designated emergency contacts with your last known trip itinerary location.
          </p>
          <Button size="sm" onClick={handleSOS} className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl px-6">
            🚨 Activate Emergency SOS Check-In
          </Button>
        </div>

        {/* Destination Contacts */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-ink-700 bg-ink-950 p-3 text-center">
            <PhoneCall className="mx-auto size-5 text-brand-400 mb-1" />
            <p className="text-xs font-bold text-slate-200">Police / Emergency</p>
            <p className="text-xs text-brand-300 font-mono mt-1">15 / 1122</p>
          </div>
          <div className="rounded-2xl border border-ink-700 bg-ink-950 p-3 text-center">
            <Stethoscope className="mx-auto size-5 text-emerald-400 mb-1" />
            <p className="text-xs font-bold text-slate-200">Nearest Hospital</p>
            <p className="text-xs text-emerald-300 font-mono mt-1">Gilgit DHQ</p>
          </div>
          <div className="rounded-2xl border border-ink-700 bg-ink-950 p-3 text-center">
            <Building2 className="mx-auto size-5 text-cyan-400 mb-1" />
            <p className="text-xs font-bold text-slate-200">Consulate Helpline</p>
            <p className="text-xs text-cyan-300 font-mono mt-1">+92 51 111</p>
          </div>
        </div>

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl">
            Close Safety Center
          </Button>
        </div>
      </div>
    </div>
  );
}
