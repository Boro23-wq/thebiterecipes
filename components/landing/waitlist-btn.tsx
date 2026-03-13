"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { joinWaitlist } from "@/app/actions/waitlist-action";

type State = "idle" | "loading" | "success" | "already" | "error";

interface Props {
  variant?: "button" | "inline";
  className?: string;
  onSuccess?: () => void;
}

// Confetti burst on success
function SuccessState({ variant }: { variant: "button" | "inline" }) {
  const dots = [
    { x: -18, y: -22, color: "#FF6B35", size: 5, delay: 0 },
    { x: 22, y: -18, color: "#FF6B35", size: 4, delay: 0.04 },
    { x: -24, y: 10, color: "#FFBE9D", size: 4, delay: 0.07 },
    { x: 26, y: 14, color: "#FF6B35", size: 3, delay: 0.05 },
    { x: 4, y: -28, color: "#FFBE9D", size: 3, delay: 0.02 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative inline-flex items-center gap-3"
    >
      {/* Confetti dots */}
      {dots.map((d, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], x: d.x, y: d.y, scale: [0, 1.2, 0.8] }}
          transition={{
            delay: d.delay + 0.15,
            duration: 0.55,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: d.size,
            height: d.size,
            borderRadius: "50%",
            background: d.color,
            pointerEvents: "none",
          }}
        />
      ))}

      <motion.div
        animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-xl"
      >
        🎉
      </motion.div>

      <div>
        <motion.p
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="text-sm font-bold text-brand"
        >
          You&apos;re on the list!
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="text-xs text-text-muted"
        >
          {variant === "button"
            ? "Check your inbox ✓"
            : "We'll email you when early access opens."}
        </motion.p>
      </div>
    </motion.div>
  );
}

export default function WaitlistButton({
  variant = "button",
  className,
  onSuccess,
}: Props) {
  const [state, setState] = useState<State>("idle");
  const [email, setEmail] = useState("");
  const [expanded, setExpanded] = useState(variant === "inline");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!email.trim()) return;
    startTransition(async () => {
      setState("loading");
      const result = await joinWaitlist(email);
      if (result.success) {
        setState("success");
        onSuccess?.();
      } else if (result.error === "already_joined") {
        setState("already");
      } else {
        setState("error");
      }
    });
  };

  if (state === "success") {
    return <SuccessState variant={variant} />;
  }

  // ── Nav button: collapsed → expands on click ──────────────────────────────
  if (variant === "button" && !expanded) {
    return (
      <motion.button
        onClick={() => setExpanded(true)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className={`relative overflow-hidden px-4 py-2 text-sm font-semibold bg-brand text-white rounded-sm shadow-brand-sm group ${className}`}
      >
        {/* Shimmer sweep on hover */}
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-linear-to-r from-transparent via-white/20 to-transparent" />
        <span className="relative">Join waitlist ✦</span>
      </motion.button>
    );
  }

  // ── Email input (nav expanded or inline) ──────────────────────────────────
  return (
    <div className={`relative inline-block ${className}`}>
      <motion.div
        initial={variant === "button" ? { opacity: 0, width: 0 } : false}
        animate={{ opacity: 1, width: "auto" }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="flex items-center gap-2"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state !== "idle") setState("idle");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="your@email.com"
          autoFocus={variant === "button"}
          className={`
            px-3 py-2 text-sm border rounded-sm outline-none bg-white
            border-border-subtle focus:border-brand
            transition-colors duration-150
            ${variant === "button" ? "w-44" : "w-56 sm:w-64"}
            ${state === "error" ? "border-red-400 bg-red-50/50" : ""}
          `}
        />

        <motion.button
          onClick={handleSubmit}
          disabled={isPending || !email.trim()}
          whileTap={{ scale: 0.95 }}
          className="relative overflow-hidden px-4 py-2 text-sm font-semibold bg-brand text-white cursor-pointer rounded-sm disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap group"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-linear-to-r from-transparent via-white/20 to-transparent" />
          <span className="relative">
            {isPending ? (
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                ···
              </motion.span>
            ) : (
              "Join"
            )}
          </span>
        </motion.button>

        {variant === "button" && (
          <button
            onClick={() => setExpanded(false)}
            className="text-text-muted hover:text-text-primary transition-colors text-base leading-none"
          >
            ✕
          </button>
        )}
      </motion.div>

      {/* Inline error / already messages */}
      <AnimatePresence>
        {state === "already" && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-full left-1 mt-1 text-xs text-text-muted whitespace-nowrap"
          >
            Already on the list 👋
          </motion.p>
        )}
        {state === "error" && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-full left-1 mt-1 text-xs text-red-500 whitespace-nowrap"
          >
            Something went wrong — try again.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
