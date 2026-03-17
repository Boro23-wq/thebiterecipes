"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CheckCircle2, Loader2, SquareDashedMousePointer } from "lucide-react";

const FEATURES = [
  "Reads video transcripts end-to-end",
  "Understands ingredient amounts in natural language",
  "Extracts timings from step descriptions",
  "Falls back gracefully to JSON-LD when available",
];

const PIPELINE = [
  { text: "Detect source", dur: 800 },
  { text: "Fetch transcript", dur: 1000 },
  { text: "Extract via Gemini", dur: 1200 },
  { text: "Structure recipe", dur: 800 },
];

const RESULT = {
  title: "Spaghetti Carbonara",
  time: "3.8s",
  stats: [
    { val: "6", label: "Ingredients" },
    { val: "4", label: "Steps" },
    { val: "25 min", label: "Cook time" },
  ],
};

type StepState = "queued" | "running" | "done";

export default function GeminiSection() {
  const [steps, setSteps] = useState<StepState[]>(PIPELINE.map(() => "queued"));
  const [progress, setProgress] = useState(0);
  const [showOutput, setShowOutput] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;

    let idx = 0;

    const runStep = () => {
      if (idx >= PIPELINE.length) {
        setTimeout(() => setShowOutput(true), 300);
        setTimeout(() => setShowFooter(true), 600);
        return;
      }

      // Set current step to running
      setSteps((prev) => prev.map((s, i) => (i === idx ? "running" : s)));
      setProgress(((idx + 0.5) / PIPELINE.length) * 100);

      // After duration, mark done and start next
      const currentIdx = idx;
      setTimeout(() => {
        setSteps((prev) => prev.map((s, i) => (i === currentIdx ? "done" : s)));
        setProgress(((currentIdx + 1) / PIPELINE.length) * 100);
        idx++;
        setTimeout(runStep, 200);
      }, PIPELINE[currentIdx].dur);
    };

    setTimeout(runStep, 600);
  }, [inView]);

  return (
    <section className="border-y border-border-light py-20 md:py-24">
      <div className="container grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        {/* Left — copy */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          {/* Gemini badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-brand/20 bg-brand/5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            <span className="text-xs font-semibold text-brand tracking-wide">
              Powered by Gemini 2.5 Flash
            </span>
          </div>

          <h2 className="font-extrabold text-3xl md:text-5xl tracking-tight leading-[1.05] mb-5">
            Not a scraper.
            <br />
            <span className="text-brand">A reader.</span>
          </h2>

          <p className="text-text-secondary leading-relaxed text-sm md:text-base mb-7">
            Traditional importers fail the moment a recipe lives in a video
            description or TikTok caption. Bite uses Gemini — Google&apos;s
            fastest multimodal model — to actually understand the content, not
            just parse HTML tags.
          </p>

          <ul className="flex flex-col gap-3">
            {FEATURES.map((f, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.09 }}
                className="flex items-start gap-3 text-sm text-text-secondary"
              >
                <SquareDashedMousePointer className="w-4 h-4 text-brand shrink-0 mt-0.5 opacity-90" />
                {f}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Right — animated pipeline */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <div className="bg-white border border-border-subtle rounded-sm overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            {/* Chrome */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border-light bg-surface-3">
              <div className="w-2 h-2 rounded-full bg-red-400 opacity-80" />
              <div className="w-2 h-2 rounded-full bg-yellow-400 opacity-80" />
              <div className="w-2 h-2 rounded-full bg-green-400 opacity-80" />
              <span
                className="ml-2 text-[10px] text-text-muted"
                style={{ fontFamily: "var(--font-jetbrains)" }}
              >
                bite pipeline
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-surface-3">
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-brand"
              />
            </div>

            {/* Pipeline steps */}
            <div className="p-4 flex flex-col gap-2 border-b border-border-light">
              {PIPELINE.map((step, i) => {
                const state = steps[i];
                if (state === "queued") return null;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-3 font-mono text-[11px]"
                  >
                    {/* Icon */}
                    <span className="w-4 h-4 flex items-center justify-center shrink-0">
                      {state === "running" ? (
                        <Loader2 className="w-3.5 h-3.5 text-brand animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      )}
                    </span>

                    {/* Text */}
                    <span className="text-text-primary">{step.text}</span>

                    {/* Badge */}
                    <span
                      className={`ml-auto text-[9px] font-semibold px-2 py-0.5 rounded-sm ${
                        state === "running"
                          ? "bg-brand/6 text-brand border border-brand/15"
                          : "bg-green-50 text-green-700 border border-green-200/50"
                      }`}
                    >
                      {state === "running" ? "running" : "done"}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Output stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={showOutput ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="p-4 grid grid-cols-3 gap-2 border-b border-border-light"
            >
              {RESULT.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="text-center py-2.5 bg-surface-2 rounded-sm border border-border-light"
                >
                  <p className="text-sm md:text-md font-bold text-text-primary leading-tight">
                    {stat.val}
                  </p>
                  <p className="text-[9px] text-text-muted uppercase tracking-wider mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={showFooter ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="px-4 py-3 flex items-center justify-between"
            >
              <span className="text-sm font-semibold text-text-primary">
                {RESULT.title}
              </span>
              <span
                className="text-[10px] text-text-muted"
                style={{ fontFamily: "var(--font-jetbrains)" }}
              >
                {RESULT.time}
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
