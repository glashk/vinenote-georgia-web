"use client";

import { useState, useEffect } from "react";
import { getImageForContext } from "@/lib/imageUtils";

type ImageContext = "card" | "detail" | "fullscreen";

interface OptimizedListingImageProps {
  src: string | null | undefined;
  image200?: string | null;
  image400?: string | null;
  context?: ImageContext;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  objectFit?: "cover" | "contain";
}

/**
 * Optimized listing image: uses thumbnails when available, falls back to original.
 * Uses native img for reliable loading with Firebase Storage URLs.
 */
export default function OptimizedListingImage({
  src,
  image200,
  image400,
  context = "card",
  alt = "",
  className = "",
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw",
  priority = false,
  fill = true,
  width,
  height,
  objectFit = "cover",
}: OptimizedListingImageProps) {
  const primaryUrl = getImageForContext(src, image200, image400, context);
  const fallbackUrl = src ?? null;
  const [currentUrl, setCurrentUrl] = useState(primaryUrl ?? fallbackUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const url = primaryUrl ?? fallbackUrl;
    if (url) setCurrentUrl(url);
  }, [primaryUrl, fallbackUrl]);

  if (!currentUrl) return null;

  const handleError = () => {
    if (!failed && fallbackUrl && currentUrl !== fallbackUrl) {
      setCurrentUrl(fallbackUrl);
      setFailed(true);
    }
  };

  const style = objectFit === "cover" ? { objectFit: "cover" as const } : { objectFit: "contain" as const };

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={currentUrl}
        alt={alt}
        className={className}
        style={{ ...style, width: "100%", height: "100%", position: "absolute", inset: 0 }}
        loading={priority ? "eager" : "lazy"}
        onError={handleError}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentUrl}
      alt={alt}
      width={width ?? 200}
      height={height ?? 200}
      className={className}
      style={style}
      loading={priority ? "eager" : "lazy"}
      onError={handleError}
    />
  );
}

/** Small thumbnail for carousel strips - uses image200 or constructs thumb URL */
export function ThumbnailImage({
  src,
  image200,
  alt = "",
  className = "",
  fill,
}: {
  src: string | null | undefined;
  image200?: string | null;
  alt?: string;
  className?: string;
  fill?: boolean;
}) {
  const primaryUrl = image200 ?? src;
  const fallbackUrl = src ?? null;
  const [currentUrl, setCurrentUrl] = useState(primaryUrl ?? fallbackUrl);
  const [triedFallback, setTriedFallback] = useState(false);

  useEffect(() => {
    const url = primaryUrl ?? fallbackUrl;
    if (url) setCurrentUrl(url);
  }, [primaryUrl, fallbackUrl]);

  if (!currentUrl) return null;

  const handleError = () => {
    if (!triedFallback && fallbackUrl && currentUrl !== fallbackUrl) {
      setCurrentUrl(fallbackUrl);
      setTriedFallback(true);
    }
  };

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={currentUrl}
        alt={alt}
        className={className}
        style={{ objectFit: "cover", width: "100%", height: "100%", position: "absolute", inset: 0, pointerEvents: "none" }}
        loading="lazy"
        onError={handleError}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentUrl}
      alt={alt}
      width={64}
      height={64}
      className={className}
      style={{ objectFit: "cover" }}
      loading="lazy"
      onError={handleError}
    />
  );
}
