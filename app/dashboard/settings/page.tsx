import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";

import {
  Settings,
  Bell,
  Database,
  CircleUser,
  MonitorSmartphone,
} from "lucide-react";

import { AccountSection } from "@/components/settings/account-section";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { DataManagement } from "@/components/settings/data-management";
import { NotificationsForm } from "@/components/settings/notifications-form";
import { ActiveSessions } from "@/components/settings/active-sessions";

function Section({
  id,
  icon,
  title,
  description,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="border-b border-border-light pb-10 last:border-none"
    >
      <div className="mb-6 flex items-start gap-3">
        <div className="mt-1 text-text-muted">{icon}</div>

        <div>
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>

          <p className="mt-1 max-w-xl text-sm text-text-secondary">
            {description}
          </p>
        </div>
      </div>

      <div className="pl-7">{children}</div>
    </section>
  );
}

function NavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      className="
      flex items-center gap-2
      rounded-md
      px-3 py-2
      text-sm
      text-text-secondary
      hover:bg-brand-50
      hover:text-brand
      transition-colors
      "
    >
      {icon}
      {label}
    </a>
  );
}

export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  let preferences = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, user.id),
  });

  if (!preferences) {
    const [created] = await db
      .insert(userPreferences)
      .values({ userId: user.id })
      .returning();

    preferences = created;
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}

      <div className="mb-12">
        <p className="text-xs text-text-muted">Settings</p>

        <h1 className="mt-1 text-3xl font-semibold text-text-primary">
          Your settings
        </h1>

        <p className="mt-2 text-sm text-text-secondary">
          Manage your account, preferences, and data.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}

        <aside className="hidden lg:block sticky top-8 self-start">
          <nav className="space-y-1">
            <NavItem
              href="#account"
              label="Account"
              icon={<CircleUser className="h-4 w-4" />}
            />

            <NavItem
              href="#preferences"
              label="Preferences"
              icon={<Settings className="h-4 w-4" />}
            />

            <NavItem
              href="#notifications"
              label="Notifications"
              icon={<Bell className="h-4 w-4" />}
            />

            <NavItem
              href="#sessions"
              label="Sessions"
              icon={<MonitorSmartphone className="h-4 w-4" />}
            />

            <NavItem
              href="#data"
              label="Data"
              icon={<Database className="h-4 w-4" />}
            />
          </nav>
        </aside>

        {/* Main content */}

        <main className="space-y-12">
          <Section
            id="account"
            icon={<CircleUser className="h-4 w-4" />}
            title="Account"
            description="Manage your profile and authentication."
          >
            <AccountSection />
          </Section>

          <Section
            id="preferences"
            icon={<Settings className="h-4 w-4" />}
            title="Preferences"
            description="Customize measurement units, servings, and display settings."
          >
            <PreferencesForm preferences={preferences} />
          </Section>

          <Section
            id="notifications"
            icon={<Bell className="h-4 w-4" />}
            title="Notifications"
            description="Control which updates you receive."
          >
            <NotificationsForm preferences={preferences} />
          </Section>

          <Section
            id="sessions"
            icon={<MonitorSmartphone className="h-4 w-4" />}
            title="Active sessions"
            description="View and manage devices signed in to your account."
          >
            <ActiveSessions />
          </Section>

          <Section
            id="data"
            icon={<Database className="h-4 w-4" />}
            title="Data management"
            description="Export your recipes or permanently delete your data."
          >
            <DataManagement />
          </Section>
        </main>
      </div>
    </div>
  );
}
