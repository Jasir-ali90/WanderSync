import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bot,
  CheckCircle2,
  CloudSun,
  Compass,
  MapPinned,
  Route,
  Sparkles,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";

const DEEP_DIVES = [
  {
    icon: Bot,
    title: "Generative AI Companion",
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=85",
    points: [
      "Natural language requirement extraction from conversational prompts",
      "Interactive follow-ups for dates, travellers, and budget preferences",
      "Validated day-by-day itineraries saved automatically",
      "Persistent conversation memory with search, pin, and rename",
    ],
  },
  {
    icon: Route,
    title: "Geo-Optimization Engine",
    image: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=800&q=85",
    points: [
      "Nearest-neighbour geographic route optimization per day",
      "Smart day repair inside realistic daylight windows",
      "Overlap, travel-time and budget collision checking",
      "Interactive OpenStreetMap & Google Maps integration",
    ],
  },
  {
    icon: MapPinned,
    title: "Interactive Itinerary Control",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=85",
    points: [
      "Edit, reorder, or remove activities with instant recalculation",
      "Regenerate specific days with mood switchers (Luxury, Relaxed, Packed)",
      "One-click auto-geocoding for activity markers on map",
      "Export PDF & .ics calendar files or share live public links",
    ],
  },
  {
    icon: Wallet,
    title: "Market Budget Intelligence",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=85",
    points: [
      "Itemized category breakdowns (Accommodation, Food, Transport, Misc)",
      "Economy, Standard, and Premium market price ranges",
      "Live weather & packing suggestions tailored to travel dates",
      "Trip Optimization Score with actionable quality advice",
    ],
  },
];

const HIGHLIGHTS = [
  { icon: Compass, text: "Famous-spot discovery with live weather per destination" },
  { icon: CloudSun, text: "Arrival-date forecasts, packing hints and rain alerts" },
  { icon: Bot, text: "Natural AI conversation that greets you by the time of day" },
  { icon: Route, text: "Export branded PDF + calendar, or share a live link" },
];

export default function FeaturesPage() {
  return (
    <div className="px-4 py-16 sm:px-6 relative">
      <SectionTitle
        eyebrow="VVIP Architecture"
        title="Generative Travel Platform"
        subtitle="Every feature is engineered end-to-end with Django, MongoEngine, and React for maximum performance, accuracy, and luxury UX."
      />

      {/* Quick highlights */}
      <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {HIGHLIGHTS.map((item) => (
          <Card key={item.text} className="flex items-start gap-3 p-4 border-brand-500/20 bg-ink-900/60 backdrop-blur-md">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-500/15 text-brand-400">
              <item.icon aria-hidden className="size-4" />
            </span>
            <p className="text-xs leading-relaxed text-slate-300">{item.text}</p>
          </Card>
        ))}
      </div>

      <div className="mx-auto mt-14 grid max-w-6xl gap-8 md:grid-cols-2">
        {DEEP_DIVES.map((block) => (
          <motion.div
            key={block.title}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden border-white/10 bg-gradient-to-b from-ink-900/90 to-ink-950/90 p-0 shadow-2xl backdrop-blur-xl">
              <div className="relative h-48 w-full overflow-hidden">
                <img src={block.image} alt={block.title} className="h-full w-full object-cover transition-transform duration-700 hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
                <div className="absolute top-4 left-4 grid size-11 place-items-center rounded-xl bg-ink-950/80 backdrop-blur-md border border-brand-500/40 text-brand-300 shadow-xl">
                  <block.icon aria-hidden className="size-6" />
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-100">
                  {block.title}
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
                  {block.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-400" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 flex justify-center">
        <Link to="/planner">
          <Button size="lg" className="rounded-full px-10 shadow-2xl shadow-brand-500/30">
            Launch AI Planner <Sparkles aria-hidden className="size-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

