/**
 * Image URL utilities for optimized listing images.
 * Supports Firebase Storage thumbnails (thumb_200, thumb_400) with fallback to original.
 */

export type ImageContext = "card" | "detail" | "fullscreen";

const FIREBASE_STORAGE_HOSTS = [
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
];

function isFirebaseStorageUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return FIREBASE_STORAGE_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
}

/**
 * Constructs thumbnail URL from original Firebase Storage URL.
 * Cloud Function saves thumbs as: thumb_200_filename.jpg, thumb_400_filename.jpg
 * Uses ?alt=media for public read (storage rules allow read: true).
 */
export function getThumbUrl(originalUrl: string | null | undefined, size: 200 | 400): string | null {
  if (!originalUrl || typeof originalUrl !== "string") return null;
  if (!isFirebaseStorageUrl(originalUrl)) return null;
  try {
    const url = new URL(originalUrl);
    const pathMatch = url.pathname.match(/\/o\/([^?]+)/);
    if (!pathMatch) return null;
    const encodedPath = pathMatch[1];
    const decoded = decodeURIComponent(encodedPath);
    const lastSlash = decoded.lastIndexOf("/");
    const dir = lastSlash >= 0 ? decoded.substring(0, lastSlash + 1) : "";
    const file = lastSlash >= 0 ? decoded.substring(lastSlash + 1) : decoded;
    const baseWithoutExt = file.replace(/\.[^.]+$/, "");
    const thumbFile = `thumb_${size}_${baseWithoutExt}.jpg`;
    const newPath = dir + thumbFile;
    const newPathname = url.pathname.replace(/\/o\/[^?]+/, "/o/" + encodeURIComponent(newPath));
    return `${url.origin}${newPathname}?alt=media`;
  } catch {
    return null;
  }
}

/**
 * Build photoUrls200 and photoUrls400 from full photoUrls.
 * Use when saving listings so thumb URLs are in Firestore.
 */
export function buildThumbUrls(photoUrls: string[]): {
  photoUrls200: string[];
  photoUrls400: string[];
} {
  const urls200: string[] = [];
  const urls400: string[] = [];
  for (const url of photoUrls) {
    const t200 = getThumbUrl(url, 200);
    const t400 = getThumbUrl(url, 400);
    urls200.push(t200 ?? url);
    urls400.push(t400 ?? url);
  }
  return { photoUrls200: urls200, photoUrls400: urls400 };
}

/**
 * Returns the best image URL for a given context.
 * Uses original URL when thumbnails aren't in DB - constructed thumb URLs
 * fail because Firebase Storage tokens are per-file.
 */
export function getImageForContext(
  originalUrl: string | null | undefined,
  image200?: string | null,
  image400?: string | null,
  context: ImageContext = "card"
): string | null {
  if (!originalUrl) return null;
  switch (context) {
    case "card":
      return image200 ?? originalUrl;
    case "detail":
      return image400 ?? originalUrl;
    case "fullscreen":
      return originalUrl;
    default:
      return originalUrl;
  }
}

/**
 * Get photo URL for a specific index in a multi-photo listing.
 */
export function getPhotoUrlForContext(
  photoUrls: string[],
  index: number,
  context: ImageContext,
  photoUrls200?: string[] | null,
  photoUrls400?: string[] | null
): string | null {
  const original = photoUrls[index] ?? photoUrls[0];
  if (!original) return null;
  const thumb200 = photoUrls200?.[index] ?? photoUrls200?.[0];
  const thumb400 = photoUrls400?.[index] ?? photoUrls400?.[0];
  return getImageForContext(original, thumb200, thumb400, context);
}

/**
 * Resize proxy fallback when Firebase thumbs 404.
 * Uses wsrv.nl (free, open-source) to serve resized images so client never loads full-size.
 */
export function getResizeProxyUrl(
  originalUrl: string | null | undefined,
  width: number,
  height: number = width
): string | null {
  if (!originalUrl || typeof originalUrl !== "string") return null;
  if (!originalUrl.startsWith("http")) return null;
  try {
    const encoded = encodeURIComponent(originalUrl);
    return `https://wsrv.nl/?url=${encoded}&w=${width}&h=${height}&fit=cover`;
  } catch {
    return null;
  }
}

/** Blur placeholder (tiny gray 1x1 base64) for next/image */
export const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQACEQADAP/Z";
