"use client";

import {
  Home,
  BookOpen,
  FolderOpen,
  Heart,
  Settings,
  LogOut,
  CalendarPlus,
  ChevronRight,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

const topItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
];

const recipeSubItems = [
  {
    title: "All Recipes",
    url: "/dashboard/recipes",
  },
  {
    title: "Create Recipe",
    url: "/dashboard/recipes/new",
  },
  {
    title: "Import Recipe",
    url: "/dashboard/recipes/import",
  },
];

const bottomItems = [
  {
    title: "Create Meal Plan",
    url: "/dashboard/meal-plan",
    icon: CalendarPlus,
  },
  {
    title: "Favorites",
    url: "/dashboard/favorites",
    icon: Heart,
  },
];

const settingsItems = [
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

interface AppSidebarProps {
  categories: { id: string; name: string }[];
}

export function AppSidebar({ categories }: AppSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();

  const isRecipeSection = pathname.startsWith("/dashboard/recipes");

  const renderMenuItem = (item: {
    title: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => {
    const isActive = pathname === item.url;
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          className={`transition-all duration-200 ${
            isActive
              ? "bg-[#FFF5F0] text-[#FF6B35] hover:bg-[#FFF5F0] hover:text-[#FF6B35]"
              : "text-text-primary hover:bg-[#FFF5F0] hover:text-[#FF6B35]"
          }`}
        >
          <Link href={item.url}>
            <item.icon className="h-4 w-4 transition-colors duration-200" />
            <span className="text-sm">{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#FF6B35] text-white font-bold">
            B
          </div>
          <span className="font-semibold text-base text-text-primary">
            Bite
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-text-secondary font-medium">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dashboard */}
              {topItems.map(renderMenuItem)}

              {/* My Recipes - Collapsible */}
              <Collapsible
                defaultOpen={isRecipeSection}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className={`transition-all duration-200 cursor-pointer ${
                        isRecipeSection
                          ? "bg-[#FFF5F0]! text-[#FF6B35]! hover:bg-[#FFF5F0]! hover:text-[#FF6B35]!"
                          : "text-text-primary hover:bg-[#FFF5F0]! hover:text-[#FF6B35]!"
                      }`}
                    >
                      <BookOpen className="h-4 w-4 text-current transition-colors duration-200" />
                      <span className="text-sm">My Recipes</span>
                      <ChevronRight className="ml-auto h-4 w-4 text-current transition-all duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    <SidebarMenuSub>
                      {recipeSubItems.map((item) => {
                        const isActive = pathname === item.url;
                        return (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              className={`transition-all duration-200 relative ${
                                isActive
                                  ? "text-[#FF6B35] font-medium bg-[#FFF5F0] hover:bg-[#FFF5F0] hover:text-[#FF6B35]"
                                  : "text-text-secondary hover:text-[#FF6B35] hover:bg-[#FFF5F0]"
                              }`}
                            >
                              <Link href={item.url}>
                                {isActive && (
                                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-4 bg-[#FF6B35] rounded-r-full" />
                                )}
                                <span className="ml-2 text-sm">
                                  {item.title}
                                </span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Categories - Collapsible */}
              <Collapsible
                defaultOpen={pathname.startsWith("/dashboard/categories")}
                className="group/categories"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className={`transition-all duration-200 cursor-pointer ${
                        pathname.startsWith("/dashboard/categories")
                          ? "bg-[#FFF5F0]! text-[#FF6B35]! hover:bg-[#FFF5F0]! hover:text-[#FF6B35]!"
                          : "text-text-primary hover:bg-[#FFF5F0]! hover:text-[#FF6B35]!"
                      }`}
                    >
                      <FolderOpen className="h-4 w-4 text-current transition-colors duration-200" />
                      <span className="text-sm">Categories</span>
                      <ChevronRight className="ml-auto h-4 w-4 text-current transition-all duration-200 group-data-[state=open]/categories:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          className={`transition-all duration-200 relative ${
                            pathname === "/dashboard/categories"
                              ? "text-[#FF6B35] font-medium bg-[#FFF5F0] hover:bg-[#FFF5F0] hover:text-[#FF6B35]"
                              : "text-text-secondary hover:text-[#FF6B35] hover:bg-[#FFF5F0]"
                          }`}
                        >
                          <Link href="/dashboard/categories">
                            {pathname === "/dashboard/categories" && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-4 bg-[#FF6B35] rounded-r-full" />
                            )}
                            <span className="ml-2 text-sm">All Categories</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>

                      {categories.map((cat) => {
                        const catUrl = `/dashboard/categories/${cat.id}`;
                        const isActive = pathname === catUrl;
                        return (
                          <SidebarMenuSubItem key={cat.id}>
                            <SidebarMenuSubButton
                              asChild
                              className={`transition-all duration-200 relative ${
                                isActive
                                  ? "text-[#FF6B35] font-medium bg-[#FFF5F0] hover:bg-[#FFF5F0] hover:text-[#FF6B35]"
                                  : "text-text-secondary hover:text-[#FF6B35] hover:bg-[#FFF5F0]"
                              }`}
                            >
                              <Link href={catUrl}>
                                {isActive && (
                                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-4 bg-[#FF6B35] rounded-r-full" />
                                )}
                                <span className="ml-2 text-sm truncate">
                                  {cat.name}
                                </span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Rest of menu items */}
              {bottomItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-gray-200" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`transition-all duration-200 ${
                        isActive
                          ? "bg-[#FFF5F0] text-[#FF6B35] hover:bg-[#FFF5F0] hover:text-[#FF6B35]"
                          : "text-text-primary hover:bg-[#FFF5F0] hover:text-[#FF6B35]"
                      }`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4 transition-colors duration-200" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.imageUrl} />
            <AvatarFallback className="bg-[#FFF5F0] text-[#FF6B35] text-xs font-medium">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut()}
              className="transition-all duration-200 text-text-primary hover:bg-[#FFF5F0] hover:text-[#FF6B35]"
            >
              <LogOut className="h-4 w-4 transition-colors duration-200" />
              <span className="text-sm">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
