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
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="font-extrabold text-lg tracking-tight leading-none">
            bite
            <span className="text-brand">.</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex text-[10px] font-semibold text-brand bg-brand/5 border border-brand/15 rounded-sm px-2.5 py-1 tracking-wide">
            Early access
          </span>
        </div>
      </div>
    </motion.header>
  );
}
