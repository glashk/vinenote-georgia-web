"use client";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: string;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
            {value}
          </p>
        </div>
        {icon && (
          <span className="text-2xl opacity-60">{icon}</span>
        )}
      </div>
    </div>
  );
}
