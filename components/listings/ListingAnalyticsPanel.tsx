"use client";

import { Eye, Phone, Percent } from "lucide-react";
import {
  getListingViewsCount,
  getListingPhoneClicksCount,
  getConversionRate,
} from "@/features/listings/analytics";

interface ListingAnalyticsPanelProps {
  listing: {
    viewsCount?: number | null;
    phoneClicksCount?: number | null;
    variety?: string;
    title?: string;
  };
  className?: string;
}

export default function ListingAnalyticsPanel({
  listing,
  className = "",
}: ListingAnalyticsPanelProps) {
  const views = getListingViewsCount(listing);
  const clicks = getListingPhoneClicksCount(listing);
  const conversion = getConversionRate(views, clicks);
  const title = listing.title ?? listing.variety ?? "Listing";

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 p-5 ${className}`}
    >
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Analytics — {title}
      </h3>
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-start gap-3 rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-600">
          <Eye className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Views</dt>
            <dd className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {views.toLocaleString()}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-600">
          <Phone className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Phone clicks</dt>
            <dd className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {clicks.toLocaleString()}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-600">
          <Percent className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Conversion</dt>
            <dd className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
              {conversion}%
            </dd>
            <p className="text-[10px] text-slate-400 mt-0.5">phone clicks ÷ views</p>
          </div>
        </div>
      </dl>
    </div>
  );
}
