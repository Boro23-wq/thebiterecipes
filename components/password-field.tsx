"use client";

import { useState } from "react";
import * as Clerk from "@clerk/elements/common";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PasswordField({
  name = "password",
  label = "Password",
}: {
  name?: string;
  label?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <Clerk.Field name={name} className="mb-4 space-y-1.5">
      <Clerk.Label className="text-sm font-medium text-[#1A1A1A]">
        {label}
      </Clerk.Label>
      <div className="relative mt-2">
        <Clerk.Input
          type={show ? "text" : "password"}
          className="w-full rounded-sm border border-[#E5E7EB] bg-white px-3 py-2.5 pr-10 text-sm text-[#1A1A1A] outline-none transition-all duration-200 placeholder:text-[#9CA3AF] focus:border-[#FF6B35] focus:ring-[3px] focus:ring-[#FF6B35]/[0.08]"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setShow((s) => !s)}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-[#9CA3AF] hover:text-[#6B7280] hover:bg-transparent"
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      <Clerk.FieldError className="text-xs text-red-500" />
    </Clerk.Field>
  );
}
