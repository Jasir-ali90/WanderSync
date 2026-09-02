import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, SendHorizonal, Mic, MicOff } from "lucide-react";

import { ChatTranscript } from "@/components/planner/ChatTranscript";
import { SavedChats } from "@/components/planner/SavedChats";
import { Button } from "@/components/ui/Button";
import { Card, Spinner } from "@/components/ui/Card";
import { api, ApiError } from "@/lib/api";
import type { PlannerMessage } from "@/types/planner";

const SUGGESTIONS = [
  "7-day Luxury Escape to Tokyo & Kyoto",
  "5-day Relaxed Spa & Beach Gateway to Maldives",
  "4-day Historic Blitz in Rome & Florence",
  "6-day Winter Alpine Adventure in Swiss Alps",
  "5-day Tropical Family Trip to Malaysia",
  "3-day Food & Wine Tasting Weekend in Tuscany",
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

  // Web Speech API state
  const [isListening, setIsListening] = useState(false);

  const listRef = useRef<HTMLOListElement>(null);
  const prefillSent = useRef(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check speech recognition support
  }, []);

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
          // Clean fallback
        }
      }
      if (!cancelled) {
        setConversationId(null);
        setMessages([]);
        setBootstrapping(false);
      }
    }

    bootstrap()
      .catch(() => !cancelled && setError("Couldn't load the planner. Please try again."))
      .finally(() => !cancelled && setBootstrapping(false));
    return () => {
      cancelled = true;
    };
  }, []);

  function startNewChat() {
    setConversationId(null);
    setMessages([]);
    setInput("");
    setError(null);
    prefillSent.current = false;
    localStorage.removeItem(CONVERSATION_KEY);
  }

  const toggleListening = () => {
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Voice recognition is not supported in this browser. Please try Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore already stopped
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new (SpeechRecognition as any)();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        if (text) {
          setInput(text);
        }
      };

      recognition.onerror = (event: any) => {
        logger_error: console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          setError("Microphone access was denied. Please allow microphone permissions in your browser.");
        } else if (event.error !== "no-speech") {
          setError(`Voice input error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Speech start error:", err);
      setIsListening(false);
      setError("Could not start microphone. Please check browser permissions.");
    }
  };

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

  if (bootstrapping) return <Spinner label="Loading WanderSync AI Assistant..." />;

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-5xl gap-4 md:h-[calc(100vh-6.5rem)]">
      <SavedChats activeId={conversationId} onOpen={openConversation} onNewChat={startNewChat} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between pb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">AI Travel Assistant</h1>
            <p className="text-xs text-slate-500">
              Ask about destinations, 7-day itineraries, budgets, transportation or packing tips.
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={startNewChat}>
            <MessageSquarePlus className="size-3.5" /> New chat
          </Button>
        </header>

        <Card className="flex min-h-0 flex-1 flex-col border border-slate-200 bg-white shadow-sm">
          <ChatTranscript messages={messages} sending={sending} listRef={listRef} />

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void send(suggestion)}
                  disabled={sending}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p role="alert" className="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          {/* Unified Composer Container */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/50">
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void send(input);
              }}
            >
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? "Stop listening" : "Speak message"}
                aria-label="Microphone input"
                className={`grid size-10 shrink-0 place-items-center rounded-lg border transition-colors ${
                  isListening
                    ? "bg-red-500 text-white border-red-600 animate-pulse"
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-blue-600"
                }`}
              >
                {isListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
              </button>

              <label htmlFor="planner-input" className="sr-only">Message the travel planner</label>
              <input
                id="planner-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={isListening ? "Listening... Speak now..." : "Ask WanderSync anything about your trip..."}
                maxLength={4000}
                autoComplete="off"
                className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none"
              />

              <Button type="submit" loading={sending} disabled={!input.trim()} aria-label="Send message">
                {!sending && <SendHorizonal className="size-4" />}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}