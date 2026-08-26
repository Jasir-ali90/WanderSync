import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, SendHorizonal } from "lucide-react";

import { ChatTranscript } from "@/components/planner/ChatTranscript";
import { Button } from "@/components/ui/Button";
import { Card, Spinner } from "@/components/ui/Card";
import { api, ApiError } from "@/lib/api";
import type { PlannerMessage } from "@/types/planner";

const SUGGESTIONS = [
  "Plan a 5-day trip to Dubai",
  "Create a romantic getaway to Istanbul",
  "Plan a family trip to Malaysia",
  "A food-focused weekend in Bologna",
];

const CONVERSATION_KEY = "wandersync.conversation.id";

export default function PlannerPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PlannerMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const listRef = useRef<HTMLOListElement>(null);
  const prefillSent = useRef(false);

  // Chat history persists: reuse the saved conversation across visits.
  useEffect(() => {
    let cancelled = false;
    const savedId = localStorage.getItem(CONVERSATION_KEY);

    async function bootstrap() {
      if (savedId) {
        try {
          const data = await api.get<{ conversation: unknown; messages: PlannerMessage[] }>(
            `/planner/conversations/${savedId}/`,
          );
          if (!cancelled) {
            setConversationId(savedId);
            setMessages(data.messages);
            setBootstrapping(false);
            return;
          }
        } catch {
          // Saved conversation gone — fall through and create a fresh one.
        }
      }
      const data = await api.post<{ conversation: { id: string }; messages: PlannerMessage[] }>(
        "/planner/conversations/",
      );
      if (!cancelled) {
        setConversationId(data.conversation.id);
        setMessages(data.messages);
        localStorage.setItem(CONVERSATION_KEY, data.conversation.id);
      }
    }

    bootstrap()
      .catch(() => !cancelled && setError("Couldn't start the planner. Is the backend running?"))
      .finally(() => !cancelled && setBootstrapping(false));
    return () => {
      cancelled = true;
    };
  }, []);

  function startNewChat() {
    void (async () => {
      try {
        const data = await api.post<{ conversation: { id: string }; messages: PlannerMessage[] }>(
          "/planner/conversations/",
        );
        setConversationId(data.conversation.id);
        setMessages(data.messages);
        localStorage.setItem(CONVERSATION_KEY, data.conversation.id);
        setError(null);
      } catch {
        setError("Couldn't start a new chat.");
      }
    })();
  }

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

  // Prefill from Famous Spots ("Ask the planner") via ?q=
  useEffect(() => {
    const question = searchParams.get("q");
    if (
      question &&
      !prefillSent.current &&
      conversationId &&
      !bootstrapping
    ) {
      prefillSent.current = true;
      void send(question);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, bootstrapping, searchParams]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  if (bootstrapping) return <Spinner label="Waking up your travel planner…" />;

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-3xl flex-col md:h-[calc(100vh-7rem)]">
      <header className="flex items-center justify-between pb-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-50">AI Trip Planner</h1>
          <p className="text-xs text-slate-500">
            Describe your dream trip — itineraries land in{" "}
            <Link to="/trips" className="text-brand-400">your trips</Link>. Chat history is saved automatically.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={startNewChat}>
          <MessageSquarePlus aria-hidden className="size-3.5" /> New chat
        </Button>
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