import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(ts: bigint | number): string {
  const date = new Date(Number(ts) / 1000);
  return date.toLocaleString();
}
