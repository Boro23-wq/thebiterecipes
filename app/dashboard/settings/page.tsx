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
  right?: React.ReactNode;
}) {
  return (
    <section
      id={props.id}
      className="rounded-sm border border-border-light bg-white shadow-xs"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border-light px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="rounded-sm border border-border-light bg-brand-50 p-2.5">
            {props.icon}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {props.title}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {props.description}
            </p>
          </div>
        </div>
        {props.right ? <div className="pt-1">{props.right}</div> : null}
      </div>

      <div className="px-6 py-6">{props.children}</div>
    </section>
  );
}

function NavItem({
  href,
  label,
  sublabel,
  icon,
}: {
  href: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="group flex items-start gap-3 rounded-sm px-3 py-2.5 hover:bg-brand-100"
    >
      <div className="mt-0.5 rounded-sm bg-brand-50 p-2 group-hover:bg-brand-100">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-text-primary">{label}</div>
        <div className="text-xs text-text-secondary">{sublabel}</div>
      </div>
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
      {/* Top header */}
      <div className="relative overflow-hidden rounded-sm border border-border-light bg-white p-6 shadow-xs">
        <div className="pointer-events-none absolute inset-0 opacity-[0.5]">
          <div className="absolute -top-24 -right-20 h-56 w-56 rounded-sm bg-brand-100 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 h-56 w-56 rounded-sm bg-brand-75 blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary">
                Dashboard / Settings
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-text-primary">
                Settings
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                Tune your experience, manage notifications, and control your
                data.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-sm border border-border-light bg-white px-3 py-1 text-xs text-text-secondary">
                Signed in as{" "}
                <span className="font-medium text-text-primary">
                  {user.emailAddresses?.[0]?.emailAddress ?? "—"}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-sm border border-border-light bg-white p-4 shadow-xs">
            <div className="px-2 pb-3">
              <div className="text-sm font-semibold text-text-primary">
                Sections
              </div>
              <div className="text-xs text-text-secondary">
                Jump to what you need.
              </div>
            </div>

            <div className="space-y-1">
              <NavItem
                href="#account"
                label="Account"
                sublabel="Profile + security"
                icon={<UserIcon className="h-4 w-4 text-brand" />}
              />
              <NavItem
                href="#preferences"
                label="Preferences"
                sublabel="Defaults + formatting"
                icon={<SettingsIcon className="h-4 w-4 text-brand" />}
              />
              <NavItem
                href="#notifications"
                label="Notifications"
                sublabel="Email + updates"
                icon={<Bell className="h-4 w-4 text-brand" />}
              />
              <NavItem
                href="#data"
                label="Data"
                sublabel="Export + delete"
                icon={<Database className="h-4 w-4 text-brand" />}
              />
            </div>

            <div className="mt-4 rounded-sm border border-border-light bg-brand-50 p-3">
              <div className="text-xs font-semibold text-text-primary">
                Pro tip
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                Keep “Default View” set to Grid if you mainly browse. Use
                Compact if you’re doing a lot of editing.
              </p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="space-y-6">
          <SectionCard
            id="account"
            icon={<UserIcon className="h-5 w-5 text-brand" />}
            title="Account"
            description="View your account details and manage profile/security."
          >
            <AccountSection user={user} />
          </SectionCard>

          <SectionCard
            id="preferences"
            icon={<SettingsIcon className="h-5 w-5 text-brand" />}
            title="Preferences"
            description="Set defaults for measurement, servings, view mode, and time format."
          >
            <PreferencesForm preferences={preferences} />
          </SectionCard>

          <SectionCard
            id="notifications"
            icon={<Bell className="h-5 w-5 text-brand" />}
            title="Notifications"
            description="Control which updates you receive and how often."
          >
            <NotificationsForm preferences={preferences} />
          </SectionCard>

          <SectionCard
            id="data"
            icon={<Database className="h-5 w-5 text-brand" />}
            title="Data management"
            description="Export your recipes or permanently delete your data."
          >
            <DataManagement />
          </SectionCard>
        </main>
      </div>
    </div>
  );
}
