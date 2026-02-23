"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { getDaysLeft, getExpiryProgress } from "../utils";
import type { Listing } from "../types";

interface ListingExpiryBarProps {
  listing: Listing;
}

export function ListingExpiryBar({ listing }: ListingExpiryBarProps) {
  const { t } = useLanguage();
  const status = listing.status ?? "active";

  if (status !== "active") return null;
  if (!listing.createdAt) return null;

  const daysLeft = getDaysLeft(listing.createdAt);
  const elapsedProgress = getExpiryProgress(listing.createdAt);

  // Bar shows time REMAINING (drains as days pass) to match "days left"
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
      <p className="mt-1.5 text-xs font-medium text-slate-600">
        {daysLeft > 0
          ? t("market.daysLeft").replace("{{count}}", String(daysLeft))
          : t("market.statusExpired")}
      </p>
    </div>
  );
}
