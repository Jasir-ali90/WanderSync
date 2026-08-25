import { motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/Card";

const DEMO_CHAT = [
  { role: "user", text: "Plan a 7-day cultural trip to Italy. Moderate budget, I love museums & local food." },
  { role: "assistant", text: "Wonderful! Two quick things — which month, and how many travellers?" },
  { role: "user", text: "May, two of us." },
  { role: "assistant", text: "Your 7-day Italy itinerary is ready — Rome → Florence → Venice, optimized route, €1,840 est." },
];

export function ChatMockup() {
  return (
    <Card className="w-full max-w-md p-4" aria-label="Example planning conversation">
      <div className="flex items-center gap-2 border-b border-ink-700 pb-3">
        <span className="grid size-7 place-items-center rounded-lg bg-brand-500/15 text-brand-400">
          <Bot aria-hidden className="size-4" />
        </span>
        <p className="text-sm font-medium text-slate-200">WanderSync Planner</p>
        <span className="ml-auto rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand-300">
          Live demo
        </span>
      </div>
      <div className="mt-3 space-y-2.5">
        {DEMO_CHAT.map((message) => (
          <motion.div
            key={message.text}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className={
              message.role === "user"
                ? "ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-brand-500 px-3 py-2 text-xs leading-relaxed text-ink-950"
                : "max-w-[85%] rounded-xl rounded-bl-sm bg-ink-700 px-3 py-2 text-xs leading-relaxed text-slate-200"
            }
          >
            {message.text}
          </motion.div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-xs text-slate-500">
        <Sparkles aria-hidden className="size-3.5 text-brand-400" />
        Ask anything — “make day 2 more relaxed”…
      </div>
    </Card>
  );
}
