"use client";

import Image from "next/image";
import { useState, useMemo, useEffect } from "react";
import {
  getListingImageWithFallback,
  getListingImageProgressive,
  getListingPhotoUrlWithFallback,
  getListingPhotoUrlProgressive,
} from "@/features/listings/utils";
import type { ListingImageSource } from "@/features/listings/utils";
import { BLUR_DATA_URL } from "@/lib/imageUtils";

const loadedUrls = new Set<string>();

const IMAGE_TRANSITION = "transition-opacity duration-500 ease-out";
const HIGH_RES_TRANSITION = "transition-opacity duration-700 ease-out";

interface ListingImageProps {
  listing?: ListingImageSource | null;
  src?: string | null;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  objectFit?: "cover" | "contain";
  onError?: () => void;
  variant?: "grid" | "card" | "detail" | "thumb";
  photoIndex?: number;
}

const DEFAULT_SIZES =
  "(max-width:768px) 50vw, (max-width:1200px) 33vw, 25vw";

export default function ListingImage({
  listing,
  src: srcProp,
  alt = "",
  className = "",
  sizes = DEFAULT_SIZES,
  priority = false,
  fill = true,
  objectFit = "cover",
  onError,
  variant = "grid",
  photoIndex,
}: ListingImageProps) {
  const { primary, fallback, progressive } = useMemo(() => {
    if (srcProp) return { primary: srcProp, fallback: null, progressive: null };
    const useProgressive = variant === "grid" || variant === "detail";
    if (photoIndex != null && listing) {
      if (useProgressive && variant !== "thumb") {
        const prog = getListingPhotoUrlProgressive(listing, photoIndex);
        if (prog) return { primary: prog.low, fallback: null, progressive: prog };
      }
      const r = getListingPhotoUrlWithFallback(
        listing,
        photoIndex,
        variant === "thumb" ? "thumb" : "full"
      );
      return { primary: r?.primary ?? "", fallback: r?.fallback ?? null, progressive: null };
    }
    if (variant === "detail") {
      const prog = getListingImageProgressive(listing ?? null, 600);
      if (prog) return { primary: prog.low, fallback: null, progressive: prog };
      const r = getListingImageWithFallback(listing ?? null, 600);
      return { primary: r?.primary ?? "", fallback: r?.fallback ?? null, progressive: null };
    }
    const preferSize = variant === "card" || variant === "thumb" ? 200 : 600;
    if (useProgressive) {
      const prog = getListingImageProgressive(listing ?? null, 600);
      if (prog) return { primary: prog.low, fallback: null, progressive: prog };
    }
    const r = getListingImageWithFallback(listing ?? null, preferSize);
    return { primary: r?.primary ?? "", fallback: r?.fallback ?? null, progressive: null };
  }, [listing, srcProp, photoIndex, variant]);

  const [currentSrc, setCurrentSrc] = useState(primary);
  const [loaded, setLoaded] = useState(false);
  const [highLoaded, setHighLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setCurrentSrc(primary);
    setLoaded(false);
    setHighLoaded(false);
    setErrored(false);
  }, [primary]);

  if (!primary || errored) {
    return (
      <div
        className={`animate-pulse bg-gray-200 ${className}`}
        style={fill ? { position: "absolute", inset: 0 } : undefined}
      />
    );
  }

  const handleError = () => {
    if (fallback && currentSrc === primary) {
      setCurrentSrc(fallback);
      setLoaded(false);
    } else {
      setErrored(true);
      onError?.();
    }
  };

  const effectiveSizes = variant === "thumb" ? "64px" : sizes;
  const showHigh = progressive && highLoaded;

  return (
    <>
      {!loaded && (
        <div
          className="absolute inset-0 animate-pulse bg-slate-200"
          aria-hidden
        />
      )}
      <Image
        key={currentSrc}
        src={currentSrc}
        alt={alt}
        fill={fill}
        sizes={effectiveSizes}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "low"}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        className={`${className} ${objectFit === "cover" ? "object-cover" : "object-contain"} ${IMAGE_TRANSITION} ${!loaded ? "opacity-0" : "opacity-100"}`}
        style={fill ? { position: "absolute", inset: 0 } : undefined}
        onLoad={() => {
          if (currentSrc) loadedUrls.add(currentSrc);
          setLoaded(true);
        }}
        onError={handleError}
        unoptimized
      />
      {progressive && loaded && (
        <Image
          key={progressive.high}
          src={progressive.high}
          alt={alt}
          fill={fill}
          sizes={effectiveSizes}
          priority={false}
          loading="eager"
          decoding="async"
          fetchPriority="low"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          className={`${className} ${objectFit === "cover" ? "object-cover" : "object-contain"} ${HIGH_RES_TRANSITION} ${!showHigh ? "opacity-0" : "opacity-100"}`}
          style={fill ? { position: "absolute", inset: 0 } : undefined}
          onLoad={() => setHighLoaded(true)}
          onError={() => {}}
          unoptimized
        />
      )}
    </>
  );
}
