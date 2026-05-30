"use client";

import { Eye } from "lucide-react";
import { getListingViewsCount } from "@/features/listings/analytics";

interface ListingViewsBadgeProps {
  listing: { viewsCount?: number | null } | null | undefined;
  className?: string;
  size?: "sm" | "md";
}

export default function ListingViewsBadge({
  listing,
  className = "",
  size = "sm",
}: ListingViewsBadgeProps) {
  const count = getListingViewsCount(listing);
  const iconSize = size === "md" ? 16 : 14;
  const textClass = size === "md" ? "text-sm" : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 text-slate-500 tabular-nums ${textClass} ${className}`}
      title={`${count} views`}
    >
      <Eye size={iconSize} strokeWidth={2} aria-hidden />
      <span>{count.toLocaleString()}</span>
    </span>
  );
}
