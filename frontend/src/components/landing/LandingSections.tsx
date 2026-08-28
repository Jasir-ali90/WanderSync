import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bot,
  CloudSun,
  Compass,
  Heart,
  Globe2,
  MapPinned,
  Route,
  Sparkles,
  Wallet,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Card, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const SERVICES = [
  {
    icon: Bot,
    title: "AI Trip Planning",
    text: "Generates tailored multi-day itineraries based on your budget, travel style, and interests in seconds.",
    color: "from-purple-500/20 to-indigo-500/20 border-purple-500/30",
  },
  {
    icon: Globe2,
    title: "Smart Destinations",
    text: "Discover curated global spots, historic landmarks, and hidden local secrets with detailed insight.",
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  },
  {
    icon: CloudSun,
    title: "Weather Intelligence",
    text: "Real-time forecast integration providing activity recommendations matching live climate conditions.",
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
  },
  {
    icon: Wallet,
    title: "Market Budget Planning",
    text: "Transparent economy, standard, and luxury price estimates for lodging, dining, and transit.",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
  },
  {
    icon: MapPinned,
    title: "Interactive Map Itineraries",
    text: "Geographically ordered route mapping for every stop, avoiding useless travel detours.",
    color: "from-rose-500/20 to-pink-500/20 border-rose-500/30",
  },
  {
    icon: Compass,
    title: "Location Discovery",
    text: "Find locations instantly with automated geocoding and visual landmark maps for any stop.",
    color: "from-violet-500/20 to-fuchsia-500/20 border-violet-500/30",
  },
  {
    icon: Heart,
    title: "Personalized Recommendations",
    text: "Tailors every spot selection to your exact group size, preferences, pace, and mood.",
    color: "from-red-500/20 to-rose-500/20 border-red-500/30",
  },
  {
    icon: Sparkles,
    title: "24/7 AI Travel Companion",
    text: "Save, search, rename, and continue past planning conversations whenever inspiration strikes.",
    color: "from-amber-400/20 to-yellow-500/20 border-amber-400/30",
  },
];

const PERSONALIZED_CATEGORIES = [
  { name: "Trending", emoji: "🔥", desc: "Most sought-after destinations of 2026." },
  { name: "Hidden Gems", emoji: "💎", desc: "Untouched paradises away from crowded tourist lines." },
  { name: "Weekend Getaways", emoji: "⚡", desc: "Quick 2 to 3 day recharges near major hubs." },
  { name: "Luxury VVIP", emoji: "✨", desc: "5-star resorts, private transfers, and fine dining." },
  { name: "Budget Smart", emoji: "🏷️", desc: "Maximum experience at minimal cost per day." },
  { name: "Adventure Trails", emoji: "🏔️", desc: "Hiking, mountain passes, and adrenaline thrills." },
  { name: "Family Friendly", emoji: "👨‍👩‍👧", desc: "Safe, engaging, and easy-paced stops for all ages." },
  { name: "Solo Explorer", emoji: "🎒", desc: "Walkable, friendly, and safe solo-travel routes." },
  { name: "Romantic Escapes", emoji: "💖", desc: "Sunsets, cozy dinners, and scenic boutique stays." },
];

const SEVEN_STEPS = [
  { step: "01", title: "Select Destination & Dates", text: "Enter your dream city or let AI suggest a seasonal pick." },
  { step: "02", title: "Set Group & Budget Level", text: "Define travellers (solo, couple, family) and economy vs luxury budget." },
  { step: "03", title: "Specify Mood & Interests", text: "Choose relaxed, packed, cultural, culinary, or nature-focused vibes." },
  { step: "04", title: "AI Generation Engine", text: "WanderSync crafts a structured day-by-day sequence with cost breakdown." },
  { step: "05", title: "Interactive Route Mapping", text: "View stops plotted geographically with OpenStreetMap & Google Maps." },
  { step: "06", title: "Live Forecast & Tips", text: "Check real weather predictions, rain chances, and packing suggestions." },
  { step: "07", title: "Save, Share & Export", text: "Keep conversations saved, generate share links, or print PDF schedules." },
];

const WHY_CHOOSE = [
  { title: "No Generic AI Hallucinations", text: "Every spot is validated against real geocoded coordinates and real-world places." },
  { title: "Market-Calibrated Budgets", text: "Never get surprised by hidden costs — clear breakdown across accommodation, transit, and food." },
  { title: "Geo-Optimized Pacing", text: "Zero unnecessary backtracking. Activities follow natural geographic order." },
  { title: "Persistent Chat History", text: "Revisit and continue any AI conversation whenever you plan your next leg." },
  { title: "Integrated Live Weather", text: "Forecasts adapt your itinerary recommendations to sunny or rainy days automatically." },
  { title: "VVIP Privacy & Control", text: "Your data stays yours. Share trips via secure link or keep them private." },
];

export function LandingSections() {
  const reduceMotion = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState(0);

  const fadeUp = (delay = 0) =>
    reduceMotion
      ? {}
      : ({
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-60px" },
          transition: { duration: 0.5, delay },
        } as const);

  return (
    <>
      {/* Services Section */}
      <section className="border-t border-ink-700/50 px-4 py-20 sm:px-6">
        <SectionTitle
          eyebrow="Our VVIP Services"
          title="Designed for modern global travellers"
          subtitle="From instant conversational generation to live weather mapping and budget intelligence."
        />
        <div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service, index) => (
            <motion.div key={service.title} {...fadeUp(index * 0.05)}>
              <Card className={`h-full border bg-gradient-to-b ${service.color} p-5 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1.5`}>
                <span className="grid size-10 place-items-center rounded-xl bg-brand-500/20 text-brand-300 shadow-inner">
                  <service.icon aria-hidden className="size-5" />
                </span>
                <h3 className="mt-4 font-bold text-slate-100">{service.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">{service.text}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Personalized Recommendations Section */}
      <section className="border-t border-ink-700/50 bg-ink-900/40 px-4 py-20 sm:px-6">
        <SectionTitle
          eyebrow="Personalized Travel"
          title="Tailored to every travel style"
          subtitle="Whether you crave luxury recharges or budget hidden gems, WanderSync matches your exact vibe."
        />
        <div className="mx-auto mt-10 max-w-5xl">
          <div className="flex flex-wrap justify-center gap-2">
            {PERSONALIZED_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveCategory(idx)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                  activeCategory === idx
                    ? "bg-brand-500 text-ink-950 shadow-lg shadow-brand-500/25 scale-105"
                    : "bg-ink-800/80 text-slate-300 hover:bg-ink-700/80 border border-ink-700"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-8 rounded-2xl border border-brand-500/30 bg-gradient-to-r from-ink-900 via-ink-950 to-ink-900 p-8 text-center shadow-xl backdrop-blur-xl"
          >
            <span className="text-4xl">{PERSONALIZED_CATEGORIES[activeCategory].emoji}</span>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-100">
              {PERSONALIZED_CATEGORIES[activeCategory].name}
            </h3>
            <p className="mt-2 text-sm text-slate-300 max-w-xl mx-auto">
              {PERSONALIZED_CATEGORIES[activeCategory].desc}
            </p>
            <div className="mt-6 flex justify-center">
              <Link to="/planner">
                <Button size="sm">
                  Plan {PERSONALIZED_CATEGORIES[activeCategory].name} trip <ArrowRight aria-hidden className="size-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How WanderSync Works (7 Steps) */}
      <section className="border-t border-ink-700/50 px-4 py-20 sm:px-6">
        <SectionTitle
          eyebrow="Visual Journey"
          title="How WanderSync transforms your trip"
          subtitle="7 simple steps from an initial spark to a perfectly organized day-by-day schedule."
        />
        <div className="mx-auto mt-12 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SEVEN_STEPS.map((step, idx) => (
            <motion.div key={step.step} {...fadeUp(idx * 0.05)}>
              <Card className="relative h-full border border-ink-700/60 bg-ink-900/60 p-5 transition-colors hover:border-brand-400/50">
                <span className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-brand-400">
                  {step.step}
                </span>
                <h3 className="mt-2 font-bold text-slate-100">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{step.text}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Animated Statistics Counter Section */}
      <section className="border-t border-ink-700/50 bg-gradient-to-r from-brand-950/40 via-ink-950 to-brand-950/40 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-6 text-center lg:grid-cols-4">
            {[
              { label: "Trips Planned", value: "15,400+", icon: Route },
              { label: "Famous Spots Indexed", value: "1,200+", icon: Globe2 },
              { label: "AI Conversations Saved", value: "48,000+", icon: Bot },
              { label: "Satisfaction Rating", value: "99.4%", icon: TrendingUp },
            ].map((stat, idx) => (
              <motion.div key={stat.label} {...fadeUp(idx * 0.08)} className="flex flex-col items-center">
                <stat.icon className="size-6 text-brand-400 mb-2" />
                <span className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-extrabold text-slate-50">
                  {stat.value}
                </span>
                <span className="mt-1 text-xs text-slate-400 font-medium uppercase tracking-wider">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose WanderSync Section */}
      <section className="border-t border-ink-700/50 px-4 py-20 sm:px-6">
        <SectionTitle
          eyebrow="The WanderSync Difference"
          title="Why discerning travellers choose us"
          subtitle="Built from the ground up for precision, speed, and real-world travel accuracy."
        />
        <div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_CHOOSE.map((item, idx) => (
            <motion.div key={item.title} {...fadeUp(idx * 0.06)}>
              <Card className="h-full border border-ink-700/80 bg-ink-900/80 p-5 backdrop-blur-md hover:border-brand-500/50 transition-colors">
                <CheckCircle2 className="size-6 text-brand-400 mb-3" />
                <h3 className="font-bold text-slate-100">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.text}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="border-t border-ink-700/50 bg-radial-teal px-4 py-20 sm:px-6 text-center">
        <div className="mx-auto max-w-3xl rounded-3xl border border-brand-500/30 bg-gradient-to-b from-ink-900/90 to-ink-950/90 p-8 sm:p-12 shadow-2xl backdrop-blur-2xl">
          <Sparkles className="size-10 text-brand-300 mx-auto animate-pulse" />
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-extrabold text-slate-50">
            Your Next Destination Awaits.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Experience the VVIP AI travel platform that turns your travel dreams into intelligent, map-ready day-by-day itineraries.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="px-8 shadow-xl shadow-brand-500/25">
                Start Planning Free <ArrowRight aria-hidden className="size-4 ml-1" />
              </Button>
            </Link>
            <Link to="/spots">
              <Button size="lg" variant="secondary" className="px-8">
                Explore Famous Spots
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
