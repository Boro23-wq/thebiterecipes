"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import WaitlistButton from "./waitlist-btn";

const WORDS = [
  "TikTok videos.",
  "YouTube videos.",
  "food blogs.",
  "Instagram posts.",
  "any URL.",
];

function useTyped(
  words: string[],
  typeSpeed = 60,
  deleteSpeed = 35,
  pause = 1600,
) {
  const [display, setDisplay] = useState("");
  const wordIdx = useRef(0);
  const charIdx = useRef(0);
  const deleting = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const word = words[wordIdx.current];

      if (!deleting.current && charIdx.current < word.length) {
        charIdx.current++;
        setDisplay(word.slice(0, charIdx.current));
        timer = setTimeout(tick, typeSpeed + Math.random() * 30);
      } else if (!deleting.current && charIdx.current === word.length) {
        timer = setTimeout(() => {
          deleting.current = true;
          tick();
        }, pause);
      } else if (deleting.current && charIdx.current > 0) {
        charIdx.current--;
        setDisplay(word.slice(0, charIdx.current));
        timer = setTimeout(tick, deleteSpeed);
      } else {
        deleting.current = false;
        wordIdx.current = (wordIdx.current + 1) % words.length;
        timer = setTimeout(tick, typeSpeed);
      }
    };

    timer = setTimeout(tick, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return display;
}

export default function Hero() {
  const [joined, setJoined] = useState(false);
  const typed = useTyped(WORDS);

  return (
    <section className="container pt-16 pb-16 md:pb-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl"
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-brand/25 bg-brand/5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-brand" />
          <span className="text-xs font-semibold text-brand tracking-wide">
            Early access coming soon
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-display-md font-extrabold tracking-tight mb-1">
          Save recipes from
        </h1>
        <h1 className="text-display-md font-extrabold tracking-tight mb-8 flex items-baseline flex-wrap">
          <span className="text-brand">{typed}</span>
          <span className="text-brand opacity-80 ml-0.5 font-light">|</span>
        </h1>

        <p className="text-base md:text-lg text-text-secondary max-w-lg leading-relaxed mb-8">
          Paste any link — Bite&apos;s AI extracts every ingredient, step, and
          timing. Your recipe collection, organized in seconds.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <WaitlistButton variant="inline" onSuccess={() => setJoined(true)} />

          {!joined && (
            <span className="text-sm text-text-muted hidden sm:block">
              Free · No credit card · Early access soon
            </span>
          )}
        </div>

        {/* Stats strip */}
        <div className="flex gap-12 md:gap-16 mt-16 pt-10 border-t border-border-light">
          {[
            { val: "100+", label: "Recipe sites" },
            { val: "<5s", label: "Avg import" },
            { val: "4", label: "Social platforms" },
            { val: "Free", label: "While in beta" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
            >
              <p className="font-extrabold text-3xl tracking-tight mb-1">
                {s.val}
              </p>
              <p className="text-xs text-text-muted">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
