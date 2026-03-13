"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

const STEPS = [
  { type: "input", text: "https://tiktok.com/@gordonramsay/video/738..." },
  { type: "log", text: "→ Detected: TikTok video" },
  { type: "log", text: "→ Fetching transcript via YouTube Data API…" },
  { type: "log", text: "→ Sending to Gemini 2.5 Flash…" },
  { type: "result", text: '✓ "Beef Wellington" — 12 ingredients, 8 steps' },
] as const;

// Sources shown in the right panel
const SOURCES = [
  { icon: "🎵", label: "TikTok" },
  { icon: "▶", label: "YouTube" },
  { icon: "📸", label: "Instagram" },
  { icon: "🌐", label: "AllRecipes" },
  { icon: "🌐", label: "NYT Cooking" },
  { icon: "🌐", label: "Food Network" },
  { icon: "🌐", label: "Bon Appétit" },
  { icon: "✦", label: "100+ more" },
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
        <div className="p-4 md:p-5 flex flex-col gap-2.5 min-h-[180px]">
          {STEPS.slice(0, visible).map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {s.type === "input" && (
                <p className="text-xs md:text-sm text-brand break-all">
                  <span className="mr-2">$</span>
                  bite import <span className="text-blue-600">{s.text}</span>
                </p>
              )}
              {s.type === "log" && (
                <p className="text-xs md:text-sm text-text-secondary pl-4">
                  {s.text}
                </p>
              )}
              {s.type === "result" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="mt-1 px-3 py-2.5 rounded-sm bg-white border border-brand/20"
                >
                  <p className="text-xs md:text-sm text-brand font-semibold">
                    {s.text}
                  </p>
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

      {/* ── RIGHT: Source panel ── */}
      <div className="bg-white border-l border-border-light p-5 flex flex-col">
        <p
          className="text-[10px] uppercase tracking-widest text-text-muted mb-4"
          style={{ fontFamily: "var(--font-jetbrains)" }}
        >
          Works with
        </p>

        <div className="grid grid-cols-2 gap-2 flex-1">
          {SOURCES.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 6 }}
              animate={done ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="flex items-center gap-2 px-2.5 py-2 rounded-sm bg-surface-2 border border-border-light"
            >
              <span className="text-sm w-4 text-center shrink-0">{s.icon}</span>
              <span className="text-[11px] text-text-secondary font-medium truncate">
                {s.label}
              </span>
            </motion.div>
          ))}
        </div>

        <p className="text-[10px] text-text-muted mt-4 leading-relaxed">
          JSON-LD for structured sites. Gemini Vision for social media.
        </p>
      </div>
    </div>
  );
}
