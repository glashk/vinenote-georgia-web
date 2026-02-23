"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getThumbUrl } from "@/lib/imageUtils";
import {
  useListings,
  type ListingFilter,
} from "@/modules/admin/hooks/useListings";
import { useAdminActions } from "@/modules/admin/hooks/useAdminActions";
import { formatTimeAgo, getListingImageUrl } from "@/modules/admin/utils";
import type { Listing, MarketCategory } from "@/modules/admin/types";
import { ConfirmModal } from "@/components/ConfirmModal";

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

type ModalType =
  | null
  | { type: "delete"; ids: string[]; listing?: Listing }
  | { type: "hide"; ids: string[]; listing?: Listing }
  | { type: "unhide"; ids: string[]; listing?: Listing }
  | { type: "feature"; id: string; listing?: Listing };

export default function ListingsClient() {
  const [filter, setFilter] = useState<ListingFilter>("all");
  const { listings, loading, error } = useListings(filter);
  const { hideListing, unhideListing, deleteListing, featureListing } =
    useAdminActions();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [modalConfirming, setModalConfirming] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
    setModalConfirming(true);
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
    setModal(null);
    setModalConfirming(false);
  };

  const runSingleAction = async (
    action: "hide" | "unhide" | "delete" | "feature",
    id: string
  ) => {
    setModalConfirming(true);
    setActionLoading(id);
    setOpenMenuId(null);
    try {
      if (action === "hide") await hideListing(id);
      if (action === "unhide") await unhideListing(id);
      if (action === "delete") await deleteListing(id);
      if (action === "feature") await featureListing(id);
    } finally {
      setActionLoading(null);
      setModal(null);
      setModalConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Listings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5">
            Manage marketplace listings
          </p>
        </div>
        <Link
          href="/admin/reports"
          className="inline-flex items-center gap-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
        >
          <span>Reports</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </header>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filter === f.value
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {listings.length} listings
          </span>
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                viewMode === "grid"
                  ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-4 p-4 vn-glass rounded-2xl border border-slate-200/50 dark:border-slate-600/50 shadow-lg">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {selectedIds.size} selected
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                setModal({
                  type: "hide",
                  ids: Array.from(selectedIds),
                })
              }
              className="px-4 py-2 text-sm font-medium rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors"
            >
              Hide
            </button>
            <button
              onClick={() =>
                setModal({
                  type: "unhide",
                  ids: Array.from(selectedIds),
                })
              }
              className="px-4 py-2 text-sm font-medium rounded-xl bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
            >
              Unhide
            </button>
            <button
              onClick={() =>
                setModal({
                  type: "delete",
                  ids: Array.from(selectedIds),
                })
              }
              className="px-4 py-2 text-sm font-medium rounded-xl bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {viewMode === "table" ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 vn-glass shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80">
              <tr>
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={
                      listings.length > 0 &&
                      selectedIds.size === listings.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Title</th>
                <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Category</th>
                <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Price</th>
                <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Location</th>
                <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Created</th>
                <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <ListingTableRow
                  key={listing.id}
                  listing={listing}
                  selected={selectedIds.has(listing.id)}
                  onToggleSelect={() => toggleSelect(listing.id)}
                  onHide={() =>
                    setModal({
                      type: "hide",
                      ids: [listing.id],
                      listing,
                    })
                  }
                  onUnhide={() =>
                    setModal({
                      type: "unhide",
                      ids: [listing.id],
                      listing,
                    })
                  }
                  onDelete={() =>
                    setModal({
                      type: "delete",
                      ids: [listing.id],
                      listing,
                    })
                  }
                  onFeature={() =>
                    setModal({
                      type: "feature",
                      id: listing.id,
                      listing,
                    })
                  }
                  isBusy={actionLoading === listing.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              selected={selectedIds.has(listing.id)}
              onToggleSelect={() => toggleSelect(listing.id)}
              onHide={() =>
                setModal({
                  type: "hide",
                  ids: [listing.id],
                  listing,
                })
              }
              onUnhide={() =>
                setModal({
                  type: "unhide",
                  ids: [listing.id],
                  listing,
                })
              }
              onDelete={() =>
                setModal({
                  type: "delete",
                  ids: [listing.id],
                  listing,
                })
              }
              onFeature={() =>
                setModal({
                  type: "feature",
                  id: listing.id,
                  listing,
                })
              }
              isBusy={actionLoading === listing.id}
              openMenu={openMenuId === listing.id}
              onMenuToggle={() => setOpenMenuId((id) => (id === listing.id ? null : listing.id))}
              onMenuClose={() => setOpenMenuId(null)}
            />
          ))}
        </div>
      )}

      {listings.length === 0 && (
        <div className="text-center py-24 vn-glass rounded-2xl border border-slate-200/50 dark:border-slate-600/50">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No listings found</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Try changing the filter</p>
        </div>
      )}

      {/* Confirmation Modals */}
      {modal?.type === "delete" && (
        <ConfirmModal
          open={true}
          onClose={() => setModal(null)}
          onConfirm={async () => {
            if (modal.ids.length === 1) {
              await runSingleAction("delete", modal.ids[0]);
            } else {
              await runBulkAction("delete", modal.ids);
            }
          }}
          title={
            modal.ids.length === 1 && modal.listing
              ? `Delete "${modal.listing.title ?? modal.listing.variety ?? "Untitled"}"?`
              : `Delete ${modal.ids.length} listings?`
          }
          message={
            modal.ids.length === 1
              ? "This listing will be permanently removed. This action cannot be undone."
              : `These ${modal.ids.length} listings will be permanently removed. This action cannot be undone.`
          }
          confirmLabel="Delete"
          variant="danger"
          loading={modalConfirming}
        />
      )}

      {modal?.type === "hide" && (
        <ConfirmModal
          open={true}
          onClose={() => setModal(null)}
          onConfirm={async () => {
            if (modal.ids.length === 1) {
              await runSingleAction("hide", modal.ids[0]);
            } else {
              await runBulkAction("hide", modal.ids);
            }
          }}
          title={
            modal.ids.length === 1 && modal.listing
              ? `Hide "${modal.listing.title ?? modal.listing.variety ?? "Untitled"}"?`
              : `Hide ${modal.ids.length} listings?`
          }
          message={
            modal.ids.length === 1
              ? "This listing will be hidden from the marketplace. You can unhide it later."
              : `These ${modal.ids.length} listings will be hidden from the marketplace. You can unhide them later.`
          }
          confirmLabel="Hide"
          variant="warning"
          loading={modal.ids.some((id) => actionLoading === id)}
        />
      )}

      {modal?.type === "unhide" && (
        <ConfirmModal
          open={true}
          onClose={() => setModal(null)}
          onConfirm={async () => {
            if (modal.ids.length === 1) {
              await runSingleAction("unhide", modal.ids[0]);
            } else {
              await runBulkAction("unhide", modal.ids);
            }
          }}
          title={
            modal.ids.length === 1 && modal.listing
              ? `Show "${modal.listing.title ?? modal.listing.variety ?? "Untitled"}"?`
              : `Show ${modal.ids.length} listings?`
          }
          message={
            modal.ids.length === 1
              ? "This listing will be visible again in the marketplace."
              : `These ${modal.ids.length} listings will be visible again in the marketplace.`
          }
          confirmLabel="Show"
          variant="neutral"
          loading={modalConfirming}
        />
      )}

      {modal?.type === "feature" && (
        <ConfirmModal
          open={true}
          onClose={() => setModal(null)}
          onConfirm={async () => runSingleAction("feature", modal.id)}
          title={
            modal.listing
              ? `Feature "${modal.listing.title ?? modal.listing.variety ?? "Untitled"}"?`
              : "Feature this listing?"
          }
          message="This listing will be featured on the marketplace."
          confirmLabel="Feature"
          variant="neutral"
          loading={modalConfirming}
        />
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
    <tr className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
      <td className="p-4">
        {!listing.hidden && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="rounded border-slate-300"
          />
        )}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          {imgUrl && (
            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-700">
              <Image
                src={getThumbUrl(imgUrl, 200) ?? imgUrl}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <span className="truncate max-w-[200px] font-medium text-slate-900 dark:text-slate-100">{title}</span>
        </div>
      </td>
      <td className="p-4">
        <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          {category}
        </span>
      </td>
      <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
        {listing.price != null && listing.price > 0
          ? `${listing.price} ₾`
          : "-"}
      </td>
      <td className="p-4 truncate max-w-[140px] text-slate-600 dark:text-slate-400">
        {[listing.region, listing.village].filter(Boolean).join(", ") || "-"}
      </td>
      <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">
        {formatTimeAgo(listing.createdAt)}
      </td>
      <td className="p-4">
        {listing.hidden ? (
          <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
            Hidden
          </span>
        ) : listing.flaggedBySystem ? (
          <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
            Flagged
          </span>
        ) : (
          <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
            Active
          </span>
        )}
      </td>
      <td className="p-4">
        <div className="flex flex-wrap gap-1.5">
          {listing.hidden ? (
            <button
              onClick={onUnhide}
              disabled={isBusy}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 disabled:opacity-50 transition-colors"
            >
              Show
            </button>
          ) : (
            <button
              onClick={onHide}
              disabled={isBusy}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 disabled:opacity-50 transition-colors"
            >
              Hide
            </button>
          )}
          <button
            onClick={onFeature}
            disabled={isBusy}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
          >
            Feature
          </button>
          <button
            onClick={onDelete}
            disabled={isBusy}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 disabled:opacity-50 transition-colors"
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
  openMenu,
  onMenuToggle,
  onMenuClose,
}: {
  listing: Listing;
  selected: boolean;
  onToggleSelect: () => void;
  onHide: () => void;
  onUnhide: () => void;
  onDelete: () => void;
  onFeature: () => void;
  isBusy: boolean;
  openMenu: boolean;
  onMenuToggle: () => void;
  onMenuClose: () => void;
}) {
  const imgUrl = getListingImageUrl(listing);
  const title = listing.title ?? listing.variety ?? "Untitled";
  const category = CATEGORY_LABELS[listing.category ?? "grapes"] ?? listing.category;

  return (
    <div
      className={`group relative vn-glass rounded-2xl border overflow-hidden transition-all duration-200 ${
        selected
          ? "border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10"
          : "border-slate-200/50 dark:border-slate-600/50 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-lg"
      }`}
    >
      <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-600 relative overflow-hidden">
        {imgUrl ? (
          <Image
            src={getThumbUrl(imgUrl, 400) ?? imgUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {!listing.hidden && (
          <div className="absolute top-3 left-3 z-10">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              className="w-5 h-5 rounded border-slate-300 bg-white/90 backdrop-blur-sm"
            />
          </div>
        )}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {listing.hidden ? (
            <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100/95 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 backdrop-blur-sm">
              Hidden
            </span>
          ) : listing.flaggedBySystem ? (
            <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100/95 dark:bg-red-900/60 text-red-700 dark:text-red-300 backdrop-blur-sm">
              Flagged
            </span>
          ) : (
            <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100/95 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 backdrop-blur-sm">
              Active
            </span>
          )}
          <div className="relative">
            <button
              onClick={onMenuToggle}
              disabled={isBusy}
              className="p-2 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              aria-label="Actions"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            {openMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={onMenuClose}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full mt-2 z-50 w-48 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-xl">
                  {listing.hidden ? (
                    <button
                      onClick={onUnhide}
                      disabled={isBusy}
                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-50"
                    >
                      Show
                    </button>
                  ) : (
                    <button
                      onClick={onHide}
                      disabled={isBusy}
                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors disabled:opacity-50"
                    >
                      Hide
                    </button>
                  )}
                  <button
                    onClick={onFeature}
                    disabled={isBusy}
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Feature
                  </button>
                  <button
                    onClick={onDelete}
                    disabled={isBusy}
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="font-semibold truncate text-slate-900 dark:text-slate-100">
          {title}
        </div>
        <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 dark:text-slate-400">
          <span>{category}</span>
          <span>•</span>
          <span>
            {listing.price != null && listing.price > 0
              ? `${listing.price} ₾`
              : "Contact"}
          </span>
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {formatTimeAgo(listing.createdAt)}
        </div>
      </div>
    </div>
  );
}
