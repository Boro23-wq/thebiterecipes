"use client";

import { useUser } from "@clerk/nextjs";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Camera } from "lucide-react";
import { CopyToClipboard } from "@/components/settings/copy-to-clipboard";
import { EditNameModal } from "@/components/settings/edit-name-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

function InfoTile({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-sm bg-brand-50/50 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-text-secondary">{label}</div>
          <div className="mt-0.5 truncate text-sm font-medium text-text-primary">
            {value}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

export function AccountSection() {
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const fullName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "—";
  const initials = `${(user.firstName?.[0] ?? "U").toUpperCase()}${(user.lastName?.[0] ?? "").toUpperCase()}`;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB.");
      return;
    }

    try {
      await user.setProfileImage({ file });
      toast.success("Profile photo updated!");
    } catch {
      toast.error("Failed to update photo. Try again.");
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Profile row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar with upload overlay */}
          <div className="relative group">
            <Avatar className="h-14 w-14">
              <AvatarImage src={user.imageUrl} />
              <AvatarFallback className="bg-brand-50 text-brand text-sm font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="h-4 w-4 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          <div>
            <div className="text-sm font-semibold text-text-primary">
              {fullName}
            </div>
            <div className="text-sm text-text-secondary">{email || "—"}</div>
          </div>
        </div>

        <EditNameModal />
      </div>

      {/* Info tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoTile label="Full name" value={fullName} />
        <InfoTile
          label="Email"
          value={email || "—"}
          action={email ? <CopyToClipboard value={email} /> : null}
        />
      </div>

      {/* Security link */}
      <div className="flex items-center justify-between rounded-sm bg-brand-50/50 px-4 py-3">
        <p className="text-xs text-text-secondary">
          Password, MFA, and connected accounts are managed through Clerk.
        </p>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="cursor-pointer shrink-0 ml-4"
        >
          <a
            href="/dashboard/settings/account"
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Security
          </a>
        </Button>
      </div>
    </div>
  );
}
