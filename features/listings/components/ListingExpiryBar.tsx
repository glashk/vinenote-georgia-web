"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDaysLeft, getExpiryProgress } from "../utils";
import type { Listing } from "../types";

interface ListingExpiryBarProps {
  listing: Listing;
}

export function ListingExpiryBar({ listing }: ListingExpiryBarProps) {
  const { t } = useLanguage();
  const status = listing.status ?? "active";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (status !== "active") return null;
  if (!listing.createdAt) return null;

  // Defer date calculations until after mount to avoid hydration mismatch.
  // Server and first client render use stable placeholder; real values after mount.
  const daysLeft = mounted ? getDaysLeft(listing.createdAt) : 0;
  const elapsedProgress = mounted ? getExpiryProgress(listing.createdAt) : 0;
  const remainingRatio = Math.max(0, 1 - elapsedProgress);
  const barWidth = daysLeft > 0 ? Math.max(5, remainingRatio * 100) : 0;

  return (
    <div className="mt-3">
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full  transition-all duration-300"
          style={{
            width: `${barWidth}%`,
            backgroundColor: daysLeft > 3 ? "#4a7c59" : "#c7772c",
          }}
        />
      </div>
      <p className="mt-1.5 text-xs font-medium text-slate-600" suppressHydrationWarning>
        {!mounted
          ? "\u00A0"
          : daysLeft > 0
            ? t("market.daysLeft").replace("{{count}}", String(daysLeft))
            : t("market.statusExpired")}
      </p>
    </div>
  );
}
