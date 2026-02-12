"use client";

import { updatePreferences } from "@/app/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface PreferencesFormProps {
  preferences: UserPreferences;
}

function Field(props: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-sm border border-border-light bg-white p-4">
      <Label className="text-sm font-semibold">{props.label}</Label>
      {props.hint ? (
        <p className="mt-1 text-xs text-text-muted">{props.hint}</p>
      ) : null}
      <div className="mt-3">{props.children}</div>
    </div>
  );
}

export function PreferencesForm({ preferences }: PreferencesFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await updatePreferences(formData);
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field
          label="Measurement system"
          hint="How ingredient amounts are shown."
        >
          <Select
            name="measurementUnit"
            defaultValue={preferences.measurementUnit || "imperial"}
          >
            <SelectTrigger className="border-border-light focus:border-brand">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="imperial">Imperial (cups, oz, °F)</SelectItem>
              <SelectItem value="metric">Metric (g, ml, °C)</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Default servings"
          hint="Used when importing or quick-creating recipes."
        >
          <Select
            name="defaultServings"
            defaultValue={String(preferences.defaultServings || 4)}
          >
            <SelectTrigger className="border-border-light focus:border-brand">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 serving</SelectItem>
              <SelectItem value="2">2 servings</SelectItem>
              <SelectItem value="4">4 servings</SelectItem>
              <SelectItem value="6">6 servings</SelectItem>
              <SelectItem value="8">8 servings</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Time format"
          hint="Used for timers and scheduling features."
        >
          <Select
            name="timeFormat"
            defaultValue={preferences.timeFormat || "12"}
          >
            <SelectTrigger className="border-border-light focus:border-brand">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12-hour (3:00 PM)</SelectItem>
              <SelectItem value="24">24-hour (15:00)</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Default recipe view"
          hint="How your recipe list opens by default."
        >
          <Select
            name="defaultViewMode"
            defaultValue={preferences.defaultViewMode || "grid"}
          >
            <SelectTrigger className="border-border-light focus:border-brand">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Grid view</SelectItem>
              <SelectItem value="compact">Compact view</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Language" hint="More languages coming soon.">
        <Select
          name="language"
          defaultValue={preferences.language || "en"}
          disabled
        >
          <SelectTrigger className="border-border-light">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Spanish (Coming soon)</SelectItem>
            <SelectItem value="fr">French (Coming soon)</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <div className="pt-2">
        <Button
          type="submit"
          variant="brand"
          disabled={isPending}
          className="cursor-pointer"
        >
          {isPending ? "Saving..." : "Save preferences"}
        </Button>
      </div>
    </form>
  );
}
