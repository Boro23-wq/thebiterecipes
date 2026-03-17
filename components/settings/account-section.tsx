"use client";

import { useUser } from "@clerk/nextjs";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Camera, Trash2 } from "lucide-react";
import Link from "next/link";
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
    <div className="rounded-sm border border-border-light px-4 py-3">
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
  const [isRemoving, setIsRemoving] = useState(false);

  if (!user) return null;

  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const fullName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "—";
  const initials = `${(user.firstName?.[0] ?? "U").toUpperCase()}${(user.lastName?.[0] ?? "").toUpperCase()}`;

  const hasCustomImage = user.hasImage;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = async () => {
    setIsRemoving(true);
    try {
      await user.setProfileImage({ file: null });
      toast.success("Profile photo removed.");
    } catch {
      toast.error("Failed to remove photo. Try again.");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar with upload overlay */}
          <div className="group relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.imageUrl} />
              <AvatarFallback className="bg-brand-50 text-brand text-sm font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
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

        {/* Upload / Remove buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="mr-1.5 h-3.5 w-3.5" />
            Upload photo
          </Button>
          {hasCustomImage && (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={handleRemoveImage}
              disabled={isRemoving}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              {isRemoving ? "Removing…" : "Remove"}
            </Button>
          )}
        </div>
      </div>

      {/* Info tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoTile
          label="Full name"
          value={fullName}
          action={<EditNameModal />}
        />
        <InfoTile
          label="Email"
          value={email || "—"}
          action={email ? <CopyToClipboard value={email} /> : null}
        />
      </div>

      {/* Security link */}
      <div className="flex items-center justify-between rounded-sm border border-border-light px-4 py-3">
        <p className="text-xs text-text-secondary">
          Manage your password, MFA, and connected accounts.
        </p>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="ml-4 shrink-0 cursor-pointer"
        >
          <Link href="/dashboard/settings/account">
            Security
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
