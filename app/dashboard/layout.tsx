import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { categories, userPreferences } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { PreferencesProvider } from "@/lib/preferences-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  const userCategories = user
    ? await db.query.categories.findMany({
        where: eq(categories.userId, user.id),
        orderBy: [desc(categories.createdAt)],
        columns: { id: true, name: true },
      })
    : [];

  // Fetch user preferences (null if none exist yet)
  const prefs = user
    ? await db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, user.id),
      })
    : null;

  return (
    <SidebarProvider>
      <PreferencesProvider
        value={
          prefs
            ? {
                measurementUnit: prefs.measurementUnit ?? "imperial",
                defaultServings: prefs.defaultServings ?? 4,
                timeFormat: prefs.timeFormat ?? "12",
                defaultViewMode: prefs.defaultViewMode ?? "grid",
              }
            : null
        }
      >
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar categories={userCategories} />
          <main className="flex-1 min-w-0">
            <div className="border-b">
              <div className="flex h-16 items-center px-6">
                <SidebarTrigger />
              </div>
            </div>
            <div className="p-6">{children}</div>
          </main>
        </div>
      </PreferencesProvider>
    </SidebarProvider>
  );
}
