"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCheck, Loader, ArrowDown } from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const STEPS = [
  { type: "input", text: "https://tiktok.com/@gordonramsay/video/738..." },
  { type: "log", text: "Detected: TikTok video" },
  { type: "log", text: "Fetching transcript via YouTube Data API…" },
  { type: "log", text: "Sending to Gemini 2.5 Flash…" },
  { type: "result" },
] as const;

const STATS = [
  { value: "12", label: "ingredients" },
  { value: "8", label: "steps" },
  { value: "2h 30m", label: "cook time" },
];

export default function ImportTerminal() {
  const [visible, setVisible] = useState(0);
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const tick = () => {
      i++;
      setVisible(i);
      if (i < STEPS.length) {
        setTimeout(tick, i === 1 ? 500 : 700);
      } else {
        setTimeout(() => setDone(true), 300);
      }
    };
    setTimeout(tick, 600);
  }, [inView]);

  return (
    <div
      ref={ref}
      className="grid md:grid-cols-[3fr_2fr] gap-0 border border-border-subtle rounded-sm overflow-hidden"
    >
      {/* ── LEFT: Terminal ── */}
      <div className="bg-[#FAFAFA] font-mono">
        {/* Chrome */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border-light bg-[#F0EDE9]">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400 opacity-80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 opacity-80" />
          <span className="ml-2 text-[10px] text-text-muted">
            bite — import
          </span>
        </div>

        {/* Lines */}
        <div className="p-4 md:p-5 flex flex-col gap-2.5 min-h-45">
          {STEPS.slice(0, visible).map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {s.type === "input" && "text" in s && (
                <p className="text-xs md:text-sm text-brand break-all">
                  <span className="mr-2">$</span>
                  bite import <span className="text-blue-600">{s.text}</span>
                </p>
              )}
              {s.type === "log" && "text" in s && (
                <p className="text-xs md:text-sm text-text-secondary pl-4 flex items-center gap-2">
                  <Loader className="w-4 h-4 text-brand" />
                  {s.text.replace(/^>\s*/, "")}
                </p>
              )}
              {s.type === "result" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="mt-1 rounded-sm overflow-hidden"
                >
                  {/* Orange header */}
                  <div className="bg-brand px-3 py-2.5 flex items-center gap-2">
                    <CheckCheck className="w-4 h-4 text-white shrink-0" />
                    <span className="text-xs md:text-sm font-semibold text-white">
                      Beef Wellington
                    </span>
                    <span className="text-[10px] text-white/70 ml-auto hidden sm:inline">
                      Gordon Ramsay · TikTok
                    </span>
                  </div>
                  {/* Stats row */}
                  <div className="bg-brand-200 px-3 py-2 flex gap-5">
                    {STATS.map((stat) => (
                      <div key={stat.label} className="text-center">
                        <p className="text-sm md:text-base font-semibold text-brand leading-tight">
                          {stat.value}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider text-text-muted mt-0.5">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}

          {visible > 0 && visible < STEPS.length && (
            <span className="text-brand text-sm animate-blink">▋</span>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 md:px-5 py-2.5 border-t border-border-light">
          <p className="text-[10px] text-text-muted">
            gemini-2.5-flash-lite · schema.org/Recipe · YouTube Data API v3
          </p>
        </div>
      </div>

      {/* ── RIGHT: Before → After ── */}
      <div className="bg-white border-l border-border-light p-5 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key="before"
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: visible > 0 ? 1 : 0,
                y: visible > 0 ? 0 : 8,
              }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col gap-3"
            >
              <p
                className="text-[10px] uppercase tracking-widest text-text-muted"
                style={{ fontFamily: "var(--font-jetbrains)" }}
              >
                Before
              </p>
              <div className="bg-surface-2 border border-border-light rounded-sm p-3">
                <p className="text-[11px] font-mono text-text-secondary break-all leading-relaxed">
                  https://tiktok.com/@gordonramsay/video/7384920173...
                </p>
                <p className="text-[10px] font-mono text-text-muted mt-2 leading-relaxed italic">
                  &ldquo;ok so first you get your fillet right, and you sear it
                  on all sides until it&rsquo;s got a nice crust, then you lay
                  out your duxelles...&rdquo;
                </p>
              </div>
              <div className="flex justify-center">
                <motion.div
                  animate={{ y: [0, 4, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <ArrowDown className="w-4 h-4 text-text-muted" />
                </motion.div>
              </div>
              <div className="bg-surface-2 border border-border-light border-dashed rounded-sm p-3 flex items-center justify-center min-h-[72px]">
                <p className="text-[11px] text-text-muted">
                  Extracting recipe…
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="after"
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col gap-3"
            >
              <p
                className="text-[10px] uppercase tracking-widest text-text-muted"
                style={{ fontFamily: "var(--font-jetbrains)" }}
              >
                After
              </p>
              <div className="bg-white border border-border-light rounded-sm overflow-hidden">
                {/* Mini image band */}
                <div className="h-20 bg-linear-to-br from-[#2a1f1a] to-[#3d2a1e] flex items-center justify-center relative">
                  <span className="text-3xl opacity-70">🥩</span>
                  <span className="absolute top-1.5 right-1.5 text-[9px] text-white/70 bg-black/40 px-1.5 py-0.5 rounded-sm">
                    TikTok
                  </span>
                </div>
                {/* Card content */}
                <div className="p-3">
                  <p className="text-sm font-semibold text-text-primary">
                    Beef Wellington
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Gordon Ramsay
                  </p>
                  <div className="flex gap-2 mt-2.5">
                    {["12 ingredients", "8 steps", "2h 30m"].map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-text-secondary bg-surface-2 px-2 py-0.5 rounded-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-text-muted leading-relaxed">
                Structured, searchable, ready to cook.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
