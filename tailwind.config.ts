import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // brand colors - direct oklch values
        brand: {
          DEFAULT: "#FF6B35",
          50: "#FFFAF7",
          100: "#FFF9F5",
          200: "#FFF4ED",
          300: "#FFEFE6",
          400: "#FFE5D9",
          500: "#FF6B35",
          600: "#E55A2A",
          highlight: "#FFFBF0",
          border: "#FFEFC2", // Light orange for pills/badges
        },
        // Text hierarchy
        text: {
          primary: "#1a1a1a",
          secondary: "#666666",
          muted: "#999999",
        },
        // Yellow accent for ratings
        yellow: {
          DEFAULT: "#F7B801",
        },
        border: {
          DEFAULT: "hsl(var(--border))",
          faint: "rgba(0, 0, 0, 0.03)",
          light: "rgba(0, 0, 0, 0.05)",
          subtle: "rgba(0, 0, 0, 0.08)",
          default: "#E5E5E5",
          "brand-light": "rgba(255, 107, 53, 0.15)", // Light orange
          "brand-subtle": "rgba(255, 107, 53, 0.25)", // Subtle orange
          "brand-dark": "rgba(255, 107, 53, 0.5)", // Dark orange
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        // border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      boxShadow: {
        // Neutral shadows (use these for layout/cards)
        xs: "0 1px 2px rgba(0, 0, 0, 0.04)",
        sm: "0 2px 6px rgba(0, 0, 0, 0.05)",
        md: "0 4px 12px rgba(0, 0, 0, 0.06)",

        // Brand shadows (use sparingly)
        brand: "0 4px 16px rgba(255, 107, 53, 0.08)",
        "brand-sm": "0 2px 8px rgba(255, 107, 53, 0.06)",
        "brand-focus": "0 2px 4px rgba(255, 107, 53, 0.15)",

        // Component-specific shadows
        menu: "0 -2px 12px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)",
        dropdown: "0 10px 30px rgba(0, 0, 0, 0.08)", // For filter dropdown
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
} satisfies Config;
