/** Futuristic VVIP 3D Holographic Welcome Overlay.
 * Greets visitors with an animated 3D AI Travel Avatar & glassmorphic dialog.
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, ArrowRight, X } from "lucide-react";

const GREETINGS = [
  "✨ Welcome to WanderSync VVIP Platform ✨",
  "🤖 I am your Generative AI Travel Companion",
  "📍 Real-Time Geo-Optimized Route Planning",
  "🌦️ Live Weather & Intelligent Packing Advice",
  "💰 Market-Calibrated Economy to Luxury Budgets",
  "🚀 Let's craft your next extraordinary journey!",
];

export function WelcomeOverlay({
  onDone,
  forceShow = false,
}: {
  onDone?: () => void;
  forceShow?: boolean;
}) {
  const [enabled, setEnabled] = useState(false);
  const [line, setLine] = useState(0);
  const [leaving, setLeaving] = useState(false);

  const dismiss = () => setLeaving(true);

  useEffect(() => {
    if (!forceShow && sessionStorage.getItem("ws-welcomed-done")) {
      onDone?.();
      return;
    }
    if (!forceShow) {
      sessionStorage.setItem("ws-welcomed-done", "1");
    }
    setEnabled(true);
    document.body.style.overflow = "hidden";
    const talk = setInterval(() => setLine((l) => (l + 1) % GREETINGS.length), 2200);
    const leave = setTimeout(dismiss, 12000);
    return () => {
      clearInterval(talk);
      clearTimeout(leave);
      document.body.style.overflow = "";
    };
  }, [forceShow]);

  useEffect(() => {
    if (!leaving) return;
    document.body.style.overflow = "";
    const t = setTimeout(() => onDone?.(), 500);
    return () => clearTimeout(t);
  }, [leaving, onDone]);

  return (
    <AnimatePresence>
      {enabled && !leaving && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: leaving ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          aria-label="Welcome greeting"
        >
          {/* Deep dark veil with blur */}
          <div className="absolute inset-0 bg-ink-950/85 backdrop-blur-2xl" onClick={dismiss} />

          <motion.div
            initial={{ scale: 0.82, y: 50, rotateX: -20 }}
            animate={{ scale: 1, y: 0, rotateX: 0 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="relative flex flex-col items-center px-6 py-8 max-w-lg w-full rounded-3xl border border-brand-500/40 bg-gradient-to-b from-ink-900/95 via-ink-950/98 to-ink-900/95 shadow-[0_0_80px_rgba(134,59,255,0.35)] backdrop-blur-3xl [perspective:1000px] overflow-hidden"
          >
            {/* Close X button top right */}
            <button
              type="button"
              onClick={dismiss}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
            >
              <X className="size-5" />
            </button>

            {/* Ambient holographic glows */}
            <div className="absolute -top-20 size-56 rounded-full bg-gradient-to-r from-brand-500/30 via-cyan-500/20 to-purple-500/30 blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-20 size-56 rounded-full bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-brand-500/30 blur-3xl pointer-events-none" />

            {/* VVIP Badge Header */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/40 bg-brand-500/10 px-3.5 py-1 text-xs font-bold text-brand-300 shadow-inner mb-4">
              <Sparkles className="size-3.5 text-brand-400 animate-spin" />
              <span>WANDERYSNC VVIP AI ENGINE</span>
            </div>

            {/* Speech bubble */}
            <div className="w-full rounded-2xl border border-brand-400/30 bg-ink-900/90 p-4 text-center shadow-xl shadow-brand-500/10 backdrop-blur-md relative">
              <AnimatePresence mode="wait">
                <motion.p
                  key={line}
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-50 via-brand-200 to-brand-400"
                >
                  {GREETINGS[line]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* 3D Holographic AI Avatar & Cartoon Buddy */}
            <div className="my-5 relative size-44 flex items-center justify-center [perspective:1000px]">
              {/* Outer Orbiting Glowing Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-brand-400/50 shadow-[0_0_30px_rgba(134,59,255,0.4)]"
              />

              {/* Inner Reverse Rotating Ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 rounded-full border border-cyan-400/40 shadow-[0_0_20px_rgba(0,242,254,0.3)]"
              />

              {/* Cartoon Travel Buddy Face with float */}
              <motion.div
                animate={{ y: [-6, 6, -6], rotateY: [-6, 6, -6] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="drop-shadow-[0_15px_30px_rgba(134,59,255,0.6)] z-10 scale-90"
              >
                <BuddyFace />
              </motion.div>
            </div>

            <p className="text-center text-xs leading-relaxed text-slate-300 max-w-md">
              Generative trip planning with intelligent day routing, spot suggestions, weather insights, and budget tracking.
            </p>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={dismiss}
                className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 via-brand-400 to-cyan-400 px-8 py-3.5 text-sm font-extrabold text-ink-950 shadow-2xl shadow-brand-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <span>Launch Experience</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** CSS/SVG cartoon explorer waving hello. */
function BuddyFace() {
  return (
    <svg width="150" height="180" viewBox="0 0 150 180" role="img" aria-label="WanderSync travel buddy">
      <ellipse cx="75" cy="155" rx="42" ry="24" fill="#2a2344" />
      <rect x="47" y="100" width="56" height="58" rx="24" fill="#6d28d9" />
      <rect x="52" y="108" width="8" height="38" rx="4" fill="#4c1d95" />
      <rect x="90" y="108" width="8" height="38" rx="4" fill="#4c1d95" />
      <g transform-origin="118 110">
        <motion.rect
          x="108" y="94" width="34" height="12" rx="6" fill="#f2b48c"
          animate={{ rotate: [-20, 25, -20] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          style={{ originX: "108px", originY: "105px" }}
        />
      </g>
      <rect x="8" y="108" width="30" height="11" rx="5.5" fill="#f2b48c" />
      <rect x="69" y="88" width="12" height="16" fill="#f2b48c" />
      <circle cx="75" cy="58" r="33" fill="#f8c79b" />
      <path d="M42 51 Q46 18 75 18 Q106 18 108 52 Q104 40 96 38 Q78 32 60 40 Q48 44 42 51Z" fill="#2e2140" />
      <circle cx="63" cy="56" r="4.5" fill="#1a1430">
        <animate attributeName="ry" values="4.5;4.5;0.6;4.5" dur="3.4s" repeatCount="indefinite" />
      </circle>
      <circle cx="88" cy="56" r="4.5" fill="#1a1430" />
      <path d="M63 70 Q75 80 88 69" stroke="#8a4a2a" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="75" cy="22" r="6" fill="#d4af5e" />
    </svg>
  );
}
