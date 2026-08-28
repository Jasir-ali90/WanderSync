/** Rotating "text selection" word for the landing hero — a highlight sweeps
 * across each word like a real text selection, then the next word appears.
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const WORDS = ["Itinerary", "Adventure", "Reality", "Journey"];

export function SelectWord() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % WORDS.length), 2600);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  if (reduceMotion) return <span className="text-blue-600">{WORDS[0]}</span>;

  return (
    <span className="relative inline-block align-baseline">
      <AnimatePresence mode="wait">
        <motion.span
          key={WORDS[index]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="relative inline-block text-blue-600"
        >
          {/* selection sweep — like a real text selection being drawn */}
          <motion.span
            aria-hidden
            className="absolute inset-0 -inset-x-1 rounded-sm bg-blue-600/15"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: [0, 1, 1, 0], originX: 0 }}
            transition={{ duration: 2.6, ease: "easeInOut", times: [0, 0.18, 0.82, 1] }}
          />
          <span className="relative">{WORDS[index]}</span>
        </motion.span>
      </AnimatePresence>
    </span>
  );
}