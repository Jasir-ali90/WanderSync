import { useEffect, useState } from "react";
import { Compass, Sparkles, Plane } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LOADING_MESSAGES = [
  "Preparing your next adventure...",
  "Gathering current market travel rates...",
  "Syncing dynamic weather forecasts...",
  "Curating personalized VVIP itineraries...",
];

export function WanderSyncPreloader({ onFinish }: { onFinish?: () => void }) {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setVisible(false);
            onFinish?.();
          }, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    const msgTimer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 700);

    return () => {
      clearInterval(timer);
      clearInterval(msgTimer);
    };
  }, [onFinish]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.5 } }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink-950 text-slate-100"
      >
        {/* Glowing background aura */}
        <div className="absolute size-96 rounded-full bg-brand-500/10 blur-[100px] pointer-events-none" />

        {/* 3D Orb / Globe ring container */}
        <div className="relative flex size-36 items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-brand-500/40"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 rounded-full border border-brand-400/20 shadow-[0_0_25px_rgba(212,175,94,0.2)]"
          />
          <motion.div
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="grid size-20 place-items-center rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 shadow-xl shadow-brand-500/20"
          >
            <Compass className="size-10 text-ink-950 animate-pulse" />
          </motion.div>

          {/* Floating plane orbit */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute size-40 pointer-events-none"
          >
            <Plane className="size-4 text-brand-300 transform -rotate-45" />
          </motion.div>
        </div>

        {/* Branding text */}
        <div className="mt-8 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-slate-50">
            Wander<span className="text-brand-400">Sync</span>
          </h1>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-brand-300 font-medium tracking-wide uppercase">
            <Sparkles className="size-3" /> VVIP AI Travel Ecosystem
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-6 w-64">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800 border border-ink-700">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-600 via-brand-400 to-amber-300"
              style={{ width: `${progress}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>
          <p className="mt-3 text-center text-xs text-slate-400 h-5">
            {LOADING_MESSAGES[msgIndex]}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
