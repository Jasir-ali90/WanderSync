import { useReducedMotion, motion } from "framer-motion";
import { Background3DCanvas } from "./Background3DCanvas";

export function Background3D() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden select-none">
      {/* 3D Moving Canvas Particles */}
      <Background3DCanvas />

      {/* Subtle Base Dark Layer */}
      <div className="absolute inset-0 bg-ink-950/95" />

      {/* Subtle Warm Ambiance Light Orbs (Soft, not neon) */}
      <motion.div
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 left-1/4 size-[28rem] rounded-full bg-sand-500/5 blur-[120px]"
      />

      <motion.div
        animate={{
          x: [0, -35, 25, 0],
          y: [0, 40, -25, 0],
          scale: [1, 1.08, 0.92, 1],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 -right-24 size-[26rem] rounded-full bg-brand-600/5 blur-[120px]"
      />

      <motion.div
        animate={{
          x: [0, 30, -30, 0],
          y: [0, -20, 30, 0],
          scale: [1, 1.12, 0.9, 1],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-32 left-1/3 size-[30rem] rounded-full bg-sand-400/5 blur-[130px]"
      />
    </div>
  );
}
