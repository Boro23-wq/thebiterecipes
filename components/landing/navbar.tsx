"use client";

import { motion } from "framer-motion";
import Image from "next/image";
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
          <Image
            src="/android-chrome-192x192.png"
            alt="Bite"
            width={24}
            height={24}
            className="rounded-sm"
          />
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-brand/25 bg-brand/5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand" />
          <span className="text-xs font-semibold text-brand tracking-wide">
            Powered by Gemini 2.5 Flash
          </span>
        </div>
      </div>
    </motion.header>
  );
}
