import type { Timestamp } from "firebase/firestore";

export function toDate(
  ts: Timestamp | { seconds: number; nanoseconds?: number } | Date | undefined
): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof (ts as Timestamp).toDate === "function") {
    return (ts as Timestamp).toDate();
  }
  const t = ts as { seconds: number; nanoseconds?: number };
  if (typeof t.seconds === "number") {
    return new Date(t.seconds * 1000 + (t.nanoseconds ?? 0) / 1_000_000);
  }
  return null;
}

export function formatTimeAgo(
  ts: Timestamp | { seconds: number; nanoseconds?: number } | Date | undefined
): string {
  const date = toDate(ts);
  if (!date) return "-";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

import { getListingImage } from "@/features/listings/utils";
export const getListingImageUrl = getListingImage;

/**
 * Returns a thumbnail URL for Firebase Storage images (400px width).
 * Append to Storage URLs that support resize. Falls back to original if not applicable.
 */
export function getListingThumbnailUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.includes("firebasestorage.googleapis.com") && url.includes("alt=media")) {
    return `${url}${url.includes("?") ? "&" : "?"}width=400`;
  }
  return url;
}
