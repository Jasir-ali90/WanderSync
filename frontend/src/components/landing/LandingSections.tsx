import { motion, useReducedMotion } from "framer-motion";
import {
  Bot,
  CalendarRange,
  MapPinned,
  Route,
  Share2,
  Sparkles,
  Wallet,
} from "lucide-react";

import { Card, SectionTitle } from "@/components/ui/Card";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

const FEATURES = [
  {
    icon: Bot,
    title: "Conversational planning",
    text: "Describe your dream trip in plain language. WanderSync asks only what's missing and remembers every answer.",
  },
  {
    icon: Route,
    title: "Real optimization",
    text: "Days are routed geographically, schedules checked for impossible travel, pacing balanced.",
  },
  {
    icon: MapPinned,
    title: "Interactive itinerary",
    text: "Day tabs, timeline activities and a map that follows your plan — edit anything by hand or chat.",
  },
  {
    icon: Wallet,
    title: "Budget intelligence",
    text: "Per-day cost estimates with budget-fit scoring, clearly labelled as estimates — never fake prices.",
  },
  {
    icon: Sparkles,
    title: "Optimization Score",
    text: "A transparent 0–100 score across routing, pacing, budget fit and preference match — explained.",
  },
  {
    icon: Share2,
    title: "Export & share",
    text: "Branded PDF itineraries, calendar files and share links for travel companions.",
  },
];

const STEPS = [
  {
    title: "Tell WanderSync your dream",
    text: "“A 7-day cultural trip to Italy with a moderate budget — I love museums and local food.”",
  },
  {
    title: "Answer only what matters",
    text: "The planner asks just the missing pieces — dates, group size — and remembers everything you've said.",
  },
  {
    title: "Get an optimized itinerary",
    text: "Structured day-by-day plans with routes, times, costs and a transparent optimization score.",
  },
];

export function LandingSections() {
  const reduceMotion = useReducedMotion();
  const fadeUp = (delay = 0) =>
    reduceMotion
      ? {}
      : ({
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-80px" },
          transition: { duration: 0.5, delay },
        } as const);

  return (
    <>
      <section className="border-t border-ink-700/50 px-4 py-20 sm:px-6">
        <SectionTitle
          eyebrow="Features"
          title="Everything a great trip needs"
          subtitle="Not a chatbot bolted onto a form — a full planning engine with real optimization underneath."
        />
        <div className="mx-auto mt-12 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.div key={feature.title} {...fadeUp(index * 0.06)}>
              <Card className="h-full p-5 transition-colors hover:border-brand-500/40">
                <span className="grid size-9 place-items-center rounded-lg bg-brand-500/15 text-brand-400">
                  <feature.icon aria-hidden className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold text-slate-100">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{feature.text}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-t border-ink-700/50 bg-ink-900/40 px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="How it works" title="Three steps from dream to itinerary" />
        <ol className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <motion.li key={step.title} {...fadeUp(index * 0.08)}>
              <Card className="h-full p-5">
                <span className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-brand-500/30">
                  {index + 1}
                </span>
                <h3 className="mt-2 font-semibold text-slate-100">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{step.text}</p>
              </Card>
            </motion.li>
          ))}
        </ol>
        <div className="mt-10 flex justify-center">
          <Link to="/register">
            <Button size="lg">
              Start planning <ArrowRight aria-hidden className="size-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="border-t border-ink-700/50 px-4 py-14 sm:px-6">
        <dl className="mx-auto grid max-w-4xl grid-cols-1 gap-6 text-center sm:grid-cols-3">
          {[
            { icon: CalendarRange, label: "Day-perfect plans", value: "Up to 365-day range" },
            { icon: Route, label: "Routing-aware", value: "Geo-optimized days" },
            { icon: Wallet, label: "Honest numbers", value: "Labelled estimates only" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1.5">
              <item.icon aria-hidden className="size-6 text-brand-400" />
              <dd className="text-sm font-semibold text-slate-100">{item.value}</dd>
              <dt className="text-xs text-slate-500">{item.label}</dt>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
