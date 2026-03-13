"use client";

import { motion } from "framer-motion";
import WaitlistButton from "./waitlist-btn";

export default function Bottom() {
  return (
    <>
      {/* CTA */}
      <section className="container py-20 md:py-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <div
            className="flex items-center justify-center gap-3 mb-8 text-xs text-text-muted"
            style={{ fontFamily: "var(--font-jetbrains)" }}
          >
            <div className="h-px w-10 bg-border-subtle" />
            <span>bite / early access</span>
            <div className="h-px w-10 bg-border-subtle" />
          </div>

          <h2
            className="text-display-md font-black mb-5"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Stop screenshotting recipes.
            <br />
            <em className="text-brand not-italic">Start collecting them.</em>
          </h2>

          <p className="text-text-secondary max-w-md mx-auto leading-relaxed mb-10 text-sm md:text-base">
            We&apos;re putting the finishing touches on Bite. Be first in line
            when early access opens.
          </p>

          <div className="flex justify-center">
            <WaitlistButton variant="inline" />
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-light py-5">
        <div className="container flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-base"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Bite
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-brand/20 bg-brand/5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-dot" />
            <span className="text-xs font-semibold text-brand tracking-wide">
              Powered by Gemini 2.5 Flash
            </span>
          </div>
          <span className="text-sm text-text-muted">© 2026 Bite</span>
        </div>
      </footer>
    </>
  );
}
