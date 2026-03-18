"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import PasswordField from "@/components/password-field";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

export default function SignInPage() {
  return (
    <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* LEFT — Branding panel */}
      <div className="relative hidden overflow-hidden bg-[#0A0A0B] px-12 py-14 lg:flex lg:flex-col lg:justify-between">
        {/* Animated gradient rings */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
          viewBox="0 0 400 520"
          fill="none"
        >
          <circle
            cx="200"
            cy="260"
            r="100"
            stroke="url(#ring1)"
            strokeWidth="1"
            strokeDasharray="8 6"
            fill="none"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 200 260"
              to="360 200 260"
              dur="20s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="200"
            cy="260"
            r="140"
            stroke="url(#ring2)"
            strokeWidth="0.5"
            strokeDasharray="4 8"
            fill="none"
            opacity="0.4"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="360 200 260"
              to="0 200 260"
              dur="30s"
              repeatCount="indefinite"
            />
          </circle>
          <defs>
            <linearGradient id="ring1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#FF6B35" stopOpacity="0" />
              <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="ring2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Subtle center glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-30 w-30 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF6B35]/4 blur-2xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <Image
            src="/android-chrome-192x192.png"
            alt="Bite"
            width={28}
            height={28}
            className="rounded-sm"
          />
        </div>

        {/* Copy */}
        <div className="relative max-w-sm">
          <h2 className="text-[2rem] font-semibold leading-[1.2] -tracking-[0.02em] text-white">
            Save recipes.
            <br />
            Plan meals.
            <br />
            Cook better.
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-white/30">
            Import from any URL. AI-powered grocery lists.
            <br />
            Step-by-step cook mode with built-in timers.
          </p>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-white/15">
          © {new Date().getFullYear()} Bite
        </p>
      </div>

      {/* RIGHT — Auth form */}
      <div className="flex items-center justify-center bg-[#FAFAFA] px-6 py-12">
        <SignIn.Root>
          {/* STEP 1: Email + Google */}
          <SignIn.Step name="start" className="w-full max-w-105">
            <motion.div
              initial="hidden"
              animate="show"
              className="rounded-sm border border-[#EBEBEB] bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <motion.div variants={fadeUp} custom={0} className="mb-6">
                {/* Mobile-only logo */}
                <div className="mb-6 flex items-center justify-center gap-2.5">
                  <Image
                    src="/android-chrome-192x192.png"
                    alt="Bite"
                    width={28}
                    height={28}
                    className="rounded-sm"
                  />
                </div>

                <h1 className="text-lg font-medium text-[#1A1A1A]">
                  Sign in to Bite
                </h1>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Welcome back. Pick up where you left off.
                </p>
              </motion.div>

              {/* Google OAuth */}
              <motion.div variants={fadeUp} custom={1}>
                <Clerk.Connection
                  name="google"
                  className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-sm border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] transition-all duration-200 hover:border-[#D1D5DB] hover:bg-[#FAFAFA] active:scale-[0.99]"
                >
                  <Clerk.Icon className="size-4" />
                  Continue with Google
                </Clerk.Connection>
              </motion.div>

              {/* Divider */}
              <motion.div
                variants={fadeUp}
                custom={2}
                className="my-6 flex items-center gap-3"
              >
                <div className="h-px flex-1 bg-[#E5E7EB]" />
                <span className="text-[11px] font-medium uppercase tracking-widest text-[#9CA3AF]">
                  or
                </span>
                <div className="h-px flex-1 bg-[#E5E7EB]" />
              </motion.div>

              {/* Email */}
              <motion.div variants={fadeUp} custom={3}>
                <Clerk.Field name="identifier" className="mb-4 space-y-1.5">
                  <Clerk.Label className="text-sm font-medium text-[#1A1A1A]">
                    Email address
                  </Clerk.Label>
                  <Clerk.Input className="w-full mt-2 rounded-sm border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] outline-none transition-all duration-200 placeholder:text-[#9CA3AF] focus:border-[#FF6B35] focus:ring-[3px] focus:ring-[#FF6B35]/8" />
                  <Clerk.FieldError className="text-xs text-red-500" />
                </Clerk.Field>
              </motion.div>

              {/* Continue */}
              <motion.div variants={fadeUp} custom={4}>
                <SignIn.Action
                  submit
                  className="w-full cursor-pointer rounded-sm bg-[#FF6B35] py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[#e55a2b] active:scale-[0.99]"
                >
                  Continue
                </SignIn.Action>
              </motion.div>

              {/* Footer link */}
              <motion.p
                variants={fadeUp}
                custom={5}
                className="mt-6 text-center text-sm text-[#6B7280]"
              >
                Don&apos;t have an account?{" "}
                <Link
                  href="/sign-up"
                  className="font-medium text-[#FF6B35] transition-colors hover:text-[#e55a2b]"
                >
                  Sign up
                </Link>
              </motion.p>
            </motion.div>
          </SignIn.Step>

          {/* STEP 2: Password / Email code */}
          <SignIn.Step name="verifications" className="w-full max-w-105">
            <motion.div
              initial="hidden"
              animate="show"
              className="rounded-sm border border-[#EBEBEB] bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <motion.div variants={fadeUp} custom={0} className="mb-6">
                <h1 className="text-lg font-medium text-[#1A1A1A]">
                  Enter your password
                </h1>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Enter the password associated with your account.
                </p>
              </motion.div>

              {/* Password strategy */}
              <SignIn.Strategy name="password">
                <motion.div variants={fadeUp} custom={1}>
                  <PasswordField />
                </motion.div>

                <motion.div variants={fadeUp} custom={2}>
                  <SignIn.Action
                    submit
                    className="w-full cursor-pointer rounded-sm bg-[#FF6B35] py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[#e55a2b] active:scale-[0.99]"
                  >
                    Sign in
                  </SignIn.Action>
                </motion.div>
              </SignIn.Strategy>

              {/* Email code fallback */}
              <SignIn.Strategy name="email_code">
                <motion.div variants={fadeUp} custom={1}>
                  <Clerk.Field name="code" className="mb-4 space-y-1.5">
                    <Clerk.Label className="text-sm font-medium text-[#1A1A1A]">
                      Verification code
                    </Clerk.Label>
                    <Clerk.Input className="w-full rounded-sm border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] outline-none transition-all duration-200 placeholder:text-[#9CA3AF] focus:border-[#FF6B35] focus:ring-[3px] focus:ring-[#FF6B35]/8" />
                    <Clerk.FieldError className="text-xs text-red-500" />
                  </Clerk.Field>
                </motion.div>

                <motion.div variants={fadeUp} custom={2}>
                  <SignIn.Action
                    submit
                    className="w-full cursor-pointer rounded-sm bg-[#FF6B35] py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[#e55a2b] active:scale-[0.99]"
                  >
                    Verify
                  </SignIn.Action>
                </motion.div>
              </SignIn.Strategy>

              {/* Back link */}
              <motion.div variants={fadeUp} custom={3}>
                <SignIn.Action
                  navigate="start"
                  className="mt-4 block w-full cursor-pointer text-center text-sm font-medium text-[#FF6B35] transition-colors hover:text-[#e55a2b]"
                >
                  Use a different method
                </SignIn.Action>
              </motion.div>
            </motion.div>
          </SignIn.Step>
        </SignIn.Root>
      </div>
    </div>
  );
}
