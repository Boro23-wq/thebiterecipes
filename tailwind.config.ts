import type { Config } from "tailwindcss";

export default {
  darkMode: "class",

  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        xl: "1100px",
      },
    },

    extend: {
      colors: {
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
          border: "#FFEFC2",
        },

        text: {
          primary: "#1a1a1a",
          secondary: "#666666",
          muted: "#999999",
        },

        yellow: {
          DEFAULT: "#F7B801",
        },

        surface: {
          1: "#FAFAFA",
          2: "#F5F2EF",
          3: "#EEEBE7",
        },

        border: {
          DEFAULT: "hsl(var(--border))",
          faint: "rgba(0,0,0,0.03)",
          light: "rgba(0,0,0,0.05)",
          subtle: "rgba(0,0,0,0.08)",
          default: "#E5E5E5",
          "brand-light": "rgba(255,107,53,0.15)",
          "brand-subtle": "rgba(255,107,53,0.25)",
          "brand-dark": "rgba(255,107,53,0.5)",
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
        xs: "0 1px 3px rgba(0,0,0,0.06)",
        sm: "0 3px 10px rgba(0,0,0,0.08)",
        md: "0 8px 20px rgba(0,0,0,0.10)",
        lg: "0 14px 35px rgba(0,0,0,0.12)",
        brand: "0 6px 20px rgba(255,107,53,0.18)",
        "brand-sm": "0 3px 10px rgba(255,107,53,0.08)",
        "brand-focus": "0 4px 12px rgba(255,107,53,0.18)",
        "brand-lg": "0 12px 40px rgba(255,107,53,0.28)",
        menu: "0 -4px 20px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06)",
        dropdown: "0 16px 40px rgba(0,0,0,0.12)",
      },

      fontFamily: {
        serif: ["Playfair Display", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },

      fontSize: {
        // Landing-specific display sizes
        "display-sm": [
          "clamp(2.5rem, 5vw, 3.5rem)",
          { lineHeight: "1.05", letterSpacing: "-0.04em" },
        ],
        "display-md": [
          "clamp(3rem, 6vw, 5rem)",
          { lineHeight: "1.03", letterSpacing: "-0.05em" },
        ],
        "display-lg": [
          "clamp(3.5rem, 7vw, 6rem)",
          { lineHeight: "1.02", letterSpacing: "-0.05em" },
        ],
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.4)", opacity: "0.6" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },

      animation: {
        "fade-up": "fade-up 0.6s ease both",
        "pulse-dot": "pulse-dot 1.8s ease-in-out infinite",
        blink: "blink 0.8s step-end infinite",
      },
    },
  },

  plugins: [],
} satisfies Config;
