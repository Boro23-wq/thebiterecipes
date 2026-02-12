import { User } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { CopyToClipboard } from "@/components/settings/copy-to-clipboard";

interface AccountSectionProps {
  user: User;
}

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
    <div className="rounded-sm border border-border-light bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-text-secondary">{label}</div>
          <div className="mt-1 truncate text-sm font-semibold text-text-primary">
            {value}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

export function AccountSection({ user }: AccountSectionProps) {
  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const fullName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-sm border border-border-light bg-brand-50 text-brand">
            <span className="text-sm font-bold">
              {(user.firstName?.[0] ?? "U").toUpperCase()}
              {(user.lastName?.[0] ?? "").toUpperCase()}
            </span>
          </div>

          <div>
            <div className="text-sm font-semibold text-text-primary">
              {fullName}
            </div>
            <div className="text-sm text-text-secondary">{email || "—"}</div>
          </div>
        </div>

        <Button variant="outline" asChild className="cursor-pointer">
          <a
            href="/dashboard/settings/account"
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            Manage in Clerk
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <InfoTile label="Full name" value={fullName} />
        <InfoTile
          label="Email"
          value={email || "—"}
          action={email ? <CopyToClipboard value={email} /> : null}
        />
      </div>

      <div className="rounded-sm border border-border-light bg-brand-50 p-4">
        <p className="text-sm text-text-secondary">
          For password changes, MFA, connected accounts, and other security
          settings, use the Clerk account page.
        </p>
      </div>
    </div>
  );
}
