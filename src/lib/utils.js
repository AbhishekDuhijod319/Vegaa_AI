import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Light-mode-only: stubbed theme helpers (no-ops)
export const theme = {
  isDark: () => false,
  setDark: () => {},
  init: () => {},
}