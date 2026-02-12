"use client";

import { updateNotifications } from "@/app/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTransition } from "react";

interface UserPreferences {
  id: string;
  userId: string;
  measurementUnit: string | null;
  defaultServings: number | null;
  language: string | null;
  timeFormat: string | null;
  defaultViewMode: string | null;
  emailNotifications: boolean | null;
  weeklyDigest: boolean | null;
  recipeReminders: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationsFormProps {
  preferences: UserPreferences;
}

function SettingRow(props: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
  disabledNote?: string;
}) {
  return (
    <div className="rounded-sm border border-border-light bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Label htmlFor={props.id} className="text-sm font-semibold">
            {props.title}
          </Label>
          <p className="mt-1 text-xs text-text-muted">{props.description}</p>
          {props.disabledNote ? (
            <p className="mt-2 inline-flex rounded-sm border border-border-light bg-brand-50 px-2.5 py-1 text-[11px] text-text-secondary">
              {props.disabledNote}
            </p>
          ) : null}
        </div>
        <div className="shrink-0">{props.children}</div>
      </div>
    </div>
  );
}

export function NotificationsForm({ preferences }: NotificationsFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await updateNotifications(formData);
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <SettingRow
        id="emailNotifications"
        title="Email notifications"
        description="Product updates and important changes about your recipes."
      >
        <Switch
          id="emailNotifications"
          name="emailNotifications"
          defaultChecked={preferences.emailNotifications ?? true}
        />
      </SettingRow>

      <SettingRow
        id="weeklyDigest"
        title="Weekly digest"
        description="A weekly summary of your cooking and saves."
        disabledNote="Coming soon"
      >
        <Switch
          id="weeklyDigest"
          name="weeklyDigest"
          defaultChecked={preferences.weeklyDigest ?? false}
          disabled
        />
      </SettingRow>

      <SettingRow
        id="recipeReminders"
        title="Recipe reminders"
        description="Get nudges to try recipes you’ve saved."
        disabledNote="Coming soon"
      >
        <Switch
          id="recipeReminders"
          name="recipeReminders"
          defaultChecked={preferences.recipeReminders ?? false}
          disabled
        />
      </SettingRow>

      <div className="pt-2">
        <Button
          type="submit"
          variant="brand"
          disabled={isPending}
          className="cursor-pointer"
        >
          {isPending ? "Saving..." : "Save notification settings"}
        </Button>
      </div>
    </form>
  );
}
