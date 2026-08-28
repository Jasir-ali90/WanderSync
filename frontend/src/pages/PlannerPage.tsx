import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, SendHorizonal } from "lucide-react";

import { ChatTranscript } from "@/components/planner/ChatTranscript";
import { SavedChats } from "@/components/planner/SavedChats";
import { VoicePlanner } from "@/components/planner/VoicePlanner";
import { Button } from "@/components/ui/Button";
import { Card, Spinner } from "@/components/ui/Card";
import { api, ApiError } from "@/lib/api";
import type { PlannerMessage } from "@/types/planner";

const SUGGESTIONS = [
  "✨ 7-day VVIP Luxury Escape to Tokyo & Kyoto",
  "🏖️ 5-day Relaxed Spa & Beach Gateway to Maldives",
  "🏰 4-day Historic & Culinary Blitz in Rome & Florence",
  "🏔️ 6-day Winter Alpine Adventure in Swiss Alps",
  "🌴 5-day Family-Friendly Tropical Trip to Malaysia",
  "🍷 3-day Food & Wine Tasting Weekend in Tuscany",
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

  // Chat history persists: resume the saved conversation across visits.
  // IMPORTANT: we do NOT create a conversation on load — that would spawn
  // phantom empty chats (and with React StrictMode's double-mount, even two
  // at once). A conversation is created lazily on the user's first message.
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
          // Saved conversation gone — start a clean session instead.
        }
      }
      if (!cancelled) {
        setConversationId(null);
        setMessages([]);
        setBootstrapping(false);
      }
    }

    bootstrap()
      .catch(() => !cancelled && setError("Couldn't load the planner. Is the backend running?"))
      .finally(() => !cancelled && setBootstrapping(false));
    return () => {
      cancelled = true;
    };
  }, []);

  /** Start a clean planning session — nothing is saved until you send a message. */
  function startNewChat() {
    setConversationId(null);
    setMessages([]);
    setInput("");
    setError(null);
    prefillSent.current = false;
    localStorage.removeItem(CONVERSATION_KEY);
  }


  async function send(content: string) {
    const text = content.trim();
    if (!text || sending) return;
    setError(null);
    setSending(true);
    const optimistic: PlannerMessage = {
      id: `tmp-${crypto.randomUUID()}`,
      role: "user",
      content: text,
      meta: {},
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    try {
      // Lazily create the conversation on the first message so we never
      // build up phantom empty "saved" chats.
      let activeId = conversationId;
      if (!activeId) {
        const created = await api.post<{
          conversation: { id: string };
          messages: PlannerMessage[];
        }>("/planner/conversations/", { title: text.slice(0, 60) });
        activeId = created.conversation.id;
        setConversationId(activeId);
        localStorage.setItem(CONVERSATION_KEY, activeId);
      }
      const data = await api.post<{
        user_message: PlannerMessage;
        assistant_message: PlannerMessage;
        trip?: { id: string };
      }>(`/planner/conversations/${activeId}/messages/`, { content: text });
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimistic.id),
        data.user_message,
        data.assistant_message,
      ]);
      if (data.trip) void queryClient.invalidateQueries({ queryKey: ["trips"] });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(text);
      setError(err instanceof ApiError ? err.message : "The planner is unavailable — try again.");
    } finally {
      setSending(false);
    }
  }

  // Prefill from Famous Spots ("Ask the planner") via ?q= — send() now
  // handles conversation creation, so it can run even before one exists.
  useEffect(() => {
    const question = searchParams.get("q");
    if (question && !prefillSent.current && !bootstrapping) {
      prefillSent.current = true;
      void send(question);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapping, searchParams]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  /** Resume a saved conversation (topic-based) from the sidebar. */
  const openConversation = (id: string) => {
    if (id === conversationId) return;
    setBootstrapping(true);
    void api
      .get<{ messages: PlannerMessage[] }>(`/planner/conversations/${id}/`)
      .then((data) => {
        setConversationId(id);
        setMessages(data.messages);
        localStorage.setItem(CONVERSATION_KEY, id);
        setError(null);
      })
      .catch(() => setError("Couldn't open that saved chat."))
      .finally(() => setBootstrapping(false));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning! 🌅 Where are you dreaming of heading?";
    if (hour < 18) return "Good afternoon! ☀️ Ready to plan your next journey?";
    return "Good evening! 🌙 Let's build your perfect itinerary.";
  };

  if (bootstrapping) return <Spinner label="Waking up your travel planner…" />;

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-5xl gap-4 md:h-[calc(100vh-7rem)]">
      <SavedChats activeId={conversationId} onOpen={openConversation} onNewChat={startNewChat} />

      <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex items-center justify-between pb-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-50">
            {getGreeting()}
          </h1>
          <p className="text-xs text-slate-400">
            Describe your destination, dates, budget or group — WanderSync handles the rest. Saved automatically.
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

        <div className="p-3 border-t border-ink-700 space-y-2">
          <VoicePlanner onSpeechResult={(txt) => void send(txt)} />

          <form
            className="flex gap-2"
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
        </div>
      </Card>
      </div>
    </div>
  );
}