import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

import { ChatMockup } from "@/components/landing/ChatMockup";
import { SelectWord } from "@/components/landing/SelectWord";
import { Button } from "@/components/ui/Button";

export function LandingHero() {
  const reduceMotion = useReducedMotion();
  const rise = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay },
        };

  return (
    <section className="bg-slate-50 relative overflow-hidden border-b border-slate-200 px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
      {/* Premium ambient gradient mesh behind the hero */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/4 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[110px]" />
        <div className="absolute right-0 top-10 h-56 w-96 rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-48 w-80 rounded-full bg-sky-500/10 blur-[90px]" />
      </div>
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 relative">
        <div>
          <motion.p
            {...(reduceMotion ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 } })}
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
          >
            Smart AI Travel Assistant
          </motion.p>
          <motion.h1
            {...rise(0.05)}
            className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
          >
            Your AI Travel Assistant.
            <span className="block">
              From Dream to <SelectWord />.
            </span>
          </motion.h1>
          <motion.p
            {...rise(0.15)}
            className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg"
          >
            Describe the trip you're dreaming of in plain language. WanderSync plans
            it day-by-day, optimizes every route and schedule, keeps your budget on
            track — and lets you refine anything with ease.
          </motion.p>
          <motion.div {...rise(0.25)} className="mt-8 flex flex-wrap gap-3">
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.15 }}>
              <Link to="/register">
                <Button size="lg">
                  Plan my trip free
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.15 }}>
              <Link to="/how-it-works">
                <Button size="lg" variant="secondary">
                  See how it works
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          <p className="mt-4 text-xs text-slate-500">
            No credit card required · Free trip generation
          </p>
        </div>

        <motion.div
          {...(reduceMotion
            ? {}
            : {
                initial: { opacity: 0, scale: 0.95 },
                animate: { opacity: 1, scale: 1 },
                transition: { duration: 0.6, delay: 0.2 },
              })}
        >
          <ChatMockup />
        </motion.div>
      </div>
    </section>
  );
}
