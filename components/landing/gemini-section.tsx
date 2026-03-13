"use client";

import { motion } from "framer-motion";

const FEATURES = [
  "Reads video transcripts end-to-end",
  "Understands ingredient amounts in natural language",
  "Extracts timings from step descriptions",
  "Falls back gracefully to JSON-LD when available",
];

const CODE_ROWS = [
  { key: "model", val: '"gemini-2.5-flash-lite"' },
  { key: "input", val: "[url, transcript, screenshot?]" },
  { key: "output", val: "{title, ingredients[], steps[], nutrition}" },
  { key: "latency", val: '"~4.2s avg"' },
];

export default function GeminiSection() {
  return (
    <section className="border-y border-border-light bg-surface-1 py-20 md:py-24">
      <div className="container grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        {/* Left — copy */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          {/* Gemini badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-brand/25 bg-brand/5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-dot" />
            <span className="text-xs font-semibold text-brand tracking-wide">
              Powered by Gemini 2.5 Flash
            </span>
          </div>

          <h2 className="font-serif font-black text-3xl md:text-5xl tracking-tight leading-[1.08] mb-5">
            Not a scraper.
            <br />
            <em className="text-brand not-italic">A reader.</em>
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
                <span className="text-brand shrink-0 mt-0.5">→</span>
                {f}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Right — code block */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <div className="bg-surface-2 border border-border-subtle rounded-sm overflow-hidden">
            {/* Chrome */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border-light bg-surface-3">
              <div className="w-2 h-2 rounded-full bg-red-400 opacity-80" />
              <div className="w-2 h-2 rounded-full bg-yellow-400 opacity-80" />
              <div className="w-2 h-2 rounded-full bg-green-400 opacity-80" />
            </div>

            <div className="p-5 font-mono text-xs">
              <p className="text-text-muted mb-4">
                {"// gemini-2.5-flash-lite · bite pipeline"}
              </p>

              <div className="flex flex-col gap-2.5">
                {CODE_ROWS.map((r) => (
                  <div key={r.key} className="flex gap-3 flex-wrap">
                    <span className="text-text-muted w-16 shrink-0">
                      {r.key}
                    </span>
                    <span className="text-blue-600 break-all">{r.val}</span>
                  </div>
                ))}
              </div>

              {/* Result row */}
              <div className="mt-5 px-3 py-2.5 rounded-sm bg-brand/8 border border-brand/20">
                <p className="text-brand font-semibold">
                  ✓ billing enabled — free tier not practical for real users
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
