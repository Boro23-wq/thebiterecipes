"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

export function HeroBeforeAfter() {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setFlipped((f) => !f), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-sm border border-border-light bg-white overflow-hidden mt-4">
      <div className="p-8">
        <div className="flex items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2">
              Messy source in. Clean recipe out.
            </h1>
            <p className="text-sm text-text-muted max-w-md">
              No matter how chaotic the source — a rambling video, a tiny
              caption, a blurry screenshot — Bite turns it into an organized
              recipe.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-brand-100 bg-brand-50 shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span className="text-xs font-semibold text-brand">AI-Powered</span>
          </div>
        </div>

        {/* Before / After cards */}
        <div className="grid md:grid-cols-2 gap-3">
          {/* Before */}
          <div className="rounded-sm border border-brand-100 overflow-hidden">
            <div className="px-4 py-2 bg-neutral-50 border-b border-brand-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-300" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Input
              </span>
            </div>
            <div className="p-4 space-y-2.5 min-h-35">
              <div
                className="transition-all duration-700"
                style={{
                  opacity: flipped ? 0.3 : 1,
                  transform: flipped ? "scale(0.98)" : "scale(1)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">🎬</span>
                  <span className="text-[10px] text-text-muted truncate">
                    youtube.com/watch?v=9biIOtEYeHc
                  </span>
                </div>
                <div className="rounded-sm bg-neutral-50 p-3 text-[11px] text-text-muted leading-relaxed font-mono">
                  &quot;ok so first you&apos;re gonna wanna get your pork belly
                  and score the skin really well with a sharp knife then rub it
                  with five spice salt pepper olive oil...&quot;
                </div>
                <div className="text-[10px] text-text-muted mt-2 italic">
                  12 min video · no written recipe
                </div>
              </div>
            </div>
          </div>

          {/* After */}
          <div className="rounded-sm border border-brand-200 overflow-hidden">
            <div className="px-4 py-2 bg-brand-50 border-b border-brand-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-brand">
                Output
              </span>
            </div>
            <div
              className="p-4 min-h-35 transition-all duration-700"
              style={{
                opacity: flipped ? 1 : 0.5,
                transform: flipped ? "scale(1)" : "scale(0.98)",
              }}
            >
              <div className="text-sm font-semibold text-text-primary mb-2">
                Slow Roasted Pork Belly
              </div>
              <div className="flex items-center gap-3 text-[10px] text-text-muted mb-3">
                <span>⏱ 3h 20m</span>
                <span>👥 6 servings</span>
                <span>🔥 485 cal</span>
              </div>
              <div className="space-y-1.5">
                {[
                  "2 kg pork belly, skin on",
                  "2 tsp five spice powder",
                  "Sea salt flakes",
                  "2 tbsp olive oil",
                ].map((ing, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-[11px] text-text-secondary"
                  >
                    <div className="w-1 h-1 rounded-full bg-brand" />
                    {ing}
                  </div>
                ))}
                <div className="text-[10px] italic mt-1 text-brand">
                  + 4 more ingredients, 6 steps
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Source row */}
        <div className="flex items-center justify-center gap-4 mt-6 text-[11px] text-text-muted">
          {[
            "🍳 Sites",
            "🎬 YouTube",
            "🎵 TikTok",
            "📸 Screenshots",
            "📋 Paste",
          ].map((s, i) => (
            <span key={s} className="flex items-center gap-1">
              {i > 0 && <span className="text-brand-200 mr-1">·</span>}
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
