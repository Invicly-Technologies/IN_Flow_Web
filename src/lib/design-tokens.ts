/**
 * Centralized Invicly Flow design tokens.
 *
 * This is the single source of truth for brand colors. Never hardcode a hex
 * value in a component or page — import from here (or the CSS variables it
 * generates, consumed via Tailwind's `bg-brand-primary` etc. utility classes).
 */

export const colors = {
  primary: "#6D3DF5",
  blue: "#315CFF",
  cyan: "#19C8E8",
  dark: "#0B1424",
  darkSurface: "#111C2E",
  darkSurface2: "#16223A",
  darkBorder: "#223052",
  background: "#F7F9FC",
  white: "#FFFFFF",
  border: "#E5EAF2",
  text: "#152033",
  textSecondary: "#64748B",
  textFaint: "#94A3B8",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
} as const;

export const gradients = {
  flow: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.blue} 55%, ${colors.cyan} 100%)`,
  flowSoft: `linear-gradient(135deg, rgba(109,61,245,.12), rgba(49,92,255,.10) 55%, rgba(25,200,232,.12))`,
} as const;

export const priorityColors: Record<"P1" | "P2" | "P3" | "P4", string> = {
  P1: colors.danger,
  P2: colors.warning,
  P3: colors.blue,
  P4: colors.textFaint,
};

export const statusColors: Record<
  "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
  string
> = {
  TODO: colors.dark,
  IN_PROGRESS: colors.blue,
  COMPLETED: colors.success,
  CANCELLED: colors.danger,
};

export type ColorToken = keyof typeof colors;
