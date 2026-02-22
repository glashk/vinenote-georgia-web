/**
 * Image URL utilities for optimized listing images.
 * Supports Firebase Storage thumbnails (thumb_200, thumb_400) with fallback to original.
 */

export type ImageContext = "card" | "detail" | "fullscreen";

/**
 * Constructs thumbnail URL from original Firebase Storage URL.
 * Cloud Function saves thumbs as: thumb_200_filename.jpg, thumb_400_filename.jpg
 */
export function getThumbUrl(originalUrl: string | null | undefined, size: 200 | 400): string | null {
  if (!originalUrl || typeof originalUrl !== "string") return null;
  try {
    const url = new URL(originalUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)$/);
    if (!pathMatch) return originalUrl;
    const decoded = decodeURIComponent(pathMatch[1]);
    const lastSlash = decoded.lastIndexOf("/");
    const dir = lastSlash >= 0 ? decoded.substring(0, lastSlash + 1) : "";
    const file = lastSlash >= 0 ? decoded.substring(lastSlash + 1) : decoded;
    const baseWithoutExt = file.replace(/\.[^.]+$/, "");
    const thumbFile = `thumb_${size}_${baseWithoutExt}.jpg`;
    const newPath = dir + thumbFile;
    const newPathname = url.pathname.replace(/\/o\/.+$/, "/o/" + encodeURIComponent(newPath));
    return `${url.origin}${newPathname}${url.search}`;
  } catch {
    return originalUrl;
  }
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

/** Blur placeholder (tiny gray 1x1 base64) for next/image */
export const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQACEQADAP/Z";
