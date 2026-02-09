import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(
  cents: number | null,
  currency: string = "USD"
): string {
  if (cents === null) return "N/A";
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function formatOwners(owners: string): string {
  if (!owners) return "N/A";
  return owners;
}

export function formatPlaytime(minutes: number | null): string {
  if (minutes === null) return "N/A";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}
