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
  background: "#F7F9FC",
  white: "#FFFFFF",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
} as const;

export const gradients = {
  flow: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.blue} 55%, ${colors.cyan} 100%)`,
} as const;

export const priorityColors: Record<"P1" | "P2" | "P3" | "P4", string> = {
  P1: colors.danger,
  P2: colors.warning,
  P3: colors.blue,
  P4: colors.dark,
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
