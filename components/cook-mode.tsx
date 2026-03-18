"use client";

import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  startCookSession,
  updateCookSession,
} from "@/app/dashboard/recipes/[id]/cook/actions";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Check,
  Clock,
  UtensilsCrossed,
  Minus,
  Plus,
  PartyPopper,
  Mic,
  MicOff,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { convertAmount } from "@/lib/convert-units";
import { usePreferences } from "@/lib/preferences-context";
import { useVoiceCommands } from "@/lib/use-voice-commands";
import { toast } from "sonner";

// ============================================
// TYPES
// ============================================

interface CookModeProps {
  recipe: {
    id: string;
    title: string;
    servings: number | null;
    totalTime: number | null;
    imageUrl: string | null;
  };
  ingredients: {
    id: number;
    ingredient: string;
    amount: string | null;
    order: number;
  }[];
  instructions: {
    id: number;
    step: string;
    order: number;
  }[];
}

interface TimerState {
  stepIndex: number;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
}

// ============================================
// HELPERS
// ============================================

function parseTimerFromStep(step: string): number | null {
  const patterns = [
    /for\s+(\d+)\s*(?:to\s+\d+\s+)?minute/i,
    /for\s+(\d+)\s*(?:to\s+\d+\s+)?hour/i,
    /(\d+)\s*(?:-\s*\d+\s+)?min(?:ute)?s?\b/i,
    /(\d+)\s*(?:-\s*\d+\s+)?hours?\b/i,
    /(\d+)\s*-\s*\d+\s*min/i,
    /(\d+)\s*seconds?\b/i,
  ];

  for (const pattern of patterns) {
    const match = step.match(pattern);
    if (match) {
      const value = parseInt(match[1], 10);
      if (pattern.source.includes("hour")) return value * 3600;
      if (pattern.source.includes("second")) return value;
      return value * 60;
    }
  }
  return null;
}

function scaleAmount(amount: string | null, multiplier: number): string {
  if (!amount) return "";
  return amount.replace(/(\d+\.?\d*)/g, (match) => {
    const scaled = parseFloat(match) * multiplier;
    return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
  });
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function playTimerAlert() {
  try {
    const ctx = new AudioContext();
    const playBeep = (time: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
      osc.start(time);
      osc.stop(time + 0.3);
    };
    playBeep(ctx.currentTime, 660);
    playBeep(ctx.currentTime + 0.35, 880);
    playBeep(ctx.currentTime + 0.7, 1100);
  } catch {
    // Audio not supported
  }
}

// ============================================
// CONFETTI DATA (deterministic, module-level)
// ============================================

const CONFETTI_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  color: ["#FF6B35", "#F7B801", "#22c55e", "#3b82f6", "#ec4899"][i % 5],
  left: `${10 + ((i * 37 + 13) % 80)}%`,
  yEnd: `${60 + ((i * 23 + 7) % 40)}vh`,
  xDrift: ((i * 31 + 11) % 200) - 100,
  rotation: (i * 47 + 3) % 720,
  duration: 2 + ((i * 19 + 5) % 20) / 10,
  delay: ((i * 13 + 2) % 8) / 10,
}));

// ============================================
// VOICE COMMAND HINTS (one-time dismissable)
// ============================================

const VOICE_HINTS = [
  { cmd: '"Next"', desc: "Go to next step" },
  { cmd: '"Previous"', desc: "Go back" },
  { cmd: '"Start timer"', desc: "Start the timer" },
  { cmd: '"Pause timer"', desc: "Pause the timer" },
  { cmd: '"Read"', desc: "Read step aloud" },
  { cmd: '"Step 3"', desc: "Jump to step" },
];

// ============================================
// MIC INDICATOR BUTTON
// ============================================

function MicIndicator({
  isListening,
  isSupported,
  voiceEnabled,
  onToggle,
}: {
  isListening: boolean;
  isSupported: boolean;
  voiceEnabled: boolean;
  onToggle: () => void;
}) {
  if (!isSupported) return null;

  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative flex items-center justify-center w-10 h-10 rounded-full transition-all cursor-pointer active:scale-90",
        voiceEnabled
          ? isListening
            ? "bg-brand/10 text-brand"
            : "bg-amber-100 text-amber-500"
          : "bg-gray-100 text-text-muted",
      )}
    >
      {voiceEnabled ? (
        <Mic className="w-4.5 h-4.5" />
      ) : (
        <MicOff className="w-4.5 h-4.5" />
      )}

      {/* Pulsing ring when actively listening */}
      {voiceEnabled && isListening && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-brand"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Small status dot */}
      <span
        className={cn(
          "absolute top-0.5 right-0.5 w-2 h-2 rounded-full border border-white",
          voiceEnabled
            ? isListening
              ? "bg-green-500"
              : "bg-amber-400"
            : "bg-gray-300",
        )}
      />
    </button>
  );
}

// ============================================
// TIMER RING COMPONENT
// ============================================

function TimerRing({
  timer,
  onToggle,
  onReset,
}: {
  timer: TimerState;
  onToggle: () => void;
  onReset: () => void;
}) {
  const progress =
    timer.totalSeconds > 0
      ? (timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds
      : 0;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - progress);
  const isComplete = timer.remainingSeconds <= 0;
  const isUrgent = timer.remainingSeconds <= 30 && timer.remainingSeconds > 0;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center gap-3"
    >
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="rgba(255, 107, 53, 0.15)"
            strokeWidth="6"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={isComplete ? "#22c55e" : isUrgent ? "#f59e0b" : "#FF6B35"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: "linear" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={timer.remainingSeconds}
            className={cn(
              "text-2xl font-bold tabular-nums",
              isComplete
                ? "text-green-500"
                : isUrgent
                  ? "text-amber-500"
                  : "text-text-primary",
            )}
          >
            {isComplete ? "Done!" : formatTime(timer.remainingSeconds)}
          </motion.span>
        </div>

        {isUrgent && timer.isRunning && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-amber-400"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-all cursor-pointer",
            "active:scale-95",
            isComplete
              ? "bg-green-500/10 text-green-600"
              : timer.isRunning
                ? "bg-brand-100 text-brand"
                : "bg-brand text-white",
          )}
        >
          {isComplete ? (
            <Check className="w-4 h-4" />
          ) : timer.isRunning ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={onReset}
          className="p-2 rounded-sm cursor-pointer text-text-secondary hover:bg-brand-100 transition-colors active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================
// FLOATING TIMER PANEL
// ============================================

function FloatingTimerPanel({
  timers,
  currentStep,
  onGoToStep,
  onToggle,
}: {
  timers: Map<number, TimerState>;
  currentStep: number;
  onGoToStep: (idx: number) => void;
  onToggle: (idx: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const activeTimers = Array.from(timers.entries()).filter(
    ([, t]) => t.isRunning || t.remainingSeconds <= 0,
  );

  if (activeTimers.length === 0) return null;

  return (
    <>
      {/* Timer button — relative wrapper so badge is positioned correctly */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "relative flex items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 hover:bg-brand-600 transition cursor-pointer",
          isMobile ? "w-12 h-12" : "fixed bottom-6 right-6 z-50 w-14 h-14",
        )}
      >
        <Clock className="w-5 h-5" />

        {/* Badge — relative to the button */}
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
          {activeTimers.length}
        </span>
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white rounded-t-lg sm:rounded-sm w-full sm:w-96 max-h-[60vh] overflow-hidden shadow-xl border border-border-light"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
                <span className="text-sm font-semibold text-text-primary">
                  Active Timers
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 cursor-pointer text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
                {activeTimers.map(([stepIndex, timer]) => {
                  const isComplete = timer.remainingSeconds <= 0;
                  const isUrgent =
                    timer.remainingSeconds <= 30 && timer.remainingSeconds > 0;
                  const isCurrent = stepIndex === currentStep;

                  return (
                    <div
                      key={stepIndex}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        onGoToStep(stepIndex);
                        setOpen(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          onGoToStep(stepIndex);
                          setOpen(false);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-sm text-left transition cursor-pointer select-none",
                        isCurrent
                          ? "bg-brand-100 border border-brand-300"
                          : "hover:bg-brand-50",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-sm flex items-center justify-center text-xs font-bold shrink-0",
                            isComplete
                              ? "bg-green-500 text-white"
                              : "bg-brand text-white",
                          )}
                        >
                          {stepIndex + 1}
                        </div>
                        <span className="text-sm text-text-primary">
                          Step {stepIndex + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-bold tabular-nums",
                            isComplete
                              ? "text-green-500"
                              : isUrgent
                                ? "text-amber-500"
                                : "text-text-primary",
                          )}
                        >
                          {isComplete
                            ? "Done!"
                            : formatTime(timer.remainingSeconds)}
                        </span>

                        {!isComplete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggle(stepIndex);
                            }}
                            className="p-1 rounded-sm hover:bg-brand-200"
                          >
                            {timer.isRunning ? (
                              <Pause className="w-3.5 h-3.5 text-brand" />
                            ) : (
                              <Play className="w-3.5 h-3.5 text-brand" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================
// COMPLETION SCREEN
// ============================================

function CompletionScreen({
  recipeName,
  recipeId,
}: {
  recipeName: string;
  recipeId: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-linear-to-br from-brand-50 via-white to-brand-100"
    >
      {CONFETTI_PARTICLES.map((c, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{ background: c.color, left: c.left, top: "-5%" }}
          animate={{
            y: ["0vh", c.yEnd],
            x: [0, c.xDrift],
            rotate: [0, c.rotation],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            ease: "easeOut",
          }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.5, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 15, delay: 0.2 }}
        className="text-center px-8"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="inline-block mb-6"
        >
          <div className="w-24 h-24 rounded-sm bg-linear-to-br from-brand to-brand-600 flex items-center justify-center shadow-brand">
            <PartyPopper className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold text-text-primary mb-2"
        >
          Bon Appétit!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-text-secondary mb-8 text-lg"
        >
          {recipeName} is ready to serve
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col gap-3"
        >
          <Link
            href={`/dashboard/recipes/${recipeId}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand text-white rounded-sm font-medium hover:bg-brand-600 transition-colors active:scale-95"
          >
            Back to Recipe
          </Link>
          <Link
            href="/dashboard/recipes"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-text-secondary hover:text-text-primary transition-colors"
          >
            All Recipes
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// PRE-COOK OVERVIEW SCREEN
// ============================================

function PreCookOverview({
  recipe,
  ingredients,
  instructions,
  onStart,
}: CookModeProps & { onStart: () => void }) {
  const timerSteps = instructions.filter((inst) =>
    parseTimerFromStep(inst.step),
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="relative w-full max-w-xl bg-white rounded-md shadow-xl border border-border-light overflow-hidden"
      >
        <Link
          href={`/dashboard/recipes/${recipe.id}`}
          className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary"
        >
          <X className="w-5 h-5" />
        </Link>

        <div className="px-6 pt-8 pb-6 text-center border-b border-border-light">
          <div className="w-14 h-14 mx-auto rounded-md bg-linear-to-br from-brand to-brand-600 flex items-center justify-center mb-4">
            <UtensilsCrossed className="w-7 h-7 text-white" />
          </div>

          <h1 className="text-xl font-bold text-text-primary mb-2">
            {recipe.title}
          </h1>

          <div className="flex items-center justify-center gap-4 text-sm text-text-secondary">
            {recipe.totalTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {recipe.totalTime} min
              </span>
            )}
            <span>{instructions.length} steps</span>
            <span>{ingredients.length} ingredients</span>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-brand" />
              Ingredients to prepare
            </h2>
            <div className="grid grid-cols-[110px_1fr] gap-y-2 text-sm pl-6">
              {ingredients.map((ing) => (
                <Fragment key={ing.id}>
                  <span className="font-semibold text-brand tabular-nums">
                    {ing.amount}
                  </span>
                  <span className="text-text-primary">{ing.ingredient}</span>
                </Fragment>
              ))}
            </div>
          </div>

          {timerSteps.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand" />
                Timed steps
              </h2>
              <div className="space-y-2 pl-6">
                {timerSteps.map((inst) => {
                  const seconds = parseTimerFromStep(inst.step);
                  return (
                    <div
                      key={inst.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="text-xs font-semibold text-brand bg-brand-100 px-2 py-0.5 rounded-sm">
                        {seconds ? formatTime(seconds) : ""}
                      </span>
                      <span className="text-text-secondary line-clamp-1">
                        {inst.step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border-light flex justify-end">
          <motion.button
            onClick={onStart}
            whileTap={{ scale: 0.97 }}
            className="px-6 py-2.5 bg-brand text-white rounded-sm w-full md:w-auto font-semibold hover:bg-brand-600 transition-colors shadow-brand cursor-pointer"
          >
            Start Cooking
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// MAIN COOK MODE COMPONENT
// ============================================

export function CookMode({ recipe, ingredients, instructions }: CookModeProps) {
  const { defaultServings, timeFormat, measurementUnit } = usePreferences();
  const [currentStep, setCurrentStep] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(
    new Set(),
  );
  const [timers, setTimers] = useState<Map<number, TimerState>>(() => {
    const detected = new Map<number, TimerState>();
    instructions.forEach((inst, idx) => {
      const seconds = parseTimerFromStep(inst.step);
      if (seconds) {
        detected.set(idx, {
          stepIndex: idx,
          totalSeconds: seconds,
          remainingSeconds: seconds,
          isRunning: false,
        });
      }
    });
    return detected;
  });
  const [isComplete, setIsComplete] = useState(false);
  const [direction, setDirection] = useState(0);
  const [showIngredients, setShowIngredients] = useState(true);
  const [isReading, setIsReading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const intervalRefs = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const currentStepRef = useRef(currentStep);
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    currentStepRef.current = currentStep;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsReading(false);
    }
  }, [currentStep]);

  useEffect(() => {
    if (sessionIdRef.current) {
      updateCookSession(sessionIdRef.current, {
        lastStepReached: currentStep,
      }).catch(() => {});
    }
  }, [currentStep]);

  const totalSteps = instructions.length;
  const baseServings = recipe.servings || defaultServings;
  const [currentServings, setCurrentServings] = useState(baseServings);
  const servingMultiplier = currentServings / baseServings;

  // ---- WAKE LOCK ----
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Wake lock request failed
      }
    }

    requestWakeLock();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") requestWakeLock();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      wakeLock?.release();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // ---- TRACK ABANDONED SESSION ----
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionIdRef.current && !isComplete && hasStarted) {
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        navigator.sendBeacon(
          "/api/cook-session-abandon",
          JSON.stringify({
            sessionId: sessionIdRef.current,
            lastStepReached: currentStepRef.current,
            durationSeconds: duration,
          }),
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isComplete, hasStarted]);

  // ---- TIMER TICK ----
  useEffect(() => {
    timers.forEach((timer, stepIndex) => {
      const existing = intervalRefs.current.get(stepIndex);

      if (timer.isRunning && !existing) {
        const interval = setInterval(() => {
          setTimers((prev) => {
            const next = new Map(prev);
            const t = next.get(stepIndex);
            if (t && t.remainingSeconds > 0) {
              next.set(stepIndex, {
                ...t,
                remainingSeconds: t.remainingSeconds - 1,
              });
            } else if (t && t.remainingSeconds <= 0) {
              next.set(stepIndex, { ...t, isRunning: false });
              clearInterval(intervalRefs.current.get(stepIndex));
              intervalRefs.current.delete(stepIndex);
              playTimerAlert();
              if (
                autoAdvance &&
                stepIndex === currentStep &&
                currentStep < totalSteps - 1
              ) {
                setTimeout(() => {
                  setDirection(1);
                  setCurrentStep((s) => s + 1);
                }, 1500);
              }
            }
            return next;
          });
        }, 1000);
        intervalRefs.current.set(stepIndex, interval);
      } else if (!timer.isRunning && existing) {
        clearInterval(existing);
        intervalRefs.current.delete(stepIndex);
      }
    });
  }, [timers, autoAdvance, currentStep, totalSteps]);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      intervalRefs.current.forEach((interval) => clearInterval(interval));
    };
  }, []);

  // ---- NAVIGATION ----
  const goNext = useCallback(() => {
    setCurrentStep((s) => {
      if (s < totalSteps - 1) {
        setDirection(1);
        return s + 1;
      }
      return s;
    });
    if (currentStepRef.current >= totalSteps - 1) {
      setIsComplete(true);
    }
  }, [totalSteps]);

  const goPrev = useCallback(() => {
    setCurrentStep((s) => {
      if (s > 0) {
        setDirection(-1);
        return s - 1;
      }
      return s;
    });
  }, []);

  const goToStep = useCallback((idx: number) => {
    setCurrentStep((s) => {
      setDirection(idx > s ? 1 : -1);
      return idx;
    });
  }, []);

  // ---- KEYBOARD NAV ----
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  // ---- SWIPE ----
  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const threshold = 50;
    if (info.offset.x < -threshold) goNext();
    else if (info.offset.x > threshold) goPrev();
  };

  // ---- INGREDIENT TOGGLE ----
  const toggleIngredient = (id: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ---- TIMER CONTROLS ----
  const toggleTimer = useCallback((stepIndex: number) => {
    setTimers((prev) => {
      const next = new Map(prev);
      const t = next.get(stepIndex);
      if (t) {
        if (t.remainingSeconds <= 0) return next;
        next.set(stepIndex, { ...t, isRunning: !t.isRunning });
      }
      return next;
    });
  }, []);

  const resetTimer = useCallback((stepIndex: number) => {
    setTimers((prev) => {
      const next = new Map(prev);
      const t = next.get(stepIndex);
      if (t) {
        next.set(stepIndex, {
          ...t,
          remainingSeconds: t.totalSeconds,
          isRunning: false,
        });
      }
      return next;
    });
  }, []);

  // ---- SERVING CONTROLS ----
  const adjustServings = (delta: number) => {
    setCurrentServings((prev) => Math.max(1, prev + delta));
  };

  // ---- READ STEP ALOUD ----
  const readCurrentStep = useCallback(() => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const instruction = instructions[currentStepRef.current];
    if (!instruction) return;

    const utterance = new SpeechSynthesisUtterance(instruction.step);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.lang = "en-US";

    utterance.onstart = () => setIsReading(true);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);

    window.speechSynthesis.speak(utterance);
  }, [instructions]);

  // ---- VOICE COMMANDS ----
  const { isSupported, isListening, lastCommand } = useVoiceCommands(
    {
      onNext: goNext,
      onPrev: goPrev,
      onStartTimer: () => toggleTimer(currentStep),
      onPauseTimer: () => toggleTimer(currentStep),
      onResetTimer: () => resetTimer(currentStep),
      onFinish: () => setIsComplete(true),
      onGoToStep: (step) => {
        if (step >= 0 && step < totalSteps) {
          goToStep(step);
        }
      },
      onReadStep: readCurrentStep,
    },
    {
      enabled: hasStarted && !isComplete && voiceEnabled,
    },
  );

  // ---- SONNER TOAST FOR VOICE COMMANDS ----
  useEffect(() => {
    if (lastCommand) {
      toast(lastCommand, {
        duration: 1200,
        className:
          "!bg-white !text-text-primary !border !border-border-light !rounded-sm !shadow-md !px-3 !py-1.5 !w-auto !max-w-fit",
      });
    }
  }, [lastCommand]);

  const handleStartCooking = useCallback(async () => {
    setHasStarted(true);
    startTimeRef.current = Date.now();
    try {
      const id = await startCookSession(
        recipe.id,
        instructions.length,
        currentServings,
      );
      sessionIdRef.current = id;
    } catch {
      // Don't block cooking if tracking fails
    }
  }, [recipe.id, instructions.length, currentServings]);

  // ---- TRACK COMPLETION ----
  useEffect(() => {
    if (isComplete && sessionIdRef.current) {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      updateCookSession(sessionIdRef.current, {
        status: "completed",
        lastStepReached: totalSteps - 1,
        durationSeconds: duration,
      }).catch(() => {});
    }
  }, [isComplete, totalSteps]);

  if (!hasStarted) {
    return (
      <PreCookOverview
        recipe={recipe}
        ingredients={ingredients}
        instructions={instructions}
        onStart={handleStartCooking}
      />
    );
  }

  if (isComplete) {
    return <CompletionScreen recipeName={recipe.title} recipeId={recipe.id} />;
  }

  const currentInstruction =
    instructions[currentStep] ?? instructions[instructions.length - 1];
  const currentTimer = timers.get(currentStep);
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const stepVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-50 flex flex-col overflow-hidden">
      {/* ═══════════════ TOP BAR ═══════════════ */}
      <div className="shrink-0 bg-white/80 backdrop-blur-sm border-b border-brand-200">
        <div className="h-1 bg-brand-200">
          <motion.div
            className="h-full bg-linear-to-r from-brand to-brand-600"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/recipes/${recipe.id}`}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors active:scale-95"
            >
              <X className="w-5 h-5" />
            </Link>

            {/* Mic indicator in top bar */}
            <MicIndicator
              isListening={isListening}
              isSupported={isSupported}
              voiceEnabled={voiceEnabled}
              onToggle={() => setVoiceEnabled((v) => !v)}
            />
          </div>

          <div className="flex flex-col items-center">
            <h1 className="text-sm font-semibold text-text-primary line-clamp-1 max-w-50 sm:max-w-xs">
              {recipe.title}
            </h1>
            <span className="text-xs text-text-secondary">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => adjustServings(-1)}
              className="w-7 h-7 flex items-center cursor-pointer justify-center rounded-sm bg-brand-100 text-brand hover:bg-brand-200 transition-colors active:scale-90"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-semibold text-text-primary w-16 text-center tabular-nums">
              {currentServings} {currentServings === 1 ? "serving" : "servings"}
            </span>
            <button
              onClick={() => adjustServings(1)}
              className="w-7 h-7 flex items-center cursor-pointer justify-center rounded-sm bg-brand-100 text-brand hover:bg-brand-200 transition-colors active:scale-90"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* ---- INGREDIENTS PANEL ---- */}
        <button
          onClick={() => setShowIngredients(!showIngredients)}
          className="lg:hidden w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-text-primary bg-white/80 border-b border-brand-200 shrink-0"
        >
          <span className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-brand" />
            Ingredients
            <span className="text-xs text-text-secondary">
              ({checkedIngredients.size}/{ingredients.length})
            </span>
          </span>
          <motion.span
            animate={{ rotate: showIngredients ? 180 : 0 }}
            className="text-text-secondary"
          >
            ▾
          </motion.span>
        </button>

        <div
          className={cn(
            "scrollbar-bite bg-white/60 backdrop-blur-sm border-b lg:border-b-0 lg:border-r border-brand-200 overflow-y-auto transition-all duration-300",
            "lg:w-80 xl:w-96 shrink-0",
            showIngredients
              ? "max-h-52 lg:max-h-none"
              : "max-h-0 overflow-hidden lg:max-h-none",
          )}
        >
          <div className="hidden lg:flex items-center gap-2 px-5 pt-5 pb-3">
            <UtensilsCrossed className="w-4 h-4 text-brand" />
            <h2 className="text-sm font-semibold text-text-primary">
              Ingredients
            </h2>
            <span className="text-xs text-text-secondary ml-auto">
              {checkedIngredients.size}/{ingredients.length}
            </span>
          </div>

          <div className="px-4 lg:px-5 py-2 lg:py-0 space-y-1">
            {ingredients.map((ing) => {
              const checked = checkedIngredients.has(ing.id);
              return (
                <motion.button
                  key={ing.id}
                  onClick={() => toggleIngredient(ing.id)}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2.5 rounded-sm text-left transition-all",
                    checked
                      ? "bg-brand/5 opacity-60"
                      : "hover:bg-brand-100/50 active:bg-brand-100",
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-sm border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer",
                      checked ? "bg-brand border-brand" : "border-brand-400",
                    )}
                  >
                    <AnimatePresence>
                      {checked && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        "text-sm transition-all",
                        checked
                          ? "line-through text-text-muted"
                          : "text-text-primary",
                      )}
                    >
                      {ing.amount && (
                        <span className="font-semibold">
                          {convertAmount(
                            scaleAmount(ing.amount, servingMultiplier),
                            measurementUnit as "imperial" | "metric",
                          )}
                        </span>
                      )}
                      {ing.ingredient}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ---- STEP CONTENT (scrollable) ---- */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-bite">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-6 flex-wrap justify-center max-w-xs">
                {instructions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToStep(idx)}
                    className={cn(
                      "rounded-full transition-all duration-300 active:scale-90",
                      idx === currentStep
                        ? "w-8 h-2.5 bg-brand"
                        : idx < currentStep
                          ? "w-2.5 h-2.5 bg-brand/40"
                          : "w-2.5 h-2.5 bg-brand-300",
                    )}
                  />
                ))}
              </div>

              <div className="w-full max-w-2xl relative">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      duration: 0.3,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    className="w-full cursor-grab active:cursor-grabbing"
                  >
                    <div className="relative">
                      <div className="bg-white/80 backdrop-blur-sm rounded-sm border border-brand-200 shadow-brand-sm p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-10 h-10 rounded-sm bg-linear-to-br from-brand to-brand-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-bold">
                              {currentStep + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={readCurrentStep}
                              className={cn(
                                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-sm transition-colors cursor-pointer",
                                isReading
                                  ? "bg-brand text-white"
                                  : "bg-brand-100 text-brand hover:bg-brand-200",
                              )}
                            >
                              {isReading ? "Reading..." : "Read"}
                            </button>
                            {currentTimer && (
                              <span className="flex items-center gap-1 text-xs font-medium text-brand bg-brand-100 px-2 py-1 rounded-sm">
                                <Clock className="w-3 h-3" />
                                {formatTime(currentTimer.totalSeconds)}
                              </span>
                            )}
                          </div>
                        </div>

                        <p
                          className={cn(
                            "text-lg sm:text-xl leading-relaxed font-medium transition-colors duration-300",
                            isReading ? "text-brand" : "text-text-primary",
                          )}
                        >
                          {currentInstruction?.step}
                        </p>

                        {currentTimer && (
                          <button
                            onClick={() => setAutoAdvance(!autoAdvance)}
                            className={cn(
                              "mt-4 flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer",
                              autoAdvance ? "text-brand" : "text-text-muted",
                            )}
                          >
                            <div
                              className={cn(
                                "w-8 h-4.5 rounded-full transition-colors relative",
                                autoAdvance ? "bg-brand" : "bg-brand-300",
                              )}
                            >
                              <motion.div
                                className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm"
                                animate={{ left: autoAdvance ? 16 : 2 }}
                                transition={{ duration: 0.2 }}
                              />
                            </div>
                            Auto-advance when timer ends
                          </button>
                        )}

                        {currentTimer && (
                          <div className="mt-8 flex justify-center">
                            <TimerRing
                              timer={currentTimer}
                              onToggle={() => toggleTimer(currentStep)}
                              onReset={() => resetTimer(currentStep)}
                            />
                          </div>
                        )}

                        {/* Voice hint */}
                        {isSupported && voiceEnabled && (
                          <div className="mt-6 flex items-center gap-2 text-[11px] text-text-muted bg-brand-50 border border-brand-200 rounded-sm px-2.5 py-1.5 w-fit">
                            <Mic className="w-3 h-3 text-brand" />
                            <span>
                              Try saying{" "}
                              <span className="font-semibold text-brand">
                                &quot;Next&quot;
                              </span>
                              ,{" "}
                              <span className="font-semibold text-brand">
                                &quot;Previous&quot;
                              </span>
                              , or{" "}
                              <span className="font-semibold text-brand">
                                &quot;Start timer&quot;
                              </span>
                              , or{" "}
                              <span className="font-semibold text-brand">
                                &quot;Finish&quot;
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-center text-xs text-text-muted mt-4 select-none">
                      Swipe or tap arrows to navigate
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ---- NAV BUTTONS (pinned at bottom, always visible) ---- */}
          <div className="shrink-0 bg-white/80 backdrop-blur-sm border-t border-brand-200 px-4 py-3">
            <div className="flex items-center justify-between w-full max-w-2xl mx-auto gap-4">
              {/* LEFT: nav arrows */}
              <div className="flex items-center gap-4">
                <button
                  onClick={goPrev}
                  disabled={currentStep === 0}
                  className={cn(
                    "flex items-center gap-2 px-4 sm:px-6 py-4 rounded-sm font-medium text-sm transition-all active:scale-95 cursor-pointer",
                    currentStep === 0
                      ? "opacity-30 cursor-not-allowed text-text-muted"
                      : "bg-white/80 text-text-primary hover:bg-white border border-brand-200 shadow-brand-xs",
                  )}
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <button
                  onClick={goNext}
                  className={cn(
                    "flex items-center gap-2 px-6 sm:px-8 py-4 rounded-sm font-medium text-sm transition-all active:scale-95 cursor-pointer",
                    currentStep === totalSteps - 1
                      ? "bg-linear-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20"
                      : "bg-brand text-white hover:bg-brand-600 shadow-brand",
                  )}
                >
                  <span className="hidden sm:inline">
                    {currentStep === totalSteps - 1 ? "Finish!" : "Next"}
                  </span>
                  {currentStep === totalSteps - 1 ? (
                    <PartyPopper className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* RIGHT: floating timer button on mobile */}
              <div className="sm:hidden">
                <FloatingTimerPanel
                  timers={timers}
                  currentStep={currentStep}
                  onGoToStep={goToStep}
                  onToggle={toggleTimer}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent timer bar (desktop) */}
      <div className="hidden sm:block">
        <FloatingTimerPanel
          timers={timers}
          currentStep={currentStep}
          onGoToStep={goToStep}
          onToggle={toggleTimer}
        />
      </div>
    </div>
  );
}
