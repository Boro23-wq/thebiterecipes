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
          <span className="font-bold text-lg leading-none">Bite</span>
        </Link>
      </div>
    </motion.header>
  );
}
