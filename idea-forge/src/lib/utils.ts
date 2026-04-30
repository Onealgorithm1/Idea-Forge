import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 Optimised the function to get initials from a string.
 */
export function getInitials(title: string): string {
  let initials = "";
  let isNewWord = true;

  for (const char of title) {
    if (initials.length >= 2) {
      break;
    }
    if (char === " ") {
      isNewWord = true;
    } else if (isNewWord) {
      initials += char.toUpperCase();
      isNewWord = false;
    }
  }

  return initials;
}
/**
 * Checks if a string is a valid email address using a robust regex.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Constructs a viewable avatar URL.
 */
export function getAvatarUrl(avatarPath: string | undefined | null, name: string | undefined): string {
  if (!avatarPath) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'U'}`;
  }

  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }

  const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api$/, "");
  const normalizedPath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
  return `${baseUrl}${normalizedPath}`;
}
