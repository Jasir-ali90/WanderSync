import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { SendHorizonal } from "lucide-react";

import { ChatTranscript } from "@/components/planner/ChatTranscript";
import { Button } from "@/components/ui/Button";
import { Card, Spinner } from "@/components/ui/Card";
import { api, ApiError } from "@/lib/api";
import type { Conversation, PlannerMessage } from "@/types/planner";

const SUGGESTIONS = [
  "Plan a 5-day trip to Dubai",
  "Create a romantic getaway to Istanbul",
  "Plan a family trip to Malaysia",
  "A food-focused weekend in Bologna",
];

export default function PlannerPage() {
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PlannerMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .post<{ conversation: Conversation; messages: PlannerMessage[] }>(
        "/planner/conversations/",
      )
      .then((data) => {
        if (cancelled) return;
        setConversationId(data.conversation.id);
        setMessages(data.messages);
      })
      .catch(() => !cancelled && setError("Couldn't start the planner. Is the backend running?"))
      .finally(() => !cancelled && setBootstrapping(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(content: string) {
    if (!conversationId || !content.trim() || sending) return;
    setError(null);
    setSending(true);
    const optimistic: PlannerMessage = {
      id: `tmp-${crypto.randomUUID()}`,
      role: "user",
      content,
      meta: {},
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    try {
      const data = await api.post<{
        user_message: PlannerMessage;
        assistant_message: PlannerMessage;
        trip?: { id: string };
      }>(`/planner/conversations/${conversationId}/messages/`, { content });
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimistic.id),
        data.user_message,
        data.assistant_message,
      ]);
      if (data.trip) void queryClient.invalidateQueries({ queryKey: ["trips"] });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(content);
      setError(err instanceof ApiError ? err.message : "The planner is unavailable — try again.");
    } finally {
      setSending(false);
    }
  }

  if (bootstrapping) return <Spinner label="Waking up your travel planner…" />;

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-3xl flex-col md:h-[calc(100vh-7rem)]">
      <header className="pb-3">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-50">AI Trip Planner</h1>
        <p className="text-xs text-slate-500">
          Describe your dream trip — the itinerary lands in{" "}
          <Link to="/trips" className="text-brand-400">your trips</Link>.
        </p>
      </header>

      <Card className="flex min-h-0 flex-1 flex-col">
        <ChatTranscript messages={messages} sending={sending} listRef={listRef} />

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void send(suggestion)}
                disabled={sending}
                className="rounded-full border border-ink-600 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-brand-500/40 hover:text-brand-300 disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="mx-4 mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        <form
          className="flex gap-2 border-t border-ink-700 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
        >
          <label htmlFor="planner-input" className="sr-only">Message the travel planner</label>
          <input
            id="planner-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Tell me about your dream trip…"
            maxLength={4000}
            autoComplete="off"
            className="h-10 flex-1 rounded-lg border border-ink-600 bg-ink-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400"
          />
          <Button type="submit" loading={sending} disabled={!input.trim()} aria-label="Send message">
            {!sending && <SendHorizonal aria-hidden className="size-4" />}
          </Button>
        </form>
      </Card>
    </div>
  );
}
