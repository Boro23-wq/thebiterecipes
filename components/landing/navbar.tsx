"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border-light"
    >
      <div className="container flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span
            className="font-bold text-lg leading-none"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Bite
          </span>
        </Link>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-brand/20 bg-brand/5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-dot" />
          <span className="text-xs font-semibold text-brand tracking-wide">
            Early access coming soon
          </span>
        </div>
      </div>
    </motion.header>
  );
}
