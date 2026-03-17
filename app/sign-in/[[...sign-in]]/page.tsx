import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FEFEFE] px-4">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-[#FF6B35]">
          <span className="text-sm font-bold text-white">B</span>
        </div>
        <span className="text-xl font-semibold text-[#1A1A1A]">Bite</span>
      </Link>

      <SignIn
        appearance={{
          elements: {
            card: "shadow-sm border border-[#E5E7EB] rounded-sm",
            headerTitle: "text-[#1A1A1A] font-semibold",
            headerSubtitle: "text-[#6B7280]",
            socialButtonsBlockButton:
              "border border-[#E5E7EB] rounded-sm hover:bg-[#FFF5F0] transition-colors",
            formFieldInput:
              "border-[#E5E7EB] rounded-sm focus:border-[#FF6B35] focus:ring-[#FF6B35]",
            formButtonPrimary:
              "bg-[#FF6B35] hover:bg-[#e55a2b] rounded-sm text-white font-medium",
            footerActionLink: "text-[#FF6B35] hover:text-[#e55a2b]",
            identityPreviewEditButton: "text-[#FF6B35]",
            formResendCodeLink: "text-[#FF6B35]",
          },
        }}
      />

      <p className="mt-6 text-xs text-[#6B7280]">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-[#FF6B35] hover:text-[#e55a2b]"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
