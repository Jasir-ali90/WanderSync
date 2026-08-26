import { motion } from "framer-motion";
import { Bot, Sparkles, User } from "lucide-react";
import type { PlannerMessage } from "@/types/planner";

/** Scrollable conversation transcript with mature, high-contrast readable bubbles. */
export function ChatTranscript({
  messages,
  sending,
  listRef,
}: {
  messages: PlannerMessage[];
  sending: boolean;
  listRef: React.RefObject<HTMLOListElement | null>;
}) {
  return (
    <ol
      ref={listRef}
      aria-label="Conversation"
      className="min-h-0 flex-1 space-y-4 p-4"
    >
      {messages.map((message) => {
        const isAssistant = message.role === "assistant";
        const engine = isAssistant ? (message.meta as { engine?: string })?.engine : undefined;

        return (
          <li
            key={message.id}
            className={`flex items-start gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {/* Assistant Avatar */}
            {isAssistant && (
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink-800 border border-sand-500/30 text-sand-300 shadow-sm">
                <Bot className="size-4" />
              </div>
            )}

            <div
              className={
                message.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-sand-500 px-4 py-3 text-sm leading-relaxed text-ink-950 font-medium shadow-md break-words"
                  : "max-w-[88%] whitespace-pre-line rounded-2xl rounded-tl-sm border border-ink-700/90 bg-ink-950/90 px-4 py-3 text-sm leading-relaxed text-slate-100 shadow-sm break-words"
              }
            >
              {isAssistant && (
                <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-sand-400">
                  <span>WanderSync AI</span>
                  {engine && (
                    <span className="rounded-md bg-ink-800 px-1.5 py-0.5 text-[10px] font-normal text-slate-300 border border-ink-700">
                      {engine === "openai" ? "✨ Real-time AI" : "Verified Itinerary Engine"}
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {message.content}
              </div>
            </div>

            {/* User Avatar */}
            {!isAssistant && (
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-sand-500/20 border border-sand-500/40 text-sand-300">
                <User className="size-4" />
              </div>
            )}
          </li>
        );
      })}

      {sending && (
        <li aria-live="polite" className="flex items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink-800 border border-sand-500/30 text-sand-300">
            <Sparkles className="size-4 animate-spin text-sand-400" />
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-ink-700 bg-ink-950/90 px-4 py-2.5">
            <span className="text-xs font-medium text-slate-300">Formulating optimal travel plan</span>
            {/* Animated Equalizer Wave Bars */}
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3].map((bar) => (
                <motion.span
                  key={bar}
                  animate={{ height: ["4px", "12px", "4px"] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: bar * 0.15 }}
                  className="w-1 rounded-full bg-sand-400"
                />
              ))}
            </div>
          </div>
        </li>
      )}
    </ol>
  );
}
