import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LOADING_MESSAGES = [
  "Preparing your next adventure...",
  "Gathering current travel insights...",
  "Syncing dynamic weather forecasts...",
  "Curating personalized itineraries...",
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
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a101d]"
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute size-[28rem] rounded-full bg-blue-600/10 blur-[120px]" />

        {/* Brand logo — the same asset used for the favicon */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="relative grid size-32 place-items-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-blue-500/30"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            className="absolute inset-3 rounded-full border border-blue-400/15"
          />
          <img
            src="/favicon.svg"
            alt="WanderSync"
            width={76}
            height={76}
            className="drop-shadow-[0_12px_32px_rgba(59,130,246,0.45)]"
          />
        </motion.div>

        <div className="mt-8 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white">
            Wander<span className="text-blue-400">Sync</span>
          </h1>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            AI Travel Companion
          </p>
        </div>

        <div className="mt-6 w-64">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
              style={{ width: `${progress}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>
          <p className="mt-3 h-5 text-center text-xs text-slate-400">
            {LOADING_MESSAGES[msgIndex]}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
