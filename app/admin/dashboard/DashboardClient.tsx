"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { useDashboardStats } from "@/modules/admin/hooks/useDashboardStats";
import { StatCard } from "@/modules/admin/components/StatCard";
import { DashboardSkeleton } from "@/modules/admin/components/DashboardSkeleton";
import { KeyboardShortcutsHelp } from "@/modules/admin/components/KeyboardShortcuts";

const SimpleBarChart = dynamic(
  () =>
    import("@/modules/admin/components/SimpleBarChart").then((m) => ({
      default: m.SimpleBarChart,
    })),
  { ssr: false, loading: () => <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" /> }
);

export default function DashboardClient() {
  const { stats, dailyUsers, dailyListings, dailyReports, loading } =
    useDashboardStats();

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Platform status at a glance
          </p>
        </div>
        <KeyboardShortcutsHelp />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Active users today"
          value={stats.activeUsersToday}
          icon="👤"
        />
        <StatCard
          label="New users (24h)"
          value={stats.newUsers24h}
          icon="🆕"
        />
        <StatCard
          label="Listings today"
          value={stats.listingsToday}
          icon="📦"
        />
        <StatCard
          label="Open reports"
          value={stats.openReportsCount}
          icon="⚠️"
        />
        <StatCard
          label="Messages today"
          value={stats.messagesToday}
          icon="💬"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SimpleBarChart
          data={dailyUsers}
          title="Daily active users (30 days)"
          color="#10b981"
        />
        <SimpleBarChart
          data={dailyListings}
          title="Listings per day"
          color="#3b82f6"
        />
        <SimpleBarChart
          data={dailyReports}
          title="Reports per day"
          color="#ef4444"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
          <h3 className="font-medium text-amber-900 dark:text-amber-100">
            Listings waiting review
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            {stats.openReportsCount} reported listings need moderation
          </p>
          <Link
            href="/admin/reports"
            className="inline-block mt-3 text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline"
          >
            Go to Reports →
          </Link>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4">
          <h3 className="font-medium text-red-900 dark:text-red-100">
            Users with multiple reports
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            Check Users page for reported accounts
          </p>
          <Link
            href="/admin/users?filter=reported"
            className="inline-block mt-3 text-sm font-medium text-red-700 dark:text-red-300 hover:underline"
          >
            Go to Users →
          </Link>
        </div>
      </div>
    </div>
  );
}
