import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// gabungkan class Tailwind dengan aman (gaya shadcn/ui)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// format rupiah sederhana (dummy data & nanti dipakai API)
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}
