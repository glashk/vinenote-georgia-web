"use client";

import { useState, memo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUsers, type UserFilter } from "@/modules/admin/hooks/useUsers";
import { formatTimeAgo } from "@/modules/admin/utils";
import UserDetailClient from "./UserDetailClient";
import type { UserProfile } from "@/modules/admin/types";

const UserTableRow = memo(function UserTableRow({ user }: { user: UserProfile }) {
  return (
    <tr className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <td className="p-3 font-mono text-xs">{user.id.slice(0, 12)}…</td>
      <td className="p-3">{user.nickname ?? user.displayName ?? "-"}</td>
      <td className="p-3">{formatTimeAgo(user.createdAt)}</td>
      <td className="p-3">
        {user.banned ? (
          <span className="text-red-600 dark:text-red-400">Banned</span>
        ) : user.suspendedUntil ? (
          <span className="text-amber-600 dark:text-amber-400">Suspended</span>
        ) : (
          <span className="text-emerald-600 dark:text-emerald-400">Active</span>
        )}
      </td>
      <td className="p-3">
        <Link
          href={`/admin/users?id=${user.id}`}
          className="text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          View
        </Link>
      </td>
    </tr>
  );
});

const FILTERS: { value: UserFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New (7d)" },
  { value: "reported", label: "Reported" },
  { value: "banned", label: "Banned" },
  { value: "high_activity", label: "High activity" },
];

export default function UsersClient() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");
  const [filter, setFilter] = useState<UserFilter>("all");
  const { users, loading, error } = useUsers(filter);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  if (userId) {
    return <UserDetailClient userId={userId} />;
  }

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
            Users
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage and moderate user accounts
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === f.value
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}
          className="ml-auto px-4 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
        >
          {viewMode === "table" ? "Cards" : "Table"}
        </button>
      </div>

      <p className="text-sm text-slate-500">
        Total: {users.length} users
      </p>

      {viewMode === "table" ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="text-left p-3 font-medium">User ID</th>
                <th className="text-left p-3 font-medium">Nickname</th>
                <th className="text-left p-3 font-medium">Created</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <UserTableRow key={user.id} user={user} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Link
              key={user.id}
              href={`/admin/users?id=${user.id}`}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-emerald-500/50 block"
            >
              <div className="font-medium truncate">
                {user.nickname ?? user.displayName ?? user.id.slice(0, 8)}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-mono">
                {user.id.slice(0, 16)}…
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {formatTimeAgo(user.createdAt)}
              </div>
              <span className="mt-2 inline-block text-sm text-emerald-600 dark:text-emerald-400">
                View details →
              </span>
            </Link>
          ))}
        </div>
      )}

      {users.length === 0 && (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          No users found. The users collection may be empty or not yet populated by the app.
        </div>
      )}
    </div>
  );
}
