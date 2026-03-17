"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ReactNode } from "react";
import Image from "next/image";

// ─── SHARED SECTION WRAPPER ───────────────────────────────────────────────────

function Section({
  eyebrow,
  headline,
  accent,
  body,
  reverse,
  children,
}: {
  eyebrow: string;
  headline: string;
  accent?: string;
  body: string;
  reverse?: boolean;
  children: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55 }}
      className="grid md:grid-cols-2 gap-10 md:gap-16 py-16 md:py-20 border-t border-border-light items-center"
    >
      {/* Text */}
      <div className={reverse ? "md:order-2" : ""}>
        <p className="text-xs uppercase tracking-widest text-text-muted font-medium mb-4">
          {eyebrow}
        </p>
        <h3 className="font-extrabold text-3xl md:text-4xl tracking-tight leading-[1.1] mb-4">
          {headline} {accent && <span className="text-brand">{accent}</span>}
        </h3>
        <p className="text-text-secondary leading-relaxed text-sm md:text-base">
          {body}
        </p>
      </div>

      {/* Visual */}
      <div className={reverse ? "md:order-1" : ""}>{children}</div>
    </motion.section>
  );
}

// ─── 1. SOURCE GRID ───────────────────────────────────────────────────────────

const SOURCES = [
  { label: "TikTok", sub: "AI Vision", icon: "🎵" },
  { label: "YouTube", sub: "Data API v3", icon: "▶" },
  { label: "Instagram", sub: "Screenshot + Gemini", icon: "📸" },
  { label: "AllRecipes", sub: "JSON-LD schema", icon: "🌐" },
  { label: "NYT Cooking", sub: "JSON-LD schema", icon: "🌐" },
  { label: "Food Network", sub: "JSON-LD schema", icon: "🌐" },
  { label: "Bon Appétit", sub: "JSON-LD schema", icon: "🌐" },
  { label: "100+ sites", sub: "schema.org/Recipe", icon: "✦" },
];

function SourceGrid() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SOURCES.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.04 }}
          className="flex items-center gap-3 px-3 py-3 bg-surface-2 border border-border-light rounded-sm"
        >
          <span className="text-base shrink-0 w-5 text-center">{s.icon}</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-text-primary truncate">
              {s.label}
            </p>
            <p className="text-[10px] text-text-muted truncate">{s.sub}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── 2. GEMINI PIPELINE ───────────────────────────────────────────────────────

const PIPELINE = [
  { label: "Input", val: "TikTok video URL", accent: false },
  {
    label: "Step 1",
    val: "Fetch transcript → YouTube Data API v3",
    accent: false,
  },
  { label: "Step 2", val: "Send to Gemini 2.5 Flash", accent: false },
  { label: "Step 3", val: "Parse structured JSON response", accent: false },
  {
    label: "Output",
    val: "12 ingredients · 8 steps · nutrition",
    accent: true,
  },
];

// Timing: each step activates after a delay
const STEP_DELAY = 600; // ms between each step lighting up
const CONNECTOR_DURATION = 400; // ms for the line to draw

function GeminiPipeline() {
  const [activeStep, setActiveStep] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView) return;

    // Cascade through steps: step lights up, then connector draws, then next step
    let i = -1;
    const tick = () => {
      i++;
      setActiveStep(i);
      if (i < PIPELINE.length - 1) {
        setTimeout(tick, STEP_DELAY + CONNECTOR_DURATION);
      }
    };
    // Start after a small initial delay
    setTimeout(tick, 400);
  }, [inView]);

  return (
    <div ref={ref} className="flex flex-col">
      {PIPELINE.map((row, i) => (
        <div key={row.label}>
          {/* Step row */}
          <motion.div
            initial={{ opacity: 0.35 }}
            animate={activeStep >= i ? { opacity: 1 } : { opacity: 0.35 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative"
          >
            <div
              className={`
                flex items-center gap-3 px-4 py-3 rounded-sm border font-mono text-xs
                transition-all duration-300
                ${
                  row.accent && activeStep >= i
                    ? "bg-brand/8 border-brand/25 text-brand font-semibold"
                    : activeStep >= i
                      ? "bg-surface-2 border-border-light text-text-secondary"
                      : "bg-surface-2 border-border-light text-text-muted"
                }
              `}
            >
              <span className="text-text-muted w-12 shrink-0">{row.label}</span>
              <span className="w-px h-3 bg-border-subtle shrink-0" />
              <span className="truncate">{row.val}</span>
            </div>

            {/* Glow effect when step activates */}
            {activeStep === i && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`absolute inset-0 rounded-sm pointer-events-none ${
                  row.accent
                    ? "shadow-[inset_0_0_20px_rgba(255,107,53,0.15),0_0_20px_rgba(255,107,53,0.1)]"
                    : "shadow-[inset_0_0_16px_rgba(255,107,53,0.08),0_0_16px_rgba(255,107,53,0.06)]"
                }`}
              />
            )}
          </motion.div>

          {/* Dotted connector between steps */}
          {i < PIPELINE.length - 1 && (
            <div className="flex justify-center">
              <div className="relative h-3 flex items-center justify-center">
                {/* Dotted track */}
                <svg width="2" height="12" className="absolute">
                  <line
                    x1="1"
                    y1="0"
                    x2="1"
                    y2="12"
                    stroke="var(--color-border-light, #E5E2DD)"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                </svg>
                {/* Animated orange dotted overlay */}
                <motion.svg
                  width="2"
                  height="12"
                  className="absolute"
                  initial={{ clipPath: "inset(0 0 100% 0)" }}
                  animate={
                    activeStep > i
                      ? { clipPath: "inset(0 0 0% 0)" }
                      : { clipPath: "inset(0 0 100% 0)" }
                  }
                  transition={{
                    duration: CONNECTOR_DURATION / 1000,
                    ease: "easeOut",
                    delay: 0.1,
                  }}
                >
                  <line
                    x1="1"
                    y1="0"
                    x2="1"
                    y2="12"
                    stroke="#FF6B35"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                </motion.svg>
                {/* Traveling dot */}
                {activeStep === i + 1 && (
                  <motion.div
                    initial={{ top: 0, opacity: 0 }}
                    animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
                    transition={{
                      duration: CONNECTOR_DURATION / 1000,
                      ease: "easeOut",
                    }}
                    className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── 3. COOK MODE STRIP ───────────────────────────────────────────────────────

const COOK_STEPS = [
  "Bring a large pot of salted water to a boil.",
  "Fry guanciale over medium heat until crispy.",
  "Whisk egg yolks with Pecorino and black pepper.",
  "Toss pasta off-heat. Add egg mix + pasta water.",
];

function CookModeStrip() {
  const [step, setStep] = useState(0);
  const progress = ((step + 1) / COOK_STEPS.length) * 100;

  useEffect(() => {
    const t = setInterval(
      () => setStep((s) => (s + 1) % COOK_STEPS.length),
      2800,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-surface-2 border border-border-subtle rounded-sm overflow-hidden">
      {/* Progress bar */}
      <div className="h-0.5 bg-surface-3">
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
          className="h-full bg-brand"
        />
      </div>

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-text-muted font-medium">
            Step {step + 1} of {COOK_STEPS.length}
          </span>
          <div className="flex gap-1">
            {COOK_STEPS.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === step ? 20 : 8,
                  backgroundColor: i === step ? "#FF6B35" : "#EEEBE7",
                }}
                className="h-1 rounded-full"
              />
            ))}
          </div>
        </div>

        {/* Step text */}
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="font-bold text-lg md:text-xl leading-snug mb-5"
          >
            {COOK_STEPS[step]}
          </motion.p>
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="px-4 py-2 text-sm border border-border-subtle rounded-sm text-text-secondary hover:border-brand/30 transition-colors"
          >
            ← Prev
          </button>
          <button
            onClick={() => setStep((s) => (s + 1) % COOK_STEPS.length)}
            className="px-4 py-2 text-sm bg-brand text-white font-semibold rounded-sm hover:bg-brand-600 transition-colors"
          >
            Next →
          </button>
          <span className="ml-auto text-xs text-text-muted">🎤 Voice on</span>
        </div>
      </div>
    </div>
  );
}

// ─── 4. MEAL PLAN STRIP ───────────────────────────────────────────────────────

const MEALS = [
  { day: "Mon", name: "Carbonara", emoji: "🍝" },
  { day: "Tue", name: "Miso Salmon", emoji: "🍣" },
  { day: "Wed", name: null },
  { day: "Thu", name: "Shakshuka", emoji: "🍳" },
  { day: "Fri", name: "Burger", emoji: "🍔" },
];

function MealPlanStrip() {
  return (
    <div className="bg-surface-2 border border-border-subtle rounded-sm p-4 md:p-5">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-text-secondary font-medium">
          This week
        </span>
        <span className="text-xs text-brand font-semibold cursor-pointer hover:underline">
          + Generate grocery list
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 md:gap-2">
        {MEALS.map((m, i) => (
          <motion.div
            key={m.day}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            className={`rounded-sm border text-center px-1 py-3 flex flex-col items-center justify-center gap-1 min-h-[76px] ${
              m.name
                ? "bg-brand/8 border-brand/20"
                : "bg-surface-3 border-border-light"
            }`}
          >
            <p className="text-[9px] uppercase tracking-widest text-text-muted">
              {m.day}
            </p>
            {m.name ? (
              <>
                <span className="text-xl leading-none">{m.emoji}</span>
                <p className="text-[10px] font-semibold leading-tight">
                  {m.name}
                </p>
              </>
            ) : (
              <span className="text-lg text-border-subtle">+</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── 5. RECIPE CARD GRID ─────────────────────────────────────────────────────

const RECIPES = [
  {
    name: "Spaghetti Carbonara",
    tags: ["Italian", "30 min"],
    cal: 620,
    time: "25 min",
    img: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=240&fit=crop&q=80",
  },
  {
    name: "Miso Salmon Bowl",
    tags: ["Japanese", "Easy"],
    cal: 390,
    time: "30 min",
    img: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&h=240&fit=crop&q=80",
  },
  {
    name: "Smash Burger Stack",
    tags: ["American"],
    cal: 720,
    time: "15 min",
    img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=240&fit=crop&q=80",
  },
  {
    name: "Shakshuka Classic",
    tags: ["Veg"],
    cal: 310,
    time: "35 min",
    img: "https://images.unsplash.com/photo-1590412200988-a436970781fa?w=400&h=240&fit=crop&q=80",
  },
];

function RecipeGrid() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {RECIPES.map((r, i) => (
        <motion.div
          key={r.name}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.07 }}
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-surface-2 border border-border-light rounded-sm overflow-hidden flex flex-col"
        >
          {/* Image */}
          <div className="relative h-16 md:h-24 overflow-hidden">
            <Image
              src={r.img}
              alt={r.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
            />

            {/* Gradient fade */}
            <div className="[background:linear-gradient(to_top,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.82)_20%,rgba(0,0,0,0.65)_40%,rgba(0,0,0,0.35)_60%,rgba(0,0,0,0.15)_80%,transparent_100%)] absolute inset-x-0 bottom-0 h-[80%]" />

            {/* Saved badge */}
            <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-black/50 text-white rounded-sm px-1.5 py-0.5">
              saved
            </span>
          </div>

          {/* Content */}
          <div className="p-3 flex flex-col flex-1">
            {/* Title */}
            <p className="font-bold text-sm leading-snug line-clamp-2">
              {r.name}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {r.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] text-text-muted bg-surface-3 border border-border-light rounded-sm px-2 py-0.5 mb-2"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Bottom meta pinned */}
            <div className="flex gap-3 text-[10px] text-text-muted pt-2 mt-auto border-t border-border-light">
              <span>⏱ {r.time}</span>
              <span>🔥 {r.cal} kcal</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────

export default function PropBlocks() {
  return (
    <>
      <Section
        eyebrow="Universal import"
        headline="Paste anything."
        accent="It just works."
        body="Recipe websites, TikTok videos, YouTube tutorials, Instagram screenshots — Bite handles all of them. JSON-LD for structured sites, Gemini Vision for social media that doesn't expose data. One URL in, clean recipe out."
      >
        <SourceGrid />
      </Section>

      <Section
        eyebrow="AI extraction"
        headline="Gemini reads the"
        accent="whole video."
        body="Most importers scrape text. Bite uses Gemini 2.5 Flash to understand context — reading transcripts, parsing caption ingredients, interpreting ambiguous cooking instructions. No manual entry. Ever."
        reverse
      >
        <GeminiPipeline />
      </Section>

      <Section
        eyebrow="Cook mode"
        headline="Your phone stays"
        accent="in your pocket."
        body="Cook Mode takes over your screen — large steps, per-step countdown timers, voice commands, Wake Lock so the screen stays on. Auto-advance when the timer ends."
      >
        <CookModeStrip />
      </Section>

      <Section
        eyebrow="Meal planning"
        headline="Plan the week."
        accent="Skip the thinking."
        body="Drag saved recipes onto a weekly calendar. Bite aggregates every ingredient across all planned meals into a single grocery list. No duplicates, no mental math."
        reverse
      >
        <MealPlanStrip />
      </Section>

      <Section
        eyebrow="Your collection"
        headline="Every recipe,"
        accent="organized."
        body="Categories, favorites, search, filters, infinite scroll. 61 hand-curated starter recipes seeded on signup based on your taste preferences. Yours, instantly searchable."
      >
        <RecipeGrid />
      </Section>
    </>
  );
}
