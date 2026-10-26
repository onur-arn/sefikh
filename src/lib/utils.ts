import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Lecture tolérante d'un champ JSON stocké en chaîne (SQLite). */
export function parseList<T = string>(value: string | null | undefined): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toList(values: unknown): string {
  const arr = Array.isArray(values) ? values : [];
  return JSON.stringify([...new Set(arr.map((v) => String(v).trim()).filter(Boolean))]);
}

export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat("en-GB", opts).format(new Date(d));
}

export function formatRelative(d: Date | string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d ago`;
  return formatDate(d);
}

export function formatMoney(amountCents: number, currency = "eur") {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: amountCents % 100 ? 2 : 0 }).format(amountCents / 100);
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** URL de lecture d'un fichier stocké (servi par /files/[...key]). */
export function fileUrl(key: string | null | undefined) {
  return key ? `/files/${key}` : null;
}

/** Garde uniquement les redirections internes (évite les open redirects). */
export function safeNext(next: unknown, fallback = "/dashboard") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

/** Date décalée de `days` jours par rapport à maintenant (négatif = passé). */
export function daysFromNow(days: number) {
  return new Date(Date.now() + days * 86400_000);
}
