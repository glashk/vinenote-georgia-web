"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { ListingStatus } from "../types";
import { STATUS_COLORS } from "../utils";

interface ListingStatusBadgeProps {
  status: ListingStatus;
  className?: string;
}

const STATUS_KEYS: Record<ListingStatus, string> = {
  active: "market.statusActive",
  reserved: "market.statusReserved",
  sold: "market.statusSold",
  expired: "market.statusExpired",
  removed: "market.statusRemoved",
};

export function ListingStatusBadge({ status, className = "" }: ListingStatusBadgeProps) {
  const { t } = useLanguage();
  const color = STATUS_COLORS[status] ?? "#8a9a85";

  return (
    <span
      className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-semibold text-white shadow-sm ${className}`}
      style={{ backgroundColor: color }}
    >
      {t(STATUS_KEYS[status])}
    </span>
  );
}
