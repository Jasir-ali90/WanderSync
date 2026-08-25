import { Link } from "react-router-dom";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { ChatMockup } from "@/components/landing/ChatMockup";
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
    <section className="bg-radial-teal relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <motion.p
            {...(reduceMotion ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 } })}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300"
          >
            <Sparkles aria-hidden className="size-3.5" />
            AI-powered itinerary maestro
          </motion.p>
          <motion.h1
            {...rise(0.05)}
            className="mt-5 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-tight tracking-tight text-slate-50 sm:text-5xl lg:text-6xl"
          >
            Your AI Travel Companion.
            <span className="block bg-gradient-to-r from-brand-300 via-brand-400 to-sand-400 bg-clip-text text-transparent">
              From Dream to Itinerary.
            </span>
          </motion.h1>
          <motion.p
            {...rise(0.15)}
            className="mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg"
          >
            Describe the trip you're dreaming of in plain language. WanderSync plans
            it day-by-day, optimises every route and schedule, keeps your budget on
            track — and lets you refine anything with a sentence.
          </motion.p>
          <motion.div {...rise(0.25)} className="mt-8 flex flex-wrap gap-3">
            <Link to="/register">
              <Button size="lg">
                Plan my trip free <ArrowRight aria-hidden className="size-4" />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button size="lg" variant="secondary">
                See how it works
              </Button>
            </Link>
          </motion.div>
          <p className="mt-4 text-xs text-slate-500">
            No credit card. Django · MongoDB · OpenAI under the hood.
          </p>
        </div>

        <motion.div
          {...(reduceMotion
            ? {}
            : { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.6, delay: 0.2 } })}
          className="flex justify-center lg:justify-end"
        >
          <ChatMockup />
        </motion.div>
      </div>
    </section>
  );
}
