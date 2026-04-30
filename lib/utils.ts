// ============================================================================
// Common utilities
// ============================================================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Hash an IP for anti-abuse without storing the raw IP
 */
export async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + (process.env.IP_HASH_SALT || 'cha-awards-2026'));
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

/**
 * Format a phone number to E.164 (e.g. "0812..." → "+62812...")
 * Bali default: Indonesia +62
 */
export function normalizePhoneNumber(phone: string, defaultCountry = '62'): string {
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('0')) return `+${defaultCountry}${cleaned.substring(1)}`;
  if (cleaned.startsWith(defaultCountry)) return `+${cleaned}`;
  return `+${defaultCountry}${cleaned}`;
}

/**
 * Get applicant initials for avatar fallback
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/**
 * Category color mapping
 */
export const categoryColors = {
  boutique: { bg: 'bg-coral', text: 'text-coral', border: 'border-coral', light: 'bg-coral/10' },
  growing:  { bg: 'bg-teal', text: 'text-teal', border: 'border-teal', light: 'bg-teal/10' },
  scaled:   { bg: 'bg-burgundy', text: 'text-burgundy', border: 'border-burgundy', light: 'bg-burgundy/10' },
} as const;

/**
 * Format a date for display
 */
export function formatDate(date: string | Date, locale: 'en' | 'id' = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get time remaining until deadline
 */
export function timeRemaining(deadline: string | Date) {
  const target = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return { ended: true, days: 0, hours: 0, minutes: 0 };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  return { ended: false, days, hours, minutes };
}

/**
 * Generate WhatsApp share URL with pre-filled message
 */
export function generateWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Generate LinkedIn share URL
 */
export function generateLinkedInShareUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}
