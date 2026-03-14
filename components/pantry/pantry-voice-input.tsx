"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addPantryItemsBatch } from "@/app/dashboard/pantry/actions";

// ============================================
// SPEECH API TYPES
// ============================================

interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  0: SpeechRecognitionResultItem;
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// ============================================
// COMPONENT
// ============================================

interface PantryVoiceInputProps {
  onItemsParsed: (
    items: Array<{ name: string; amount?: string; unit?: string }>,
  ) => void;
}

export default function PantryVoiceInput({
  onItemsParsed,
}: PantryVoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const isSupported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const handleVoiceInput = async () => {
    if (!isSupported) {
      toast.error("Voice input not supported in this browser");
      return;
    }

    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      setIsListening(false);
      const transcript = event.results[0][0].transcript;

      if (!transcript.trim()) {
        toast.error("Couldn't hear anything, try again");
        return;
      }

      toast.info(`Heard: "${transcript}"`);
      setIsParsing(true);

      try {
        const response = await fetch("/api/pantry/parse-voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript }),
        });

        if (!response.ok) throw new Error("Failed to parse voice input");

        const { items } = await response.json();

        if (items.length === 0) {
          toast.error("Couldn't identify any items, try again");
          return;
        }

        await addPantryItemsBatch(
          items.map(
            (item: { name: string; amount?: string; unit?: string }) => ({
              name: item.name,
              amount: item.amount,
              unit: item.unit,
              source: "voice" as const,
            }),
          ),
        );

        toast.success(
          `Added ${items.length} item${items.length > 1 ? "s" : ""} to pantry`,
        );
        onItemsParsed(items);
      } catch (error) {
        toast.error("Failed to process voice input");
        console.error(error);
      } finally {
        setIsParsing(false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      if (event.error === "no-speech") {
        toast.error("No speech detected, try again");
      } else {
        toast.error("Voice input error, try again");
      }
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  if (!isSupported) return null;

  return (
    <Button
      onClick={handleVoiceInput}
      disabled={isListening || isParsing}
      variant="outline"
      size="icon"
      className="shrink-0 border-border-light"
      title="Voice input"
    >
      {isParsing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isListening ? (
        <MicOff className="h-4 w-4 text-red-500" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
