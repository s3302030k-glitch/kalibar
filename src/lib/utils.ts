import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert English digits to Persian digits
export function toPersianDigits(n: string | number): string {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n
    .toString()
    .replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
}

// Format price with thousands separator and Persian digits if needed
export const formatPrice = (price: number, isRTL: boolean = false) => {
  if (isRTL) {
    return new Intl.NumberFormat("fa-IR").format(price);
  }
  return new Intl.NumberFormat("en-US").format(price);
};
