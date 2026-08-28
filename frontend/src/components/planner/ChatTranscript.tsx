import { motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";
import type { PlannerMessage } from "@/types/planner";

/** Scrollable conversation transcript with animated 3D AI avatar and voice waves. */
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
      className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
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
            {/* Assistant 3D Avatar Face */}
            {isAssistant && (
              <div className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-brand-500/20">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-ink-950">
                  <Bot className="size-5 text-brand-300" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 border border-ink-950 animate-pulse" />
              </div>
            )}

            <div
              className={
                message.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-brand-500 to-indigo-600 px-4 py-3 text-sm leading-relaxed text-slate-950 font-semibold shadow-lg shadow-brand-500/20"
                  : "max-w-[88%] whitespace-pre-line rounded-2xl rounded-tl-sm border border-brand-500/20 bg-ink-900/90 px-4 py-3 text-sm leading-relaxed text-slate-200 shadow-xl backdrop-blur-md"
              }
            >
              {isAssistant && (
                <div className="mb-1.5 flex items-center gap-2 text-xs font-bold text-brand-300">
                  <span>WanderSync AI</span>
                  {engine && (
                    <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-semibold text-brand-200 border border-brand-500/30">
                      {engine === "openai" ? "✨ Generative Engine" : "🎬 Smart Fallback"}
                    </span>
                  )}
                </div>
              )}

              {message.content}
            </div>
          </li>
        );
      })}

      {sending && (
        <li aria-live="polite" className="flex items-center gap-3">
          <div className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-brand-500/30 animate-pulse">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-ink-950">
              <Sparkles className="size-4 text-brand-300 animate-spin" />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-brand-500/30 bg-ink-900/90 px-4 py-3 backdrop-blur-md">
            <span className="text-xs font-semibold text-brand-300">AI is thinking</span>
            {/* Animated Equalizer Wave Bars */}
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3].map((bar) => (
                <motion.span
                  key={bar}
                  animate={{ height: ["6px", "16px", "6px"] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: bar * 0.15 }}
                  className="w-1 rounded-full bg-brand-400"
                />
              ))}
            </div>
          </div>
        </li>
      )}
    </ol>
  );
}
