import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getClassName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]+/g, ' ') // Replace non-alphanumeric characters with space
    .trim()                         // Trim leading/trailing spaces
    .split(/\s+/)                   // Split by one or more spaces
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize
    .join('');
}
