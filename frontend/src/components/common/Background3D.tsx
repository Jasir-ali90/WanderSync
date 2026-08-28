/** Global VVIP 3D Animated Background Component.
 * Features floating light orbs, subtle grid perspective, and particle dust.
 */
import { useReducedMotion, motion } from "framer-motion";
import { Background3DCanvas } from "./Background3DCanvas";

export function Background3D() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden select-none">
      {/* 3D Moving Canvas Particles & Constellation */}
      <Background3DCanvas />

      {/* Floating Glowing Aurora Orbs */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-[#0b0817] to-ink-950" />

      {/* Floating Glowing Aurora Orbs */}
      <motion.div
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.25, 0.9, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 left-1/4 size-[32rem] rounded-full bg-gradient-to-tr from-brand-600/20 via-indigo-500/15 to-transparent blur-[120px]"
      />

      <motion.div
        animate={{
          x: [0, -70, 50, 0],
          y: [0, 80, -50, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 -right-24 size-[28rem] rounded-full bg-gradient-to-br from-cyan-500/15 via-blue-600/15 to-transparent blur-[110px]"
      />

      <motion.div
        animate={{
          x: [0, 60, -60, 0],
          y: [0, -40, 60, 0],
          scale: [1, 1.3, 0.85, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-32 left-1/3 size-[36rem] rounded-full bg-gradient-to-tr from-amber-500/10 via-purple-600/15 to-brand-500/20 blur-[130px]"
      />

      {/* 3D Isometric Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #863bff 1px, transparent 1px),
            linear-gradient(to bottom, #863bff 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          transform: "perspective(800px) rotateX(45deg) scale(1.6)",
          transformOrigin: "top center",
        }}
      />
    </div>
  );
}
