import { Link } from "react-router-dom";
import { Bot, MapPin } from "lucide-react";
import type { PlannerMessage } from "@/types/planner";

function tripIdOf(message: PlannerMessage): string | null {
  const meta = (message.meta ?? {}) as Record<string, unknown>;
  if (meta.type === "itinerary_generated" && typeof meta.trip_id === "string") {
    return meta.trip_id;
  }
  return null;
}

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
      className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/50 p-4 thin-scroll"
    >
      {messages.map((message) => {
        const isAssistant = message.role === "assistant";
        const tripId = isAssistant ? tripIdOf(message) : null;

        return (
          <li
            key={message.id}
            className={`flex items-start gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {isAssistant && (
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-600 text-white shadow-sm">
                <Bot className="size-4" />
              </div>
            )}

            <div
              className={
                message.role === "user"
                  ? "max-w-[85%] whitespace-pre-line rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm"
                  : "max-w-[88%] whitespace-pre-line rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-2.5 text-sm leading-relaxed text-slate-800 shadow-sm"
              }
            >
              {isAssistant && (
                <div className="mb-1 text-xs font-semibold text-blue-600">
                  WanderSync AI Assistant
                </div>
              )}

              {message.content}

              {tripId && (
                <Link
                  to={`/trips/${tripId}`}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                  <MapPin className="size-3.5" /> View Trip Plan
                </Link>
              )}
            </div>
          </li>
        );
      })}

      {sending && (
        <li aria-live="polite" className="flex items-center gap-3">
          <div className="grid size-8 shrink-0 animate-pulse place-items-center rounded-lg bg-blue-600 text-white shadow-sm">
            <Bot className="size-4" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-600 shadow-sm">
            AI Assistant is thinking...
          </div>
        </li>
      )}
    </ol>
  );
}
