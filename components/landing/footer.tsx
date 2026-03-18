"use client";

import { motion } from "framer-motion";
import WaitlistButton from "./waitlist-btn";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
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
          <p className="text-xs uppercase tracking-widest text-text-muted font-medium mb-4">
            Early access
          </p>

          <h2 className="text-display-sm font-extrabold tracking-tight mb-6">
            Stop screenshotting recipes.
            <br />
            <span className="text-brand">Start cooking them.</span>
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
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/android-chrome-192x192.png"
              alt="Bite"
              width={24}
              height={24}
              className="rounded-sm"
            />
          </Link>

          <span className="text-sm text-text-muted">© 2026 Bite</span>
        </div>
      </footer>
    </>
  );
}
