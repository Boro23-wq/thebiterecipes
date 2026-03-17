"use client";

import { useState, useTransition } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";

export function EditNameModal() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [isPending, startTransition] = useTransition();

  if (!user) return null;

  const handleOpen = () => {
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setOpen(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await user.update({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
        toast.success("Name updated successfully");
        setOpen(false);
      } catch {
        toast.error("Failed to update name. Please try again.");
      }
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleOpen}
        className="cursor-pointer"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-sm border border-border-light bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-light px-5 py-4">
              <h2 className="text-base font-semibold text-text-primary">
                Edit Name
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-sm p-1 text-text-secondary hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 px-5 py-5">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First name
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="border-border-light focus:border-brand focus:ring-brand"
                  disabled={isPending}
                  placeholder="First name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Last name
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="border-border-light focus:border-brand focus:ring-brand"
                  disabled={isPending}
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border-light px-5 py-4">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="brand"
                onClick={handleSave}
                disabled={isPending || (!firstName.trim() && !lastName.trim())}
                className="cursor-pointer"
              >
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
