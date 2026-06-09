import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSGD(amount: number | null | undefined): string {
  if (amount == null) return "—";
  if (amount >= 1_000_000) return `S$${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `S$${(amount / 1_000).toFixed(0)}k`;
  return `S$${amount}`;
}
