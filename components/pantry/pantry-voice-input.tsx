"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addPantryItemsBatch } from "@/app/dashboard/pantry/actions";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  SpeechRecognitionErrorEvent,
  SpeechRecognitionEvent,
  SpeechRecognitionInstance,
} from "@/lib/speech-types";

// ============================================
// RECORDING ANIMATION
// ============================================

function RecordingAnimation() {
  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      {/* Ripple rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`ripple-${i}`}
          className="absolute inset-0 rounded-full border-2 border-brand/30"
          initial={{ scale: 0.6, opacity: 0.6 }}
          animate={{
            scale: [0.6, 1.4],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Pulsing orange orb */}
      <motion.div
        className="absolute w-20 h-20 rounded-full bg-brand/20"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute w-14 h-14 rounded-full bg-brand/40"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.1,
        }}
      />

      {/* Center mic icon */}
      <motion.div
        className="relative z-10 w-12 h-12 rounded-full bg-brand flex items-center justify-center shadow-brand"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Mic className="h-5 w-5 text-white" />
      </motion.div>
    </div>
  );
}

// Wave bars — deterministic pseudo-random seeds to avoid impure render calls
const BAR_COUNT = 20;

function WaveBars() {
  // Pre-compute deterministic values once — stable across re-renders
  const barSeeds = useMemo(() => {
    const seeds: Array<{
      rand1: number;
      rand2: number;
      durationOffset: number;
    }> = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      const seed1 = ((i * 7 + 3) % 10) / 10;
      const seed2 = ((i * 11 + 5) % 10) / 10;
      const durOffset = ((i * 13 + 1) % 8) / 10;
      seeds.push({ rand1: seed1, rand2: seed2, durationOffset: durOffset });
    }
    return seeds;
  }, []);

  return (
    <div className="flex items-center justify-center gap-0.75 h-10 mt-5">
      {barSeeds.map((seed, i) => {
        const centerDistance = Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2);
        const maxHeight = 40 * (1 - centerDistance * 0.6);
        const minHeight = 4;

        return (
          <motion.div
            key={`bar-${i}`}
            className="w-0.75 rounded-full bg-brand"
            initial={{ height: minHeight, opacity: 0.3 }}
            animate={{
              height: [
                minHeight,
                maxHeight * (0.4 + seed.rand1 * 0.6),
                minHeight,
                maxHeight * (0.3 + seed.rand2 * 0.7),
                minHeight,
              ],
              opacity: [0.3, 0.8, 0.4, 0.9, 0.3],
            }}
            transition={{
              duration: 1.2 + seed.durationOffset,
              repeat: Infinity,
              delay: i * 0.04,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
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
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef("");

  const isSupported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const startListening = useCallback(() => {
    if (!isSupported) {
      toast.error("Voice input not supported in this browser");
      return;
    }

    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = "";
      let interim = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        finalTranscriptRef.current = final.trim();
        setTranscript(final.trim());
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") return;
      setIsListening(false);
      setIsOpen(false);
      toast.error("Voice input error, try again");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    setIsOpen(true);
    setTranscript("");
    setInterimTranscript("");
    finalTranscriptRef.current = "";
    recognition.start();
  }, [isSupported]);

  const stopAndProcess = useCallback(async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setIsListening(false);

    const fullTranscript =
      finalTranscriptRef.current || transcript || interimTranscript;

    if (!fullTranscript.trim()) {
      toast.error("Couldn't hear anything, try again");
      setIsOpen(false);
      return;
    }

    setIsParsing(true);

    try {
      const response = await fetch("/api/pantry/parse-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fullTranscript.trim() }),
      });

      if (!response.ok) throw new Error("Failed to parse voice input");

      const { items } = await response.json();

      if (items.length === 0) {
        toast.error("Couldn't identify any items, try again");
        setIsOpen(false);
        return;
      }

      await addPantryItemsBatch(
        items.map((item: { name: string; amount?: string; unit?: string }) => ({
          name: item.name,
          amount: item.amount,
          unit: item.unit,
          source: "voice" as const,
        })),
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
      setIsOpen(false);
      setTranscript("");
      setInterimTranscript("");
      finalTranscriptRef.current = "";
    }
  }, [transcript, interimTranscript, onItemsParsed]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      setIsListening(false);
      setIsOpen(false);
      setTranscript("");
      setInterimTranscript("");
      finalTranscriptRef.current = "";
    }
  }, []);

  if (!isSupported) return null;

  const displayTranscript = transcript || interimTranscript;

  return (
    <>
      {/* Trigger button */}
      <Button
        onClick={startListening}
        disabled={isListening || isParsing}
        variant="outline"
        size="icon"
        className="shrink-0 border-border-light"
        title="Voice input — say multiple items at once"
      >
        {isParsing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>

      {/* Recording dialog */}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md rounded-sm border-border-light p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">Voice input</DialogTitle>

          <div className="flex flex-col items-center px-6 pt-8 pb-6">
            {isParsing ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4 py-8"
              >
                <Loader2 className="h-8 w-8 text-brand animate-spin" />
                <p className="text-sm font-medium text-text-secondary">
                  Adding items to your pantry...
                </p>
              </motion.div>
            ) : (
              <>
                {/* Prompt */}
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xs text-text-muted mb-6 text-center leading-relaxed"
                >
                  Say everything you bought — like &quot;two pounds of chicken,
                  a bag of spinach, yogurt, and a dozen eggs&quot;
                </motion.p>

                {/* Animated orb + ripples */}
                <RecordingAnimation />

                {/* Wave bars */}
                <AnimatePresence>{isListening && <WaveBars />}</AnimatePresence>

                {/* Live transcript */}
                <div className="mt-6 w-full text-center min-h-12">
                  {displayTranscript ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-text-primary leading-relaxed"
                    >
                      {transcript && (
                        <span className="font-medium">{transcript}</span>
                      )}
                      {interimTranscript && (
                        <span className="text-text-muted italic">
                          {transcript ? " " : ""}
                          {interimTranscript}
                        </span>
                      )}
                    </motion.p>
                  ) : (
                    <p className="text-sm text-text-muted animate-pulse">
                      Listening...
                    </p>
                  )}
                </div>

                {/* Done button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 w-full"
                >
                  <Button
                    onClick={stopAndProcess}
                    variant="brand"
                    disabled={!displayTranscript}
                    className="w-full rounded-sm"
                  >
                    Done — Add items
                  </Button>
                </motion.div>

                {/* Hint */}
                <p className="mt-3 text-[11px] text-text-muted">
                  Tap done when you&apos;ve finished speaking
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
