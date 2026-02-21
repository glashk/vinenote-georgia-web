"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDb } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useAdminActions } from "@/modules/admin/hooks/useAdminActions";
import { formatTimeAgo } from "@/modules/admin/utils";
import type { UserProfile } from "@/modules/admin/types";

export default function UserDetailClient({ userId }: { userId: string }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [listingsCount, setListingsCount] = useState(0);
  const [reportsCount, setReportsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [newNickname, setNewNickname] = useState("");

  const {
    banUser,
    deleteAllUserListings,
    resetUserNickname,
  } = useAdminActions();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      const db = await getDb();
      if (!db) {
        setLoading(false);
        return;
      }
      const userSnap = await getDoc(doc(db, "users", userId));
      if (userSnap.exists()) {
        setUser({ id: userSnap.id, ...userSnap.data() } as UserProfile);
      } else {
        setUser(null);
      }

      const listingsSnap = await getDocs(
        query(
          collection(db, "marketListings"),
          where("userId", "==", userId)
        )
      );
      setListingsCount(listingsSnap.size);

      const reportsSnap = await getDocs(
        query(
          collection(db, "reports"),
          where("reportedUserId", "==", userId)
        )
      );
      setReportsCount(reportsSnap.size);

      setLoading(false);
    };
    load();
  }, [userId]);

  const handleBan = async () => {
    if (!confirm("Permanently ban this user?")) return;
    setActionLoading(true);
    try {
      await banUser(userId);
      router.push("/admin/users");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAllListings = async () => {
    if (!confirm("Delete all listings by this user?")) return;
    setActionLoading(true);
    try {
      await deleteAllUserListings(userId);
      setListingsCount(0);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetNickname = async () => {
    if (!newNickname.trim()) return;
    setActionLoading(true);
    try {
      await resetUserNickname(userId, newNickname.trim());
      setUser((u) => (u ? { ...u, nickname: newNickname.trim() } : null));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">User not found</p>
        <Link href="/admin/users" className="text-emerald-600 mt-2 inline-block">
          ← Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/users"
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          ← Back to Users
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          User: {user.nickname ?? user.displayName ?? user.id}
        </h1>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <p><span className="text-slate-500">User ID:</span> <code className="text-xs">{user.id}</code></p>
          <p><span className="text-slate-500">Account created:</span> {formatTimeAgo(user.createdAt)}</p>
          <p><span className="text-slate-500">Last login:</span> {formatTimeAgo(user.lastLoginAt) ?? "-"}</p>
          <p><span className="text-slate-500">Listings:</span> {listingsCount}</p>
          <p><span className="text-slate-500">Reports against:</span> {reportsCount}</p>
          <p><span className="text-slate-500">Platform:</span> {user.platform ?? "-"}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Admin actions
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
              Reset nickname
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="New nickname"
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
              />
              <button
                onClick={handleResetNickname}
                disabled={actionLoading || !newNickname.trim()}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDeleteAllListings}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200"
            >
              Delete all listings
            </button>
            <button
              onClick={handleBan}
              disabled={actionLoading || user.banned}
              className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
            >
              Ban permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
