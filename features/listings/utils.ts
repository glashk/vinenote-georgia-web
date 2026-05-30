import type { Timestamp } from "firebase/firestore";
import { getThumbUrl, getResizeProxyUrl } from "@/lib/imageUtils";
import { LISTING_EXPIRY_DAYS } from "./types";

export type ListingImageSource = {
  photoUrls?: string[] | null;
  photoUrls200?: string[] | null;
  photoUrls400?: string[] | null;
  photoUrlsThumb?: string[] | null;
  imageUrl?: string | null;
  imageThumbUrl?: string | null;
  imageFullUrl?: string | null;
  image?: string | null;
  image200?: string | null;
  image400?: string | null;
  thumbnail?: string | null;
  photos?: string[] | null;
  mainImage?: string | null;
  photo?: string | null;
};

/** Size preference: 200 for cards, 400/600 for grid tiles (600 = sharper on large screens) */
export type ListingImageSize = 200 | 400 | 600;

/** Original upload URL for a photo (never a constructed thumb path). */
export function getListingOriginalPhotoUrl(
  listing: ListingImageSource | null,
  index = 0
): string | null {
  if (!listing) return null;
  return (
    listing.photoUrls?.[index] ??
    listing.photoUrls?.[0] ??
    listing.imageFullUrl ??
    listing.imageUrl ??
    listing.image ??
    listing.photos?.[index] ??
    listing.photos?.[0] ??
    listing.thumbnail ??
    listing.mainImage ??
    listing.photo ??
    null
  );
}

function distinctFallback(primary: string, ...candidates: (string | null | undefined)[]): string | null {
  for (const c of candidates) {
    if (c && c !== primary) return c;
  }
  return null;
}

/**
 * Returns the best image URL for grid/card display (prefer thumb).
 * Uses constructed thumb URL when DB lacks photoUrls200/400 but has Firebase Storage URL.
 * @param preferSize 200 for small cards (saves ~4x bandwidth), 400 for larger grid tiles
 */
export function getListingImage(
  listing: ListingImageSource | null,
  preferSize: ListingImageSize = 600
): string | null {
  const r = getListingImageWithFallback(listing, preferSize);
  return r?.primary ?? null;
}

/**
 * Returns { primary, fallback } for grid images.
 * 200 for cards, 400/600 for grid (600 = sharper; uses proxy since no thumb_600 in Storage).
 */
export function getListingImageWithFallback(
  listing: ListingImageSource | null,
  preferSize: ListingImageSize = 600
): {
  primary: string;
  fallback: string | null;
} | null {
  if (!listing) return null;
  const want200 = preferSize === 200;
  const want600 = preferSize === 600;
  const fromDb = want200
    ? listing.photoUrls200?.[0] ??
      listing.image200 ??
      listing.imageThumbUrl ??
      listing.photoUrlsThumb?.[0] ??
      listing.photoUrls400?.[0] ??
      listing.image400 ??
      null
    : listing.photoUrls400?.[0] ??
      listing.image400 ??
      listing.photoUrls200?.[0] ??
      listing.image200 ??
      listing.imageThumbUrl ??
      listing.photoUrlsThumb?.[0] ??
      null;
  const full = getListingOriginalPhotoUrl(listing, 0);
  if (fromDb) {
    return {
      primary: fromDb,
      fallback: distinctFallback(
        fromDb,
        full,
        getResizeProxyUrl(full, preferSize)
      ),
    };
  }
  if (!full) return null;
  const proxySize = preferSize;
  if (want600) {
    const proxyUrl = getResizeProxyUrl(full, 600);
    const thumb400 =
      full.includes("firebasestorage.googleapis.com") ||
      full.includes("storage.googleapis.com")
        ? getThumbUrl(full, 400)
        : null;
    const primary = proxyUrl ?? full;
    return { primary, fallback: distinctFallback(primary, thumb400, full) };
  }
  const thumbSize = preferSize as 200 | 400;
  if (full.includes("firebasestorage.googleapis.com") || full.includes("storage.googleapis.com")) {
    const thumb = getThumbUrl(full, thumbSize);
    if (thumb) {
      const proxyFallback = getResizeProxyUrl(full, proxySize);
      return {
        primary: thumb,
        fallback: distinctFallback(thumb, proxyFallback, full),
      };
    }
  }
  const proxyFallback = getResizeProxyUrl(full, proxySize);
  const primary = proxyFallback ?? full;
  return { primary, fallback: distinctFallback(primary, full) };
}

/**
 * Returns { low, high } for progressive loading: show low-res first, then swap to high-res.
 * low=80 when using proxy (tiny, fast), or 200 from DB/thumb. high=600.
 */
export function getListingImageProgressive(
  listing: ListingImageSource | null,
  preferSize: ListingImageSize = 600
): { low: string; high: string } | null {
  if (!listing) return null;
  if (preferSize !== 600) return null;
  const lowResult = getListingImageWithFallback(listing, 200);
  const highResult = getListingImageWithFallback(listing, 600);
  let low = lowResult?.primary;
  const high = highResult?.primary;
  if (!low || !high || low === high) return null;
  if (low.includes("wsrv.nl")) {
    const full =
      listing.photoUrls?.[0] ??
      listing.imageUrl ??
      listing.image ??
      listing.thumbnail ??
      null;
    if (full) {
      const tiny = getResizeProxyUrl(full, 80);
      if (tiny) low = tiny;
    }
  }
  return { low, high };
}

/**
 * Returns full-size image URL for detail/fullscreen view.
 */
export function getListingFullImage(listing: ListingImageSource | null): string | null {
  if (!listing) return null;
  return (
    getListingOriginalPhotoUrl(listing, 0) ??
    listing.photoUrls400?.[0] ??
    listing.photoUrls200?.[0] ??
    listing.image400 ??
    listing.image200 ??
    listing.imageThumbUrl ??
    listing.photoUrlsThumb?.[0] ??
    null
  );
}

/**
 * Returns photo URL for multi-photo listings by index.
 * type: 'thumb' for strip (prefer thumb_200), 'full' for main carousel.
 */
export function getListingPhotoUrl(
  listing: ListingImageSource | null,
  index: number,
  type: "thumb" | "full"
): string | null {
  const r = getListingPhotoUrlWithFallback(listing, index, type);
  return r?.primary ?? null;
}

/**
 * Returns { primary, fallback } for photo by index. Use primary first; on 404, fallback to original.
 */
export function getListingPhotoUrlWithFallback(
  listing: ListingImageSource | null,
  index: number,
  type: "thumb" | "full"
): { primary: string; fallback: string | null } | null {
  if (!listing) return null;
  if (type === "thumb") {
    const fromDb =
      listing.photoUrlsThumb?.[index] ??
      listing.photoUrlsThumb?.[0] ??
      listing.imageThumbUrl ??
      listing.photoUrls200?.[index] ??
      listing.photoUrls200?.[0] ??
      null;
    const full = getListingOriginalPhotoUrl(listing, index);
    if (fromDb) {
      return {
        primary: fromDb,
        fallback: distinctFallback(fromDb, full, getResizeProxyUrl(full, 200)),
      };
    }
    if (!full) return null;
    if (full.includes("firebasestorage.googleapis.com") || full.includes("storage.googleapis.com")) {
      const thumb = getThumbUrl(full, 200);
      if (thumb) {
        const proxyFallback = getResizeProxyUrl(full, 200);
        return {
          primary: thumb,
          fallback: distinctFallback(thumb, proxyFallback, full),
        };
      }
    }
    const proxyFallback = getResizeProxyUrl(full, 200);
    const primary = proxyFallback ?? full;
    return { primary, fallback: distinctFallback(primary, full) };
  }
  const fullUrl = getListingOriginalPhotoUrl(listing, index) ?? getListingFullImage(listing);
  if (!fullUrl) return null;

  const url400 =
    listing.photoUrls400?.[index] ?? (index === 0 ? listing.image400 : null);
  const proxy600 = getResizeProxyUrl(fullUrl, 600);
  const primary = proxy600 ?? fullUrl;
  return { primary, fallback: distinctFallback(primary, url400, fullUrl) };
}

/**
 * Returns { low, high } for progressive loading of a photo by index.
 * low=80 when proxy (tiny), or 200 from thumb. high=600.
 */
export function getListingPhotoUrlProgressive(
  listing: ListingImageSource | null,
  index: number
): { low: string; high: string } | null {
  if (!listing) return null;
  const lowResult = getListingPhotoUrlWithFallback(listing, index, "thumb");
  const highResult = getListingPhotoUrlWithFallback(listing, index, "full");
  let low = lowResult?.primary;
  const high = highResult?.primary;
  if (!low || !high || low === high) return null;
  if (low.includes("wsrv.nl")) {
    const full =
      listing.photoUrls?.[index] ??
      listing.photoUrls?.[0] ??
      listing.imageUrl ??
      null;
    if (full) {
      const tiny = getResizeProxyUrl(full, 80);
      if (tiny) low = tiny;
    }
  }
  return { low, high };
}

/**
 * @deprecated Use getListingImage for grid. Kept for backward compatibility.
 */
export function getListingImageUrl(listing: ListingImageSource | null): string | null {
  return getListingImage(listing);
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
