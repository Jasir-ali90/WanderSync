import { Link } from "react-router-dom";
import { ArrowRight, Bot, MapPinned, Route, Wallet } from "lucide-react";


import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";

const DEEP_DIVES = [
  {
    icon: Bot,
    title: "AI that plans like a consultant",
    points: [
      "Requirement extraction from plain language",
      "Only necessary follow-up questions",
      "Structured itineraries — validated before saving",
    ],
  },
  {
    icon: Route,
    title: "Optimization engine",
    points: [
      "Nearest-neighbour geographic routing per day",
      "Schedule repair inside realistic day windows",
      "Overlap, travel-time and budget violation checks",
    ],
  },
  {
    icon: MapPinned,
    title: "Itinerary you control",
    points: [
      "Edit, reorder or remove any activity",
      "Regenerate single days in different moods",
      "Map, timeline and budget update together",
    ],
  },
  {
    icon: Wallet,
    title: "Honest budget & scoring",
    points: [
      "Category totals with daily averages",
      "Trip Optimization Score with full breakdown",
      "Estimates clearly labelled — never fake prices",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="px-4 py-16 sm:px-6">
      <SectionTitle
        eyebrow="Features"
        title="A planning engine, not a demo"
        subtitle="Every capability below is implemented end-to-end in the Django backend and surfaced through a polished React interface."
      />
      <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-2">
        {DEEP_DIVES.map((block) => (
          <Card key={block.title} className="p-6">
            <span className="grid size-10 place-items-center rounded-lg bg-brand-500/15 text-brand-400">
              <block.icon aria-hidden className="size-5" />
            </span>
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg font-semibold text-slate-100">
              {block.title}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              {block.points.map((point) => (
                <li key={point} className="flex gap-2">
                  <ArrowRight aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-400" />
                  {point}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <div className="mt-12 flex justify-center">
        <Link to="/register">
          <Button size="lg">Try it now</Button>
        </Link>
      </div>
    </div>
  );
}
