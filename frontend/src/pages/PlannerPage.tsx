import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, Mic, MicOff, SendHorizonal, Volume2 } from "lucide-react";

import { ChatTranscript } from "@/components/planner/ChatTranscript";
import { SavedChats } from "@/components/planner/SavedChats";
import { Button } from "@/components/ui/Button";
import { Card, Spinner } from "@/components/ui/Card";
import { api, ApiError } from "@/lib/api";
import type { PlannerMessage } from "@/types/planner";

const SUGGESTIONS = [
  "✨ 7-day Culture & Food Journey to Tokyo & Kyoto",
  "🏖️ 5-day Relaxed Beach & Snorkeling Escape to Maldives",
  "🏰 4-day Historic & Culinary Blitz in Rome & Florence",
  "🏔️ 6-day Scenic Alpine Adventure in Swiss Alps",
  "🌴 5-day Tropical Rainforest & Beach Trip to Bali",
  "🍷 3-day Food & Vineyard Tour in Tuscany",
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
  const [isListening, setIsListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);

  const listRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prefillSent = useRef(false);
  const recognitionRef = useRef<any>(null);

  // Voice recognition support check

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
          // Saved conversation not found
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

  function startNewChat() {
    setConversationId(null);
    setMessages([]);
    setInput("");
    setError(null);
    prefillSent.current = false;
    localStorage.removeItem(CONVERSATION_KEY);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }

  async function send(content: string) {
    const text = content.trim();
    if (!text || sending) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
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
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

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

  const toggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNote("Voice input is not supported in this browser. Please type your message.");
      setTimeout(() => setVoiceNote(null), 4000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceNote("Listening... Speak your travel plan.");
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
        if (inputRef.current) {
          inputRef.current.style.height = "auto";
          inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
        }
      };

      recognition.onerror = (err: any) => {
        console.error("Speech Recognition Error:", err);
        setIsListening(false);
        setVoiceNote("Voice recognition interrupted. You can try again or type.");
        setTimeout(() => setVoiceNote(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
        setVoiceNote(null);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
      setVoiceNote("Couldn't start voice recognition.");
      setTimeout(() => setVoiceNote(null), 3000);
    }
  };

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning! 🌅 Where are you dreaming of heading?";
    if (hour < 18) return "Good afternoon! ☀️ Ready to plan your next journey?";
    return "Good evening! 🌙 Let's build your perfect itinerary.";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  if (bootstrapping) return <Spinner label="Waking up your travel planner…" />;

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-5xl gap-4 md:h-[calc(100vh-6.5rem)]">
      <SavedChats activeId={conversationId} onOpen={openConversation} onNewChat={startNewChat} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header bar */}
        <header className="flex items-center justify-between pb-3">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-100 sm:text-xl">
              {getGreeting()}
            </h1>
            <p className="text-xs text-slate-400">
              Describe your destination, dates, budget or group — WanderSync handles the rest.
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={startNewChat} className="rounded-lg shadow-sm">
            <MessageSquarePlus aria-hidden className="size-3.5" /> New chat
          </Button>
        </header>

        {/* Bordered chat container */}
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border border-ink-700/80 bg-ink-900/90 shadow-xl backdrop-blur-sm">
          {/* Scrollable conversation history */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ChatTranscript messages={messages} sending={sending} listRef={listRef} />
          </div>

          {/* Quick inspiration tags */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-2 pt-1 border-t border-ink-800/60">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void send(suggestion)}
                  disabled={sending}
                  className="rounded-full border border-ink-700/80 bg-ink-950/70 px-3 py-1 text-xs text-slate-300 transition-all hover:border-sand-500/50 hover:text-sand-300 disabled:opacity-50 text-left"
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

          {voiceNote && (
            <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-sand-500/30 bg-sand-500/10 px-3 py-1.5 text-xs text-sand-300">
              <Volume2 className="size-3.5 animate-pulse text-sand-400" />
              <span>{voiceNote}</span>
            </div>
          )}

          {/* Seamless ChatGPT-style input bar */}
          <div className="border-t border-ink-700/80 bg-ink-950/80 p-3">
            <form
              className="flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-900/95 px-2 py-1.5 transition-all focus-within:border-sand-500/60 focus-within:ring-1 focus-within:ring-sand-500/20"
              onSubmit={(event) => {
                event.preventDefault();
                void send(input);
              }}
            >
              {/* Voice button on left */}
              <button
                type="button"
                onClick={toggleVoice}
                title={isListening ? "Stop listening" : "Voice input (Click to speak)"}
                aria-label="Voice input"
                className={`grid size-9 shrink-0 place-items-center rounded-lg transition-all ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30"
                    : "text-slate-400 hover:bg-ink-800 hover:text-sand-300"
                }`}
              >
                {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </button>

              {/* Message text area */}
              <label htmlFor="planner-input" className="sr-only">Message the travel planner</label>
              <textarea
                ref={inputRef}
                id="planner-input"
                rows={1}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  event.target.style.height = "auto";
                  event.target.style.height = `${Math.min(event.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening... Tell me your trip idea..." : "Ask WanderSync anything or describe your dream trip..."}
                maxLength={4000}
                className="max-h-28 flex-1 resize-none bg-transparent px-2 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />

              {/* Send button right next to input */}
              <Button
                type="submit"
                size="sm"
                loading={sending}
                disabled={!input.trim()}
                aria-label="Send message"
                className="size-8 shrink-0 rounded-lg p-0 font-bold"
              >
                {!sending && <SendHorizonal aria-hidden className="size-4" />}
              </Button>
            </form>
            <p className="mt-1.5 text-center text-[10px] text-slate-500">
              WanderSync uses real travel providers & AI to generate complete itinerary routes and live weather.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}