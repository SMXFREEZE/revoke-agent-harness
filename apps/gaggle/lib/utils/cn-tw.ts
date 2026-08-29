import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind-aware class combiner for ui-layouts / shadcn components.
 * clsx resolves conditionals; tailwind-merge dedupes conflicting Tailwind
 * utilities (e.g. "px-2 px-4" -> "px-4"). Kept SEPARATE from the existing
 * plain-join `cn` in ./cn.ts so legacy .rz call sites are untouched.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
