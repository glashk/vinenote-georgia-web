"use client";

/**
 * Skeleton placeholder for listing cards during loading.
 * Matches grid card layout to prevent CLS.
 */
export default function ListingCardSkeleton() {
  return (
    <div className="vn-glass vn-card overflow-hidden rounded-2xl animate-pulse">
      <div className="aspect-[4/3] bg-slate-200" />
      <div className="p-3 sm:p-4 flex flex-col">
        <div className="mb-1.5 h-5 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-100 rounded w-full mb-1.5" />
        <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />
        <div className="flex flex-wrap gap-1.5 mt-auto">
          <div className="h-5 bg-slate-100 rounded-md w-14" />
          <div className="h-5 bg-slate-100 rounded-md w-12" />
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100/80">
          <div className="h-6 bg-slate-100 rounded w-20" />
          <div className="h-3 bg-slate-100 rounded w-16" />
        </div>
      </div>
    </div>
  );
}
