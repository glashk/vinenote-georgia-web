"use client";

export function ListSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-sm"
        >
          <div className="h-[140px] w-[140px] flex-shrink-0 animate-pulse bg-slate-200 sm:h-[160px] sm:w-[160px]" />
          <div className="flex flex-1 flex-col gap-3 p-5">
            <div className="h-5 w-3/4 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-4 w-1/2 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-4 w-1/3 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-2 h-2 w-full animate-pulse rounded-full bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
