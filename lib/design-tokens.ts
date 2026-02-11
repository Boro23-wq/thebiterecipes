// Design tokens for consistent styling across the app
// Import and use these instead of hardcoding classes

export const spacing = {
  section: "space-y-6",
  card: "space-y-3",
  cardLarge: "space-y-4",
  tight: "space-y-2",
  form: "space-y-4",
} as const;

export const text = {
  // Headings
  h1: "text-xl font-extrabold text-text-primary",
  h2: "text-base font-semibold text-text-primary",
  h3: "text-sm font-semibold text-text-primary",

  // Body text
  body: "text-sm text-text-primary",
  bodyLarge: "text-base text-text-primary",
  small: "text-xs text-text-secondary",
  muted: "text-xs text-text-muted",

  // Special
  label: "text-sm font-medium text-text-primary",
} as const;

export const card = {
  base: "bg-white rounded-md shadow-brand",
  baseSm: "bg-white rounded-md shadow-brand-sm",
  stats:
    "bg-brand-100 hover:bg-brand-200 transition-colors p-4 rounded-sm cursor-pointer",
  content: "bg-brand-100 p-4 rounded-sm",
  hover: "hover:shadow-brand-sm transition-all",
} as const;

export const layout = {
  page: "min-h-screen",
  container: "max-w-5xl mx-auto px-6",
  containerSmall: "max-w-3xl mx-auto px-6",
  grid2: "grid grid-cols-1 md:grid-cols-2 gap-4",
  grid3: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
  grid4: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3",
} as const;

export const input = {
  base: "border-gray-200 focus:border-brand focus:ring-brand",
} as const;

export const badge = {
  base: "inline-flex items-center gap-2 px-3 py-1.5 bg-brand-100 rounded-sm text-xs",
  label: "text-text-secondary",
  value: "font-medium text-text-primary",
} as const;

export const icon = {
  small: "h-3.5 w-3.5",
  base: "h-4 w-4",
  medium: "h-5 w-5",
  large: "h-10 w-10",
  xlarge: "h-12 w-12",
  brand: "text-brand",
  brandMuted: "text-brand/40",
} as const;
