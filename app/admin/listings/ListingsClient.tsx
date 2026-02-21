"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useListings,
  type ListingFilter,
} from "@/modules/admin/hooks/useListings";
import { useAdminActions } from "@/modules/admin/hooks/useAdminActions";
import { formatTimeAgo, getListingImageUrl } from "@/modules/admin/utils";
import type { Listing, MarketCategory } from "@/modules/admin/types";

const FILTERS: { value: ListingFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "hidden", label: "Hidden" },
  { value: "flagged", label: "Flagged" },
];

const CATEGORY_LABELS: Record<string, string> = {
  grapes: "Grapes",
  wine: "Wine",
  nobati: "Nobati",
};

export default function ListingsClient() {
  const [filter, setFilter] = useState<ListingFilter>("all");
  const { listings, loading, error } = useListings(filter);
  const { hideListing, unhideListing, deleteListing, featureListing } =
    useAdminActions();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === listings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(listings.map((l) => l.id)));
    }
  };

  const runBulkAction = async (
    action: "hide" | "unhide" | "delete",
    ids: string[]
  ) => {
    for (const id of ids) {
      setActionLoading(id);
      try {
        if (action === "hide") await hideListing(id);
        if (action === "unhide") await unhideListing(id);
        if (action === "delete") await deleteListing(id);
      } finally {
        setActionLoading(null);
      }
    }
    setSelectedIds(new Set());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Listings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage marketplace listings
          </p>
        </div>
        <Link
          href="/admin/reports"
          className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Reports
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === f.value
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
          className="ml-auto px-4 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
        >
          {viewMode === "table" ? "Grid" : "Table"}
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <span className="text-sm">
            {selectedIds.size} selected
          </span>
          <button
            onClick={() => runBulkAction("hide", Array.from(selectedIds))}
            className="px-4 py-2 text-sm rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800"
          >
            Hide
          </button>
          <button
            onClick={() => runBulkAction("unhide", Array.from(selectedIds))}
            className="px-4 py-2 text-sm rounded-lg bg-slate-200 dark:bg-slate-600 text-slate-800"
          >
            Unhide
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete ${selectedIds.size} listings?`)) {
                runBulkAction("delete", Array.from(selectedIds));
              }
            }}
            className="px-4 py-2 text-sm rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700"
          >
            Delete
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600"
          >
            Clear
          </button>
        </div>
      )}

      <p className="text-sm text-slate-500">
        Total: {listings.length} listings
      </p>

      {viewMode === "table" ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="p-3">
                  <input
                    type="checkbox"
                    checked={
                      listings.length > 0 &&
                      selectedIds.size === listings.length
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left p-3 font-medium">Title</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-left p-3 font-medium">Price</th>
                <th className="text-left p-3 font-medium">Location</th>
                <th className="text-left p-3 font-medium">Created</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <ListingTableRow
                  key={listing.id}
                  listing={listing}
                  selected={selectedIds.has(listing.id)}
                  onToggleSelect={() => toggleSelect(listing.id)}
                  onHide={() => hideListing(listing.id)}
                  onUnhide={() => unhideListing(listing.id)}
                  onDelete={() => deleteListing(listing.id)}
                  onFeature={() => featureListing(listing.id)}
                  isBusy={actionLoading === listing.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              selected={selectedIds.has(listing.id)}
              onToggleSelect={() => toggleSelect(listing.id)}
              onHide={() => hideListing(listing.id)}
              onUnhide={() => unhideListing(listing.id)}
              onDelete={() => deleteListing(listing.id)}
              onFeature={() => featureListing(listing.id)}
              isBusy={actionLoading === listing.id}
            />
          ))}
        </div>
      )}

      {listings.length === 0 && (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          No listings found
        </div>
      )}
    </div>
  );
}

function ListingTableRow({
  listing,
  selected,
  onToggleSelect,
  onHide,
  onUnhide,
  onDelete,
  onFeature,
  isBusy,
}: {
  listing: Listing;
  selected: boolean;
  onToggleSelect: () => void;
  onHide: () => void;
  onUnhide: () => void;
  onDelete: () => void;
  onFeature: () => void;
  isBusy: boolean;
}) {
  const imgUrl = getListingImageUrl(listing);
  const title = listing.title ?? listing.variety ?? "Untitled";
  const category = CATEGORY_LABELS[listing.category ?? "grapes"] ?? listing.category;

  return (
    <tr className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <td className="p-3">
        {!listing.hidden && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
          />
        )}
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          {imgUrl && (
            <img
              src={imgUrl}
              alt=""
              width={40}
              height={40}
              loading="lazy"
              className="w-10 h-10 rounded object-cover"
            />
          )}
          <span className="truncate max-w-[200px]">{title}</span>
        </div>
      </td>
      <td className="p-3">{category}</td>
      <td className="p-3">
        {listing.price != null && listing.price > 0
          ? `${listing.price} ₾`
          : "-"}
      </td>
      <td className="p-3 truncate max-w-[120px]">
        {[listing.region, listing.village].filter(Boolean).join(", ") || "-"}
      </td>
      <td className="p-3">{formatTimeAgo(listing.createdAt)}</td>
      <td className="p-3">
        {listing.hidden ? (
          <span className="text-amber-600 dark:text-amber-400">Hidden</span>
        ) : listing.flaggedBySystem ? (
          <span className="text-red-600 dark:text-red-400">Flagged</span>
        ) : (
          <span className="text-emerald-600 dark:text-emerald-400">Active</span>
        )}
      </td>
      <td className="p-3">
        <div className="flex gap-1">
          {listing.hidden ? (
            <button
              onClick={onUnhide}
              disabled={isBusy}
              className="px-2 py-1 text-xs rounded bg-emerald-100 dark:bg-emerald-900/40"
            >
              Show
            </button>
          ) : (
            <button
              onClick={onHide}
              disabled={isBusy}
              className="px-2 py-1 text-xs rounded bg-amber-100 dark:bg-amber-900/40"
            >
              Hide
            </button>
          )}
          <button
            onClick={onFeature}
            disabled={isBusy}
            className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-700"
          >
            Feature
          </button>
          <button
            onClick={onDelete}
            disabled={isBusy}
            className="px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900/40"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

function ListingCard({
  listing,
  selected,
  onToggleSelect,
  onHide,
  onUnhide,
  onDelete,
  onFeature,
  isBusy,
}: {
  listing: Listing;
  selected: boolean;
  onToggleSelect: () => void;
  onHide: () => void;
  onUnhide: () => void;
  onDelete: () => void;
  onFeature: () => void;
  isBusy: boolean;
}) {
  const imgUrl = getListingImageUrl(listing);
  const title = listing.title ?? listing.variety ?? "Untitled";
  const category = CATEGORY_LABELS[listing.category ?? "grapes"] ?? listing.category;

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border overflow-hidden ${
        selected
          ? "border-emerald-500 ring-2 ring-emerald-500/30"
          : "border-slate-200 dark:border-slate-700"
      }`}
    >
      <div className="aspect-video bg-slate-200 dark:bg-slate-600 relative">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt=""
            width={400}
            height={225}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            No image
          </div>
        )}
        {!listing.hidden && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="absolute top-2 left-2"
          />
        )}
      </div>
      <div className="p-3">
        <div className="font-medium truncate">{title}</div>
        <div className="text-xs text-slate-500 mt-1">
          {category} • {listing.price != null && listing.price > 0 ? `${listing.price} ₾` : "Contact"}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {formatTimeAgo(listing.createdAt)}
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {listing.hidden ? (
            <button
              onClick={onUnhide}
              disabled={isBusy}
              className="px-2 py-1 text-xs rounded bg-emerald-100 dark:bg-emerald-900/40"
            >
              Show
            </button>
          ) : (
            <button
              onClick={onHide}
              disabled={isBusy}
              className="px-2 py-1 text-xs rounded bg-amber-100 dark:bg-amber-900/40"
            >
              Hide
            </button>
          )}
          <button
            onClick={onFeature}
            disabled={isBusy}
            className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-700"
          >
            Feature
          </button>
          <button
            onClick={onDelete}
            disabled={isBusy}
            className="px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900/40"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
