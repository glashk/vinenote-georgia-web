import type { Timestamp } from "firebase/firestore";
import { LISTING_EXPIRY_DAYS } from "./types";

export function getListingImageUrl(listing: {
  photoUrls?: string[] | null;
  photoUrls200?: string[] | null;
  imageUrl?: string | null;
  image?: string | null;
  image200?: string | null;
  thumbnail?: string | null;
  photos?: string[] | null;
  mainImage?: string | null;
  photo?: string | null;
} | null): string | null {
  if (!listing) return null;
  return (
    listing.photoUrls?.[0] ??
    listing.photoUrls200?.[0] ??
    listing.imageUrl ??
    listing.image ??
    listing.image200 ??
    listing.thumbnail ??
    listing.photos?.[0] ??
    listing.mainImage ??
    listing.photo ??
    null
  );
}

export function getDaysLeft(
  createdAt:
    | Timestamp
    | { seconds: number; nanoseconds?: number }
    | Date
    | undefined
): number {
  if (!createdAt) return 0;
  const date = toDate(createdAt);
  if (!date) return 0;
  const expiry = new Date(date);
  expiry.setDate(expiry.getDate() + LISTING_EXPIRY_DAYS);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function getExpiryProgress(
  createdAt:
    | Timestamp
    | { seconds: number; nanoseconds?: number }
    | Date
    | undefined
): number {
  if (!createdAt) return 0;
  const date = toDate(createdAt);
  if (!date) return 0;
  const expiry = new Date(date);
  expiry.setDate(expiry.getDate() + LISTING_EXPIRY_DAYS);
  const now = new Date();
  const total = expiry.getTime() - date.getTime();
  const elapsed = now.getTime() - date.getTime();
  return Math.min(1, Math.max(0, elapsed / total));
}

function toDate(
  v: Timestamp | { seconds: number; nanoseconds?: number } | Date
): Date | null {
  if (v instanceof Date) return v;
  if (v && typeof (v as Timestamp).toDate === "function") {
    return (v as Timestamp).toDate();
  }
  if (v && typeof (v as { seconds: number }).seconds === "number") {
    const t = v as { seconds: number; nanoseconds?: number };
    return new Date(t.seconds * 1000 + (t.nanoseconds ?? 0) / 1_000_000);
  }
  return null;
}

export const CATEGORY_ICONS: Record<string, string> = {
  grapes: "🍇",
  wine: "🍷",
  nobati: "🥜",
  inventory: "📦",
  seedlings: "🌱",
};

export const CATEGORY_COLORS: Record<string, string> = {
  grapes: "#2d5a27",
  wine: "#872817",
  nobati: "#C7772C",
  inventory: "#5a6b7d",
  seedlings: "#4a7c59",
};

export const STATUS_COLORS: Record<string, string> = {
  active: "#4a7c59",
  reserved: "#c7772c",
  sold: "#6b6b6b",
  expired: "#8a9a85",
  removed: "#c44d2e",
};
