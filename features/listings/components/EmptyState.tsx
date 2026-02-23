"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

interface EmptyStateProps {
  variant: "no-listings" | "filter-empty";
  onResetFilters?: () => void;
}

export function EmptyState({ variant, onResetFilters }: EmptyStateProps) {
  const { t } = useLanguage();

  if (variant === "no-listings") {
    return (
      <div className="flex flex-col items-center justify-center rounded-[20px] border border-slate-200/80 bg-white/90 px-6 py-16 text-center shadow-sm">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <svg
            className="h-10 w-10 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-900">{t("market.emptyFeed")}</h2>
        <p className="mt-2 max-w-sm text-slate-600">{t("market.emptyFeedSubtext")}</p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-[44px] items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-700"
        >
          {t("market.createFirst")}
        </Link>
        <p className="mt-4 text-sm text-slate-500">{t("market.createFirstHint")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-[20px] border border-slate-200/80 bg-white/90 px-6 py-16 text-center shadow-sm">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
        <svg
          className="h-8 w-8 text-amber-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-slate-900">{t("market.emptyFeed")}</h2>
      <p className="mt-1 text-slate-600">{t("market.noMatchFilter")}</p>
      {onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
        >
          {t("common.reset")} {t("common.all")}
        </button>
      )}
    </div>
  );
}
