"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  SpeechRecognitionErrorEvent,
  SpeechRecognitionEvent,
  SpeechRecognitionInstance,
} from "./speech-types";

type VoiceCommands = {
  onNext: () => void;
  onPrev: () => void;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  onFinish: () => void;
  onGoToStep: (step: number) => void;
  onReadStep: () => void;
};

type UseVoiceCommandsOptions = {
  enabled: boolean;
};

type UseVoiceCommandsReturn = {
  isSupported: boolean;
  isListening: boolean;
  lastCommand: string | null;
  clearLastCommand: () => void;
};

// Command definitions with labels for UI feedback
const COMMAND_MAP: {
  keywords: string[];
  action: keyof VoiceCommands;
  label: string;
  arg?: "step";
}[] = [
  { keywords: ["next"], action: "onNext", label: "Next →" },
  {
    keywords: ["previous", "prev", "back"],
    action: "onPrev",
    label: "← Previous",
  },
  {
    keywords: ["start timer", "play timer"],
    action: "onStartTimer",
    label: "Timer started",
  },
  {
    keywords: ["pause timer", "stop timer"],
    action: "onPauseTimer",
    label: "Timer paused",
  },
  {
    keywords: ["reset timer"],
    action: "onResetTimer",
    label: "Timer reset",
  },
  {
    keywords: ["finish", "complete recipe"],
    action: "onFinish",
    label: "Finishing!",
  },
  {
    keywords: ["read", "read step", "what does it say"],
    action: "onReadStep",
    label: "Reading aloud",
  },
];

export function useVoiceCommands(
  commands: VoiceCommands,
  options: UseVoiceCommandsOptions,
): UseVoiceCommandsReturn {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldRestartRef = useRef(false);
  const commandsRef = useRef(commands);
  const backoffRef = useRef(300);
  const consecutiveErrorsRef = useRef(0);

  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const lastCommandTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);

  const clearLastCommand = useCallback(() => {
    setLastCommand(null);
    if (lastCommandTimerRef.current) {
      clearTimeout(lastCommandTimerRef.current);
      lastCommandTimerRef.current = null;
    }
  }, []);

  const showCommand = useCallback(
    (label: string) => {
      clearLastCommand();
      setLastCommand(label);
      lastCommandTimerRef.current = setTimeout(() => {
        setLastCommand(null);
      }, 2000);
    },
    [clearLastCommand],
  );

  const isSupported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!isSupported) return;

    if (!options.enabled) {
      shouldRestartRef.current = false;
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      backoffRef.current = 300;
      consecutiveErrorsRef.current = 0;

      setTimeout(() => {
        setIsListening(false);
      }, 0);

      return;
    }

    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();

    recognitionRef.current = recognition;
    shouldRestartRef.current = true;

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      // Reset backoff on successful start
      backoffRef.current = 300;
      consecutiveErrorsRef.current = 0;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript
        .trim()
        .toLowerCase();

      // Check step navigation first (has argument)
      const stepMatch = transcript.match(/step\s+(\d+)/);
      if (stepMatch) {
        const step = parseInt(stepMatch[1], 10) - 1;
        if (!Number.isNaN(step)) {
          commandsRef.current.onGoToStep(step);
          showCommand(`Go to step ${step + 1}`);
          return;
        }
      }

      // Check all other commands
      for (const cmd of COMMAND_MAP) {
        if (cmd.keywords.some((kw) => transcript.includes(kw))) {
          const fn = commandsRef.current[cmd.action];
          if (typeof fn === "function") {
            (fn as () => void)();
            showCommand(cmd.label);
            return;
          }
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const error = event.error;

      // Don't count "no-speech" as a real error — just means silence
      if (error === "no-speech") {
        return;
      }

      // "aborted" happens when we intentionally stop — ignore
      if (error === "aborted") {
        return;
      }

      consecutiveErrorsRef.current += 1;
      setIsListening(false);

      // After 5 consecutive real errors, stop trying
      if (consecutiveErrorsRef.current >= 5) {
        shouldRestartRef.current = false;
      }
    };

    recognition.onend = () => {
      setIsListening(false);

      if (!shouldRestartRef.current) return;

      // Exponential backoff: 300ms → 600ms → 1200ms → max 5000ms
      const delay = Math.min(backoffRef.current, 5000);
      backoffRef.current = delay * 2;

      window.setTimeout(() => {
        if (!shouldRestartRef.current) return;
        try {
          recognition.start();
        } catch {
          // browser blocked restart
        }
      }, delay);
    };

    try {
      recognition.start();
    } catch {
      setTimeout(() => {
        setIsListening(false);
      }, 0);
    }

    return () => {
      shouldRestartRef.current = false;

      setTimeout(() => {
        setIsListening(false);
      }, 0);

      recognition.stop();
      recognitionRef.current = null;
    };
  }, [options.enabled, isSupported, showCommand]);

  // Cleanup last command timer
  useEffect(() => {
    return () => {
      if (lastCommandTimerRef.current) {
        clearTimeout(lastCommandTimerRef.current);
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    lastCommand,
    clearLastCommand,
  };
}
