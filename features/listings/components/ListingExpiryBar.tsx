"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { getDaysLeft, getExpiryProgress } from "../utils";
import type { Listing } from "../types";

interface ListingExpiryBarProps {
  listing: Listing;
}

function getBarColor(progress: number): string {
  if (progress < 0.5) return "bg-emerald-500";
  if (progress < 0.8) return "bg-amber-500";
  return "bg-red-500";
}

export function ListingExpiryBar({ listing }: ListingExpiryBarProps) {
  const { t } = useLanguage();
  const daysLeft = getDaysLeft(listing.createdAt);
  const progress = getExpiryProgress(listing.createdAt);
  const status = listing.status ?? "active";

  if (status !== "active") return null;

  const barColor = getBarColor(progress);

  return (
    <div className="mt-3">
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
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
