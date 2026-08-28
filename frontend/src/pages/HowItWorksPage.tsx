import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Bot, CalendarCheck2, MapPinned, Share2, Sparkles, Wallet } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";

const JOURNEY = [
  {
    icon: Bot,
    step: "Converse",
    title: "Chat with the Generative AI Planner",
    text: "Describe your travel vision in plain language. WanderSync extracts your destination, travel dates, party size, and budget tier, then asks only essential clarifying questions.",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=700&q=80",
  },
  {
    icon: MapPinned,
    step: "Explore",
    title: "Interact with 3D Maps & Timeline",
    text: "View day-by-day activity timelines, interactive route mapping on Leaflet/Google Maps, live weather outlooks, and realistic category cost distributions.",
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=700&q=80",
  },
  {
    icon: Wallet,
    step: "Customize",
    title: "Tune Moods & Edit Activities",
    text: "Regenerate single days into Relaxed, Packed, or Luxury moods. Reorder activities, add custom spots, or auto-geocode locations with a single click.",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=700&q=80",
  },
  {
    icon: Share2,
    step: "Export",
    title: "Share & Take It Everywhere",
    text: "Export high-resolution PDF travel vouchers, sync calendar files (.ics), generate instant public share links, or resume saved conversations across devices.",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=700&q=80",
  },
];

const TIPS = [
  "Be specific: “5 days, 2 travellers, $2,500 in Tokyo” gets you an instant tailored itinerary.",
  "Mention budget tiers (Budget, Standard, Luxury) — the AI calibrates activity prices accordingly.",
  "Check the weather panel before finalizing dates; it provides live arrival forecasts.",
  "Use saved chats to organize multiple upcoming trips simultaneously.",
];

export default function HowItWorksPage() {
  return (
    <div className="px-4 py-16 sm:px-6 relative">
      <SectionTitle
        eyebrow="Workflow"
        title="From Dream to Itinerary in 4 Moves"
        subtitle="Experience seamless generative AI travel planning with real-time route optimization, weather intelligence, and luxury UI."
      />

      <div className="mx-auto mt-12 max-w-4xl space-y-6">
        {JOURNEY.map((item, index) => (
          <motion.div
            key={item.step}
            whileHover={{ scale: 1.01, y: -4 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden border-slate-200 bg-white p-0 shadow-card transition-all duration-300 hover:shadow-lift">
              <div className="flex flex-col md:flex-row items-center">
                <div className="relative h-48 w-full md:w-64 shrink-0 overflow-hidden">
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-700 hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/90 hidden md:block" />
                  <span className="absolute top-3 left-3 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-lg">
                    Step 0{index + 1}
                  </span>
                </div>

                <div className="p-6 min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-blue-600">
                    <item.icon aria-hidden className="size-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">{item.step}</span>
                  </div>
                  <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pro tips */}
      <div className="mx-auto mt-14 max-w-4xl">
        <Card className="border-blue-100 bg-white p-6 shadow-card">
          <h3 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-bold text-blue-700">
            <Sparkles aria-hidden className="size-5" /> Pro Tips for AI Travel Optimization
          </h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {TIPS.map((tip) => (
              <li key={tip} className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-700">
                <CalendarCheck2 aria-hidden className="mt-0.5 size-4 shrink-0 text-blue-600" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-14 flex justify-center">
        <Link to="/planner">
          <Button size="lg" className="rounded-full px-10">
            Start Planning Now <ArrowRight aria-hidden className="size-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

