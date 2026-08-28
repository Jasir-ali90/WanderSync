import { useState, useEffect } from "react";
import { Mic, MicOff, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface VoicePlannerProps {
  onSpeechResult: (text: string) => void;
}

export function VoicePlanner({ onSpeechResult }: VoicePlannerProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
    }
  }, []);

  const toggleListening = () => {
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please type your prompt.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new (SpeechRecognition as any)();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US"; // Can be dynamic

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript("");
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognition.onerror = (err: any) => {
        console.error("Speech Recognition Error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleSend = () => {
    if (transcript.trim()) {
      onSpeechResult(transcript);
      setTranscript("");
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-brand-500/30 bg-ink-900/90 p-3 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-bold text-brand-300">
          <Volume2 className="size-4 text-brand-400 animate-pulse" />
          AI Voice Assistant (English / Urdu / Roman Urdu)
        </span>
        {!supported && (
          <span className="text-[10px] text-amber-400 font-semibold">Browser Voice Unavailble (Fallback Active)</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleListening}
          className={`grid size-10 place-items-center rounded-xl transition-all ${
            isListening
              ? "bg-red-500 text-white animate-bounce shadow-lg shadow-red-500/40"
              : "bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30"
          }`}
        >
          {isListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        </button>

        <input
          type="text"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={isListening ? "Listening... Bolain..." : "Speak or edit recognized text..."}
          className="h-10 flex-1 rounded-xl border border-ink-700 bg-ink-950 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
        />

        {transcript && (
          <Button size="sm" onClick={handleSend} className="rounded-xl">
            <Sparkles className="size-3.5 mr-1" /> Use Voice Input
          </Button>
        )}
      </div>
    </div>
  );
}
