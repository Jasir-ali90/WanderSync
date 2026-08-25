import type { PlannerMessage } from "@/types/planner";

/** Scrollable conversation transcript with typing indicator. */
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
      className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
    >
      {messages.map((message) => (
        <li
          key={message.id}
          className={
            message.role === "user"
              ? "ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-brand-500 px-3.5 py-2.5 text-sm leading-relaxed text-ink-950"
              : "max-w-[90%] whitespace-pre-line rounded-xl rounded-bl-sm bg-ink-700 px-3.5 py-2.5 text-sm leading-relaxed text-slate-200"
          }
        >
          {message.content}
        </li>
      ))}
      {sending && (
        <li aria-live="polite" className="flex items-center gap-1.5 px-1 text-xs text-slate-500">
          <span className="size-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:0ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:120ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:240ms]" />
          planning…
        </li>
      )}
    </ol>
  );
}
