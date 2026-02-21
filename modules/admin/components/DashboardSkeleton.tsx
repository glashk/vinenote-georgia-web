"use client";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-64 mt-2 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
          >
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
          >
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
            <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      </div>
    </div>
  );
}
