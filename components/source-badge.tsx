"use client";

import * as React from "react";
import { Copy, ExternalLink, Check } from "lucide-react";
import { cn } from "@/lib/utils";

function isHttpUrl(raw: string) {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function toDisplayLabel(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "Source";

  if (!isHttpUrl(trimmed)) return trimmed;

  try {
    const u = new URL(trimmed);
    const domain = u.hostname.replace(/^www\./, "");
    const path = u.pathname.split("/").filter(Boolean).slice(0, 2).join("/");
    return path ? `${domain}/${path}…` : domain;
  } catch {
    return "Source";
  }
}

export function SourceBadge({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const raw = (url ?? "").trim();
  const isLink = React.useMemo(() => isHttpUrl(raw), [raw]);
  const label = React.useMemo(() => toDisplayLabel(raw), [raw]);

  async function onCopy() {
    if (!raw) return;

    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = raw;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    }
  }

  if (!raw) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-sm bg-brand-100 px-2.5 py-1 text-xs",
        className,
      )}
      title={raw}
    >
      <span className="text-text-secondary">Source:</span>

      {isLink ? (
        <a
          href={raw}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium text-text-primary hover:underline break-all"
        >
          {label}
          <ExternalLink className="h-3.5 w-3.5 text-text-secondary" />
        </a>
      ) : (
        <span className="font-medium text-text-primary break-all">{label}</span>
      )}

      <span className="h-4 w-px bg-border-light" />

      {/* copy */}
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-brand" />
            <span className="text-brand">Copied</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </>
        )}
      </button>
    </span>
  );
}
