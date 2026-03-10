"use client";

import { useEffect, useRef, useState } from "react";

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

type UseVoiceCommandsOptions = {
  enabled: boolean;
};

type UseVoiceCommandsReturn = {
  isSupported: boolean;
  isListening: boolean;
};

export function useVoiceCommands(
  commands: VoiceCommands,
  options: UseVoiceCommandsOptions,
): UseVoiceCommandsReturn {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldRestartRef = useRef(false);
  const commandsRef = useRef(commands);

  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);

  const isSupported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!isSupported) return;

    if (!options.enabled) {
      shouldRestartRef.current = false;
      recognitionRef.current?.stop();
      recognitionRef.current = null;

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
      console.log("Voice recognition started");
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript
        .trim()
        .toLowerCase();

      console.log("Voice command:", transcript);

      if (transcript.includes("next")) {
        commandsRef.current.onNext();
        return;
      }

      if (
        transcript.includes("previous") ||
        transcript.includes("prev") ||
        transcript.includes("back")
      ) {
        commandsRef.current.onPrev();
        return;
      }

      if (
        transcript.includes("start timer") ||
        transcript.includes("play timer")
      ) {
        commandsRef.current.onStartTimer();
        return;
      }

      if (
        transcript.includes("pause timer") ||
        transcript.includes("stop timer")
      ) {
        commandsRef.current.onPauseTimer();
        return;
      }

      if (transcript.includes("reset timer")) {
        commandsRef.current.onResetTimer();
        return;
      }

      if (
        transcript.includes("finish") ||
        transcript.includes("complete recipe")
      ) {
        commandsRef.current.onFinish();
        return;
      }

      if (
        transcript.includes("read") ||
        transcript.includes("read step") ||
        transcript.includes("what does it say")
      ) {
        commandsRef.current.onReadStep();
        return;
      }

      const stepMatch = transcript.match(/step\s+(\d+)/);

      if (stepMatch) {
        const step = parseInt(stepMatch[1], 10) - 1;

        if (!Number.isNaN(step)) {
          commandsRef.current.onGoToStep(step);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);

      if (!shouldRestartRef.current) return;

      window.setTimeout(() => {
        try {
          recognition.start();
        } catch {
          // browser blocked restart
        }
      }, 300);
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
  }, [options.enabled, isSupported]);

  return {
    isSupported,
    isListening,
  };
}
