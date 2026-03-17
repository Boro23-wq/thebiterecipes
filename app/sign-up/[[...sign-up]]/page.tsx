"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* LEFT — Branding panel */}
      <div className="relative hidden overflow-hidden bg-[#0F0F10] px-12 py-14 lg:flex lg:flex-col lg:justify-between">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-105 w-105 rounded-full bg-[#FF6B35]/12 blur-[120px]" />
        <div className="pointer-events-none absolute -left-16 bottom-32 h-50 w-50 rounded-full bg-[#FF6B35]/6 blur-[80px]" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#FF6B35] text-sm font-bold text-white">
            B
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            Bite
          </span>
        </div>

        {/* Copy */}
        <div className="relative max-w-sm">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[#FF6B35]">
            Your kitchen, smarter
          </p>
          <h2 className="text-[2rem] font-semibold leading-[1.2] tracking-tight text-white">
            Save recipes.
            <br />
            Plan meals.
            <br />
            Cook better.
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-white/50">
            Import from any URL. AI-powered grocery lists.
            <br />
            Step-by-step cook mode with built-in timers.
          </p>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-white/30">
          © {new Date().getFullYear()} Bite
        </p>
      </div>

      {/* RIGHT — Auth form */}
      <div className="flex items-center justify-center bg-[#FAFAFA] px-6 py-12">
        <SignUp.Root>
          {/* STEP 1: Email + Password + Google */}
          <SignUp.Step
            name="start"
            className="w-full max-w-105 rounded-sm border border-[#E5E7EB] bg-white p-8 shadow-sm"
          >
            <div className="mb-6">
              {/* Mobile-only logo */}
              <div className="mb-6 flex items-center gap-2.5 lg:hidden">
                <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-[#FF6B35] text-sm font-bold text-white">
                  B
                </div>
                <span className="text-[15px] font-semibold tracking-tight text-[#1A1A1A]">
                  Bite
                </span>
              </div>

              <h1 className="text-lg font-medium text-[#1A1A1A]">
                Create your account
              </h1>
              <p className="mt-1 text-sm text-[#6B7280]">
                Start saving and organizing your recipes.
              </p>
            </div>

            {/* Google OAuth */}
            <Clerk.Connection
              name="google"
              className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-sm border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 hover:border-[#D1D5DB] hover:bg-[#FAFAFA] hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)] active:scale-[0.99]"
            >
              <Clerk.Icon className="size-4" />
              Continue with Google
            </Clerk.Connection>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#E5E7EB]" />
              <span className="text-[11px] font-medium uppercase tracking-widest text-[#9CA3AF]">
                or
              </span>
              <div className="h-px flex-1 bg-[#E5E7EB]" />
            </div>

            {/* Email */}
            <Clerk.Field name="emailAddress" className="mb-4 space-y-1.5">
              <Clerk.Label className="text-sm font-medium text-[#1A1A1A]">
                Email address
              </Clerk.Label>
              <Clerk.Input className="w-full rounded-sm border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20" />
              <Clerk.FieldError className="text-xs text-red-500" />
            </Clerk.Field>

            {/* Password */}
            <Clerk.Field name="password" className="mb-4 space-y-1.5">
              <Clerk.Label className="text-sm font-medium text-[#1A1A1A]">
                Password
              </Clerk.Label>
              <Clerk.Input
                type="password"
                className="w-full rounded-sm border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20"
              />
              <Clerk.FieldError className="text-xs text-red-500" />
            </Clerk.Field>

            {/* Sign up */}
            <SignUp.Action
              submit
              className="w-full cursor-pointer rounded-sm bg-[#FF6B35] py-2.5 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-150 hover:bg-[#e55a2b] active:scale-[0.99]"
            >
              Create account
            </SignUp.Action>

            {/* Terms */}
            <p className="mt-5 text-center text-[11px] leading-relaxed text-[#9CA3AF]">
              By continuing, you agree to Bite&apos;s{" "}
              <a
                href="#"
                className="underline underline-offset-2 hover:text-[#6B7280]"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="underline underline-offset-2 hover:text-[#6B7280]"
              >
                Privacy Policy
              </a>
            </p>

            {/* Footer link */}
            <p className="mt-4 text-center text-sm text-[#6B7280]">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-[#FF6B35] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </SignUp.Step>

          {/* STEP 2: Email verification */}
          <SignUp.Step
            name="verifications"
            className="w-full max-w-105 rounded-sm border border-[#E5E7EB] bg-white p-8 shadow-sm"
          >
            <div className="mb-6">
              <h1 className="text-lg font-medium text-[#1A1A1A]">
                Verify your email
              </h1>
              <p className="mt-1 text-sm text-[#6B7280]">
                We sent a verification code to your email.
              </p>
            </div>

            <SignUp.Strategy name="email_code">
              <Clerk.Field name="code" className="mb-4 space-y-1.5">
                <Clerk.Label className="text-sm font-medium text-[#1A1A1A]">
                  Verification code
                </Clerk.Label>
                <Clerk.Input className="w-full rounded-sm border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20" />
                <Clerk.FieldError className="text-xs text-red-500" />
              </Clerk.Field>

              <SignUp.Action
                submit
                className="w-full cursor-pointer rounded-sm bg-[#FF6B35] py-2.5 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-150 hover:bg-[#e55a2b] active:scale-[0.99]"
              >
                Verify
              </SignUp.Action>
            </SignUp.Strategy>
          </SignUp.Step>
        </SignUp.Root>
      </div>
    </div>
  );
}
