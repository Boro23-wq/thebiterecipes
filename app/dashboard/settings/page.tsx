import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  User as UserIcon,
  Settings as SettingsIcon,
  Bell,
  Database,
} from "lucide-react";

import { AccountSection } from "@/components/settings/account-section";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { DataManagement } from "@/components/settings/data-management";
import { NotificationsForm } from "@/components/settings/notifications-form";

function SectionCard(props: {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={props.id}>
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-sm bg-brand-50 p-2">{props.icon}</div>
        <div>
          <h2 className="text-base font-semibold text-text-primary">
            {props.title}
          </h2>
          <p className="text-xs text-text-secondary">{props.description}</p>
        </div>
      </div>

      <div className="rounded-sm bg-white p-6 shadow-sm shadow-black/7.5">
        {props.children}
      </div>
    </section>
  );
}

function NavItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm text-text-secondary hover:bg-brand-50 hover:text-brand transition-colors"
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Get or create user preferences
  let preferences = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, user.id),
  });

  if (!preferences) {
    const [newPreferences] = await db
      .insert(userPreferences)
      .values({ userId: user.id })
      .returning();
    preferences = newPreferences;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-medium text-text-secondary mb-1">
          Dashboard / Settings
        </p>
        <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Tune your experience, manage notifications, and control your data.
        </p>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar nav */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <nav className="space-y-0.5">
            <NavItem
              href="#account"
              label="Account"
              icon={<UserIcon className="h-4 w-4" />}
            />
            <NavItem
              href="#preferences"
              label="Preferences"
              icon={<SettingsIcon className="h-4 w-4" />}
            />
            <NavItem
              href="#notifications"
              label="Notifications"
              icon={<Bell className="h-4 w-4" />}
            />
            <NavItem
              href="#data"
              label="Data"
              icon={<Database className="h-4 w-4" />}
            />
          </nav>
        </aside>

        {/* Main */}
        <main className="space-y-10">
          <SectionCard
            id="account"
            icon={<UserIcon className="h-4 w-4 text-brand" />}
            title="Account"
            description="Your profile and security settings."
          >
            <AccountSection />
          </SectionCard>

          <SectionCard
            id="preferences"
            icon={<SettingsIcon className="h-4 w-4 text-brand" />}
            title="Preferences"
            description="Measurement, servings, view mode, and time format."
          >
            <PreferencesForm preferences={preferences} />
          </SectionCard>

          <SectionCard
            id="notifications"
            icon={<Bell className="h-4 w-4 text-brand" />}
            title="Notifications"
            description="Control which updates you receive."
          >
            <NotificationsForm preferences={preferences} />
          </SectionCard>

          <SectionCard
            id="data"
            icon={<Database className="h-4 w-4 text-brand" />}
            title="Data management"
            description="Export your recipes or delete your data."
          >
            <DataManagement />
          </SectionCard>
        </main>
      </div>
    </div>
  );
}
