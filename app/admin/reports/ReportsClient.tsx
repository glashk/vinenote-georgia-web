"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import OptimizedListingImage from "@/components/OptimizedListingImage";
import { useReports } from "@/modules/admin/hooks/useReports";
import { useAdminActions } from "@/modules/admin/hooks/useAdminActions";
import { formatTimeAgo, getListingImageUrl } from "@/modules/admin/utils";
import type { ReportWithListing } from "@/modules/admin/hooks/useReports";
import type { Listing } from "@/modules/admin/types";
import { KeyboardShortcutsHelp } from "@/modules/admin/components/KeyboardShortcuts";

export default function ReportsClient() {
  const { t } = useLanguage();
  const {
    reports,
    pendingReports,
    reportCountByListing,
    loading,
    error,
    getListingImageUrl: getImg,
  } = useReports();
  const {
    warnUser,
    deleteListing,
    banUser,
    markReportSafe,
    hideListing,
    dismissReport,
  } = useAdminActions();

  const [selectedReport, setSelectedReport] = useState<ReportWithListing | null>(
    null
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const runAction = useCallback(
    async (
      id: string,
      fn: () => Promise<void>,
      onSuccess?: () => void
    ) => {
      setActionLoading(id);
      try {
        await fn();
        onSuccess?.();
      } finally {
        setActionLoading(null);
      }
    },
    []
  );

  const handleDeleteListing = (report: ReportWithListing) =>
    runAction(report.listingId, () => deleteListing(report.listingId), () =>
      setSelectedReport(null)
    );

  const handleBanUser = (report: ReportWithListing) =>
    runAction(
      report.reportedUserId,
      () => banUser(report.reportedUserId),
      () => setSelectedReport(null)
    );

  const handleWarnUser = (report: ReportWithListing) =>
    runAction(report.reportedUserId, () => warnUser(report.reportedUserId));

  const handleMarkSafe = (report: ReportWithListing) =>
    runAction(report.id, () => markReportSafe(report.id), () =>
      setSelectedReport(null)
    );

  const handleHideListing = (report: ReportWithListing) =>
    runAction(report.listingId, () => hideListing(report.listingId));

  const handleDismissReport = (report: ReportWithListing) =>
    runAction(report.id, () => dismissReport(report.id), () =>
      setSelectedReport(null)
    );

  const displayReports = pendingReports.length > 0 ? pendingReports : reports;

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
            Moderation Queue
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Reported listings — newest first
          </p>
        </div>
        <div className="flex items-center gap-4">
          <KeyboardShortcutsHelp />
          <Link
            href="/admin/listings"
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Listings
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-6 min-h-[600px]">
        {/* LEFT: Report cards list */}
        <div
          className={`flex flex-col gap-4 ${
            selectedReport ? "w-1/2 lg:w-2/5" : "flex-1"
          }`}
        >
          {displayReports.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-500 dark:text-slate-400">
              No reports to moderate
            </div>
          ) : (
            displayReports.map((report) => {
              const isDismissed =
                report.status === "dismissed" || report.status === "resolved";
              const count = reportCountByListing[report.listingId] ?? 0;
              const imgUrl = getImg(report.listing);
              const isSelected = selectedReport?.id === report.id;
              const isBusy =
                actionLoading === report.id ||
                actionLoading === report.listingId ||
                actionLoading === report.reportedUserId;

              return (
                <div
                  key={report.id}
                  onClick={() => !isDismissed && setSelectedReport(report)}
                  className={`bg-white dark:bg-slate-800 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-emerald-500 ring-2 ring-emerald-500/30"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  } ${isDismissed ? "opacity-60" : ""}`}
                >
                  <div className="p-4 flex gap-4">
                    <div className="relative w-20 h-20 rounded-lg bg-slate-200 dark:bg-slate-600 overflow-hidden flex-shrink-0">
                      {imgUrl ? (
                        <OptimizedListingImage
                          src={imgUrl}
                          context="card"
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {report.listing?.title ??
                          report.listing?.variety ??
                          t("market.unknownListing")}
                      </div>
                      {report.listing?.price != null && report.listing.price > 0 && (
                        <div className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                          {report.listing.price} ₾
                        </div>
                      )}
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Seller: {report.reportedUserId.slice(0, 8)}…
                      </div>
                      <div className="flex gap-2 mt-2">
                        {count > 1 && !isDismissed && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                            {count} reports
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {formatTimeAgo(report.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {report.reason}
                      </p>
                    </div>
                  </div>
                  {!isDismissed && (
                    <div className="px-4 pb-4 flex flex-wrap gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `/?highlight=${report.listingId}`,
                            "_blank",
                            "noopener,noreferrer"
                          );
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                      >
                        View listing
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWarnUser(report);
                        }}
                        disabled={isBusy}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900/60 disabled:opacity-50"
                      >
                        Warn user
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteListing(report);
                        }}
                        disabled={isBusy}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 disabled:opacity-50"
                      >
                        Delete listing
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBanUser(report);
                        }}
                        disabled={isBusy}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-200 dark:bg-red-900/60 text-red-800 dark:text-red-200 hover:bg-red-300 dark:hover:bg-red-900 disabled:opacity-50"
                      >
                        Ban user
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkSafe(report);
                        }}
                        disabled={isBusy}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 disabled:opacity-50"
                      >
                        Mark as safe
                      </button>
                    </div>
                  )}
                  {isBusy && (
                    <div className="px-4 pb-4 flex items-center gap-2 text-slate-500 text-xs">
                      <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT: Split-screen detail */}
        {selectedReport && (
          <div className="w-1/2 lg:w-3/5 flex flex-col gap-4">
            <ReportDetailPanel
              report={selectedReport}
              reportCount={reportCountByListing[selectedReport.listingId] ?? 0}
              onClose={() => setSelectedReport(null)}
              onDelete={() => handleDeleteListing(selectedReport)}
              onBan={() => handleBanUser(selectedReport)}
              onWarn={() => handleWarnUser(selectedReport)}
              onMarkSafe={() => handleMarkSafe(selectedReport)}
              onHide={() => handleHideListing(selectedReport)}
              onDismiss={() => handleDismissReport(selectedReport)}
              isBusy={
                actionLoading === selectedReport.id ||
                actionLoading === selectedReport.listingId ||
                actionLoading === selectedReport.reportedUserId
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ReportDetailPanel({
  report,
  reportCount,
  onClose,
  onDelete,
  onBan,
  onWarn,
  onMarkSafe,
  onHide,
  onDismiss,
  isBusy,
}: {
  report: ReportWithListing;
  reportCount: number;
  onClose: () => void;
  onDelete: () => void;
  onBan: () => void;
  onWarn: () => void;
  onMarkSafe: () => void;
  onHide: () => void;
  onDismiss: () => void;
  isBusy: boolean;
}) {
  const listing = report.listing;
  const imgUrl = getListingImageUrl(listing);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">
          Report details
        </h2>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Listing preview */}
        <div>
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
            Listing
          </h3>
          <div className="space-y-3">
            {imgUrl && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <OptimizedListingImage
                  src={imgUrl}
                  context="detail"
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 400px"
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <div className="font-medium">
                {listing?.title ?? listing?.variety ?? "Unknown"}
              </div>
              {listing?.price != null && listing.price > 0 && (
                <div className="text-emerald-600 dark:text-emerald-400">
                  {listing.price} ₾
                </div>
              )}
              {listing?.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-4">
                  {listing.description}
                </p>
              )}
              {[listing?.region, listing?.village].filter(Boolean).length > 0 && (
                <p className="text-sm text-slate-500 mt-1">
                  📍 {[listing?.region, listing?.village].filter(Boolean).join(", ")}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Seller: {report.reportedUserId}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Report history & user info */}
        <div>
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
            Report info
          </h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">Reports:</span> {reportCount}
            </p>
            <p>
              <span className="text-slate-500">Reason:</span>{" "}
              <span className="text-red-600 dark:text-red-400">{report.reason}</span>
            </p>
            <p>
              <span className="text-slate-500">Reporter:</span> {report.reporterId}
            </p>
            <p>
              <span className="text-slate-500">Reported user:</span>{" "}
              {report.reportedUserId}
            </p>
            <p>
              <span className="text-slate-500">Time:</span>{" "}
              {formatTimeAgo(report.createdAt)}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            User account age, listings count, and previous violations would appear
            here when available from the app.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
        <button
          onClick={() =>
            window.open(`/?highlight=${report.listingId}`, "_blank", "noopener,noreferrer")
          }
          className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
        >
          View listing
        </button>
        <button
          onClick={onWarn}
          disabled={isBusy}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200"
        >
          Warn user
        </button>
        <button
          onClick={onHide}
          disabled={isBusy}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200"
        >
          Hide listing
        </button>
        <button
          onClick={onDelete}
          disabled={isBusy}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
        >
          Delete listing
        </button>
        <button
          onClick={onBan}
          disabled={isBusy}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-red-200 dark:bg-red-900/60 text-red-800 dark:text-red-200"
        >
          Ban user
        </button>
        <button
          onClick={onMarkSafe}
          disabled={isBusy}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200"
        >
          Mark as safe
        </button>
        <button
          onClick={onDismiss}
          disabled={isBusy}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400"
        >
          Dismiss report
        </button>
      </div>
    </div>
  );
}
