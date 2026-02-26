"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { ListingStatus, ListingsFilters as Filters } from "../types";
import { CATEGORY_ICONS } from "../utils";

interface ListingsFiltersProps {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  totalCount: number;
  statusCounts: Record<"all" | ListingStatus, number>;
}

const STATUS_OPTIONS: (ListingStatus | "all")[] = [
  "all",
  "active",
  "reserved",
  "sold",
  "expired",
  "removed",
];

const CATEGORY_OPTIONS = ["all", "grapes", "wine", "seedlings", "inventory", "nobati"] as const;

function getCategoryLabelKey(cat: string): string {
  const c = cat?.toLowerCase() ?? "grapes";
  const cap = c.charAt(0).toUpperCase() + c.slice(1);
  return `market.category${cap}`;
}

export function ListingsFilters({ filters, onFiltersChange, totalCount, statusCounts }: ListingsFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="sticky top-0 z-20">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            placeholder={t("market.searchPlaceholder")}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFiltersChange({ ...filters, search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              aria-label={t("market.clearSearch")}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Status: segmented control */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t("market.status")}
          </p>
          <div className="inline-flex flex-wrap gap-0.5 rounded-2xl bg-slate-100 p-1">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onFiltersChange({ ...filters, status: s })}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-all sm:px-4 ${
                  filters.status === s
                    ? "bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200/50"
                    : "text-slate-800 hover:text-slate-900"
                }`}
              >
                {s === "all" ? t("common.all") : t(`market.status${s.charAt(0).toUpperCase() + s.slice(1)}`)}
                <span className="ml-1.5 text-slate-700">({statusCounts[s] ?? 0})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category: icon chips */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t("market.category")}
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onFiltersChange({ ...filters, category: c })}
                className={`inline-flex min-h-[44px] items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all ${
                  filters.category === c
                    ? "bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                    : "bg-slate-50 text-slate-800 ring-1 ring-slate-200/60 hover:bg-slate-100 hover:ring-slate-300"
                }`}
              >
                <span className="text-lg">{CATEGORY_ICONS[c] ?? "📦"}</span>
                <span>{c === "all" ? t("common.all") : t(getCategoryLabelKey(c))}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm font-medium text-slate-500">
          {totalCount} {t("market.listings")}
        </p>
        </div>
      </div>
    </div>
  );
}
