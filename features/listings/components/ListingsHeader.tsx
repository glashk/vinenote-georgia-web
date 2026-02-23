"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

interface ListingsHeaderProps {
  activeCount: number;
}

export function ListingsHeader({ activeCount }: ListingsHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {t("nav.myListings")}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {activeCount} {t("market.statusActive").toLowerCase()} {t("market.listings")}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/my-listings/add"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-700 hover:shadow-emerald-500/30 active:scale-[0.98]"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t("market.addListing")}
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98]"
        >
          ← {t("nav.market")}
        </Link>
      </div>
    </div>
  );
}
