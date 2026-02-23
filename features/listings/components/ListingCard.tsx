"use client";

import { memo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import OptimizedListingImage from "@/components/OptimizedListingImage";
import { getListingImageUrl, CATEGORY_ICONS, CATEGORY_COLORS } from "../utils";
import type { Listing, ListingStatus } from "../types";
import { ListingStatusBadge } from "./ListingStatusBadge";
import { ListingExpiryBar } from "./ListingExpiryBar";
import { ListingActionsMenu } from "./ListingActionsMenu";

interface ListingCardProps {
  listing: Listing;
  onUpdateStatus: (id: string, status: ListingStatus) => void;
  onRemove: (id: string) => void;
  onDelete: (id: string) => void;
}

function getUnitLabel(t: (k: string) => string, unit: string): string {
  const key = `market.units.${unit}`;
  const label = t(key);
  return label === key ? unit : label;
}

export const ListingCard = memo(function ListingCard({
  listing,
  onUpdateStatus,
  onRemove,
  onDelete,
}: ListingCardProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const status = (listing.status ?? "active") as ListingStatus;
  const photoUrl = getListingImageUrl(listing);
  const variety =
    listing.variety ?? listing.title ?? t("market.unknownListing");
  const region =
    [listing.region, listing.village].filter(Boolean).join(", ") || "—";
  const isRemoved = status === "removed";
  const isExpired = status === "expired";
  const isSold = status === "sold";

  const handleEdit = useCallback(() => {
    router.push(`/my-listings/edit?id=${listing.id}`);
  }, [router, listing.id]);

  const handleView = useCallback(() => {
    router.push(`/?id=${listing.id}`);
  }, [router, listing.id]);

  const handleMarkSold = useCallback(() => {
    onUpdateStatus(listing.id, "sold");
  }, [listing.id, onUpdateStatus]);

  const handleMarkReserved = useCallback(() => {
    onUpdateStatus(listing.id, "reserved");
  }, [listing.id, onUpdateStatus]);

  const handleRemove = useCallback(() => {
    onRemove(listing.id);
  }, [listing.id, onRemove]);

  const handleDelete = useCallback(() => {
    onDelete(listing.id);
  }, [listing.id, onDelete]);

  const category = listing.category ?? "grapes";
  const categoryColor = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.grapes;
  const categoryIcon = CATEGORY_ICONS[category] ?? "📦";
  const [imgError, setImgError] = useState(false);

  const showPlaceholder = !photoUrl || imgError;
  const placeholderEmoji =
    listing.category === "wine"
      ? "🍷"
      : listing.category === "nobati"
        ? "🥜"
        : listing.category === "inventory"
          ? "📦"
          : listing.category === "seedlings"
            ? "🌱"
            : "🍇";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleView}
      onKeyDown={(e) => e.key === "Enter" && handleView()}
      className={`group flex cursor-pointer flex-row overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isRemoved ? "opacity-60" : ""}`}
    >
      {/* Image on left - fixed size so it always shows */}
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-l-[28px] bg-slate-200 sm:h-28 sm:w-28">
        {showPlaceholder ? (
          <div className="flex h-full w-full items-center justify-center text-3xl sm:text-4xl">
            {placeholderEmoji}
          </div>
        ) : (
          <>
            <OptimizedListingImage
              src={photoUrl!}
              image200={listing.photoUrls200?.[0] ?? listing.image200}
              alt=""
              context="card"
              className="object-cover"
              fill
              onError={() => setImgError(true)}
            />
            {isExpired && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                <span className="rounded-lg bg-slate-700/90 px-2 py-1 text-xs font-bold text-white">
                  {t("market.statusExpired")}
                </span>
              </div>
            )}
            {isSold && (
              <div
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
                aria-hidden
              >
                <div
                  className="absolute h-[180%] w-[60%] -rotate-[28deg] bg-slate-800/90"
                  style={{ left: "20%", top: "-40%" }}
                />
                <span
                  className="relative z-10 text-sm font-black uppercase tracking-widest text-white drop-shadow-lg sm:text-base"
                  style={{ transform: "rotate(-25deg)" }}
                >
                  {t("market.statusSold")}
                </span>
              </div>
            )}
          </>
        )}
        <span
          className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[10px] font-semibold text-white shadow-md sm:left-2 sm:top-2 sm:px-2 sm:py-1 sm:text-xs"
          style={{ backgroundColor: categoryColor }}
        >
          {categoryIcon}{" "}
          {t(
            `market.category${category.charAt(0).toUpperCase() + category.slice(1)}`,
          )}
        </span>
      </div>

      {/* Content on right */}
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-slate-900">
              {variety}
            </h3>
            <p className="mt-0.5 truncate text-sm text-slate-600">{region}</p>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <ListingActionsMenu
              listing={listing}
              onEdit={handleEdit}
              onMarkSold={handleMarkSold}
              onMarkReserved={handleMarkReserved}
              onRemove={handleRemove}
              onDelete={handleDelete}
            />
          </div>
        </div>

        <p className="mt-2 text-sm font-semibold text-emerald-800">
          {listing.quantity} {getUnitLabel(t, listing.unit ?? "kg")}
          {listing.price != null && listing.price > 0 ? (
            ` • ${listing.price} ₾`
          ) : (
            <span className="font-medium text-slate-600">
              {" "}
              • {t("market.priceByAgreement")}
            </span>
          )}
        </p>

        <div className="mt-2 flex items-center gap-3">
          <ListingStatusBadge status={status} />
        </div>

        <ListingExpiryBar listing={listing} />
      </div>
    </div>
  );
});
