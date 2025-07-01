import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isAdminEmail = (email?: string) => {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  console.log(adminEmail);
  
  return email && adminEmail && email.toLowerCase() === adminEmail.toLowerCase();
};