import type { Appearance } from "@clerk/types";

export const biteClerkAppearance: Appearance = {
  variables: {
    colorPrimary: "#FF6B35",
    colorBackground: "#FEFEFE",
    colorForeground: "#1A1A1A",
    colorMutedForeground: "#6B7280",
    colorInput: "#FFFFFF",
    colorInputForeground: "#1A1A1A",
    borderRadius: "0.25rem", // 4px = rounded-sm
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  },
  layout: {
    socialButtonsPlacement: "top",
    socialButtonsVariant: "blockButton",
    logoPlacement: "inside",
    shimmer: true,
    animations: true,
  },
};
