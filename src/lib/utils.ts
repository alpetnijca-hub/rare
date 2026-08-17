import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createHash, randomBytes } from "node:crypto";

/** Tailwind-Klassen zusammenführen (Konflikte gewinnen rechts). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** URL-tauglicher Slug aus einem Produktnamen. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Erzeugt eine menschenlesbare Bestellnummer, z. B. "RS-260817-4KD9P".
 * Die Zufallskomponente verhindert, dass sich Bestellnummern erraten lassen.
 */
export function generateOrderNumber(date = new Date()): string {
  const yy = String(date.getUTCFullYear()).slice(-2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  // Ohne I, O, 0, 1 – verwechslungsarm am Telefon.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(5);
  let suffix = "";
  for (const byte of bytes) suffix += alphabet[byte % alphabet.length];
  return `RS-${yy}${mm}${dd}-${suffix}`;
}

/**
 * Hasht eine IP-Adresse für datenschutzfreundliches Logging.
 * Es wird niemals die Klartext-IP gespeichert.
 */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.AUTH_SECRET ?? "rare-scents";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** Client-IP aus den üblichen Proxy-Headern (Vercel setzt x-forwarded-for). */
export function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip");
}

/** Kürzt Text auf eine maximale Länge und hängt ein Auslassungszeichen an. */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

/** Datum im Schweizer Format, z. B. "17.08.2026". */
export function formatDate(date: Date | string): string {
  const value = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

/** Datum mit Uhrzeit, z. B. "17.08.2026, 14:05". */
export function formatDateTime(date: Date | string): string {
  const value = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

/** Entfernt Steuerzeichen und begrenzt die Länge von Freitexteingaben. */
export function sanitizeText(input: string, maxLength = 2000): string {
  return input
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);
}
