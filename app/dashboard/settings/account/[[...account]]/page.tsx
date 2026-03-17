import { UserProfile } from "@clerk/nextjs";

export default function AccountSecurityPage() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-text-muted">Settings</p>
        <h1 className="mt-1 text-3xl font-semibold text-text-primary">
          Security & account
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Manage your password, connected accounts, and security settings.
        </p>
      </div>

      {/* Clerk UserProfile */}
      <UserProfile
        routing="path"
        path="/dashboard/settings/account"
        appearance={{
          variables: {
            colorPrimary: "#FF6B35",
            colorDanger: "#ef4444",
            colorSuccess: "#22c55e",
            colorWarning: "#f59e0b",
            colorBackground: "#FEFEFE",
            colorInputBackground: "#FFFFFF",
            colorInputText: "#1A1A1A",
            colorText: "#1A1A1A",
            colorTextSecondary: "#6B7280",
            borderRadius: "0.125rem",
            fontFamily: "var(--font-geist-sans)",
            fontSize: "0.875rem",
          },
          elements: {
            // Root & card — kill all shadows
            rootBox: "w-full",
            card: "[box-shadow:none!important] border border-border-light !rounded-sm w-full",
            cardBox: "[box-shadow:none!important]",

            // Navbar
            navbar: "border-r border-border-light",
            navbarButton:
              "text-sm text-text-secondary hover:text-brand hover:bg-brand-50 !rounded-sm",
            navbarButtonIcon: "h-4 w-4",
            navbarMobileMenuButton: "text-text-secondary",

            // Page
            pageScrollBox: "p-6",
            page: "[box-shadow:none!important]",

            // Headers
            headerTitle: "text-base font-semibold text-text-primary",
            headerSubtitle: "text-sm text-text-secondary",

            // Profile section
            profileSection: "border-border-light",
            profileSectionPrimaryButton:
              "text-brand hover:text-[#e55a2b] !rounded-sm",
            profileSectionContent: "[box-shadow:none!important]",

            // Form elements
            formFieldLabel: "text-sm font-medium text-text-primary",
            formFieldInput:
              "!rounded-sm border-border-light [box-shadow:none!important] focus:border-brand focus:ring-2 focus:ring-brand/20",
            formFieldSuccessText: "text-xs",
            formFieldErrorText: "text-xs text-red-500",
            formButtonPrimary:
              "bg-brand hover:bg-[#e55a2b] !rounded-sm text-white font-medium [box-shadow:none!important]",
            formButtonReset: "text-brand hover:text-[#e55a2b] !rounded-sm",

            // Buttons & actions
            button: "!rounded-sm [box-shadow:none!important]",
            avatarImageActionsUpload: "text-brand",
            badge: "!rounded-sm",
            tag: "!rounded-sm",

            // Alerts
            alert:
              "!rounded-sm border-border-light [box-shadow:none!important]",
            alertText: "text-sm",

            // Menu & modals
            menuButton: "!rounded-sm",
            menuList:
              "[box-shadow:none!important] border border-border-light !rounded-sm",
            menuItem: "!rounded-sm text-sm",
            modalBackdrop: "bg-black/40",
            modalContent: "!rounded-sm [box-shadow:none!important]",

            // Footer
            footer: "hidden",
            footerAction: "text-brand",
          },
        }}
      />
    </div>
  );
}
