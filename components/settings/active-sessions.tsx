"use client";

import { useSessionList, useSession } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Monitor,
  Smartphone,
  Globe,
  LogOut,
  Loader2,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

function parseUserAgent(ua: string) {
  // Browser
  let browser = "Unknown browser";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  // OS
  let os = "Unknown OS";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  // Device type
  const isMobile =
    ua.includes("Mobile") ||
    ua.includes("Android") ||
    ua.includes("iPhone") ||
    ua.includes("iPad");

  return { browser, os, isMobile };
}

function formatLastActive(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 2) return "Active now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function SessionCard({
  session,
  isCurrent,
  onRevoke,
}: {
  session: {
    id: string;
    lastActiveAt: Date;
    latestActivity?: {
      browserName?: string;
      deviceType?: string;
      ipAddress?: string;
      city?: string;
      country?: string;
    };
  };
  isCurrent: boolean;
  onRevoke: (id: string) => Promise<void>;
}) {
  const [isRevoking, setIsRevoking] = useState(false);

  const activity = session.latestActivity;
  const browser = activity?.browserName ?? "Unknown browser";
  const deviceType = activity?.deviceType ?? "browser";
  const isMobile = deviceType === "mobile" || deviceType === "tablet";
  const location = [activity?.city, activity?.country]
    .filter(Boolean)
    .join(", ");
  const ip = activity?.ipAddress;
  const lastActive = formatLastActive(session.lastActiveAt);
  const isActiveNow = lastActive === "Active now";

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      await onRevoke(session.id);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="flex items-start justify-between gap-4 rounded-sm border border-border-light px-4 py-3">
      <div className="flex items-start gap-3">
        {/* Device icon */}
        <div className="mt-0.5 text-text-muted">
          {isMobile ? (
            <Smartphone className="h-4 w-4" />
          ) : (
            <Monitor className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0">
          {/* Browser + current badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">
              {browser}
            </span>
            {isCurrent && (
              <span className="rounded-sm bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
                This device
              </span>
            )}
          </div>

          {/* Details row */}
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-secondary">
            {location && (
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {location}
              </span>
            )}
            {ip && <span>{ip}</span>}
            <span className="flex items-center gap-1">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  isActiveNow ? "bg-green-500" : "bg-text-muted"
                }`}
              />
              {lastActive}
            </span>
          </div>
        </div>
      </div>

      {/* Revoke button (not for current session) */}
      {!isCurrent && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 cursor-pointer text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={handleRevoke}
          disabled={isRevoking}
        >
          {isRevoking ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
          )}
          {isRevoking ? "Revoking…" : "Revoke"}
        </Button>
      )}
    </div>
  );
}

export function ActiveSessions() {
  const { sessions, isLoaded } = useSessionList();
  const { session: currentSession } = useSession();
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-text-secondary">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading sessions…
      </div>
    );
  }

  const activeSessions = (sessions ?? []).filter((s) => s.status === "active");

  const otherSessions = activeSessions.filter(
    (s) => s.id !== currentSession?.id,
  );

  const handleRevoke = async (sessionId: string) => {
    const session = activeSessions.find((s) => s.id === sessionId);
    if (!session) return;

    try {
      await session.end();
      toast.success("Session revoked.");
    } catch {
      toast.error("Failed to revoke session. Try again.");
    }
  };

  const handleRevokeAll = async () => {
    if (otherSessions.length === 0) return;

    setIsRevokingAll(true);
    try {
      await Promise.all(otherSessions.map((s) => s.end()));
      toast.success(
        `Signed out of ${otherSessions.length} other session${otherSessions.length > 1 ? "s" : ""}.`,
      );
    } catch {
      toast.error("Failed to sign out of all sessions. Try again.");
    } finally {
      setIsRevokingAll(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-sm border border-border-light bg-brand-50/30 px-4 py-3">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <p className="text-xs leading-relaxed text-text-secondary">
          These are the devices currently signed in to your account. If you see
          a session you don&apos;t recognize, revoke it immediately and change
          your password.
        </p>
      </div>

      {/* Session list */}
      <div className="space-y-2">
        {activeSessions.length === 0 ? (
          <p className="py-4 text-center text-sm text-text-secondary">
            No active sessions found.
          </p>
        ) : (
          <>
            {/* Current session first */}
            {activeSessions
              .sort((a, b) => {
                if (a.id === currentSession?.id) return -1;
                if (b.id === currentSession?.id) return 1;
                return (
                  new Date(b.lastActiveAt).getTime() -
                  new Date(a.lastActiveAt).getTime()
                );
              })
              .map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  isCurrent={session.id === currentSession?.id}
                  onRevoke={handleRevoke}
                />
              ))}
          </>
        )}
      </div>

      {/* Sign out all others */}
      {otherSessions.length > 0 && (
        <div className="flex items-center justify-between rounded-sm border border-border-light px-4 py-3">
          <div>
            <p className="text-sm font-medium text-text-primary">
              Sign out all other sessions
            </p>
            <p className="text-xs text-text-secondary">
              This will revoke {otherSessions.length} other active session
              {otherSessions.length > 1 ? "s" : ""}.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 cursor-pointer text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={handleRevokeAll}
            disabled={isRevokingAll}
          >
            {isRevokingAll ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
            )}
            {isRevokingAll ? "Signing out…" : "Sign out all"}
          </Button>
        </div>
      )}
    </div>
  );
}
