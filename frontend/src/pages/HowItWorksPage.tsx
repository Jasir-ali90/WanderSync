import { Link } from "react-router-dom";
import { ArrowRight, Bot, MapPinned, Share2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";

const JOURNEY = [
  {
    icon: Bot,
    step: "Converse",
    title: "Chat with the planner",
    text: "Say what you want in one sentence. WanderSync extracts requirements, asks only for what's missing and keeps track of everything you've told it.",
  },
  {
    icon: MapPinned,
    step: "Review",
    title: "Explore your itinerary",
    text: "Day tabs with a timeline of activities, an interactive map, weather outlook and a budget that updates as you edit.",
  },
  {
    icon: Share2,
    step: "Refine & share",
    title: "Adjust anything, then take it with you",
    text: "Ask for changes in chat or edit by hand. Export a branded PDF or calendar file, or share a link with travel companions.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="px-4 py-16 sm:px-6">
      <SectionTitle
        eyebrow="How it works"
        title="From dream to itinerary in three moves"
      />
      <ol className="mx-auto mt-12 max-w-3xl space-y-5">
        {JOURNEY.map((item, index) => (
          <li key={item.step}>
            <Card className="flex gap-4 p-6">
              <div className="flex flex-col items-center">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-500/15 text-brand-400">
                  <item.icon aria-hidden className="size-5" />
                </span>
                {index < JOURNEY.length - 1 && (
                  <span aria-hidden className="mt-2 h-full w-px bg-ink-600" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-400">
                  Step {index + 1} · {item.step}
                </p>
                <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold text-slate-100">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{item.text}</p>
              </div>
            </Card>
          </li>
        ))}
      </ol>
      <div className="mt-12 flex justify-center">
        <Link to="/register">
          <Button size="lg">
            Start with step one <ArrowRight aria-hidden className="size-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
