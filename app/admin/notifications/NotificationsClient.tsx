"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDb } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  limit,
} from "firebase/firestore";
import { formatTimeAgo } from "@/modules/admin/utils";
import type { AdminNotification } from "@/modules/admin/types";

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    getDb().then((db) => {
      if (!db) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "adminNotifications"),
        orderBy("createdAt", "desc"),
        limit(100)
      );

      unsub = onSnapshot(
      q,
      (snap) => {
        setNotifications(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as AdminNotification[]
        );
        setLoading(false);
        setError(null);
      },
      (err) => {
        setLoading(false);
        setError(err?.message ?? "Error loading notifications");
      }
    );
    });

    return () => unsub?.();
  }, []);

  const markAsRead = async (id: string) => {
    const db = await getDb();
    if (!db) return;
    try {
      await updateDoc(doc(db, "adminNotifications", id), { read: true });
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Notifications
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Internal alerts and system warnings
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Notifications are created by Cloud Functions when events occur (e.g.
          new report, user banned). Add triggers in your Firebase project to
          populate this collection.
        </p>
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => markAsRead(n.id)}
            className={`bg-white dark:bg-slate-800 rounded-xl border p-4 cursor-pointer transition-colors ${
              n.read
                ? "border-slate-200 dark:border-slate-700 opacity-75"
                : "border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-900/10"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  {n.title}
                </div>
                {n.message && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {n.message}
                  </p>
                )}
                <div className="text-xs text-slate-500 mt-2">
                  {formatTimeAgo(n.createdAt)} • {n.type}
                </div>
              </div>
              {n.link && (
                <Link
                  href={n.link}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex-shrink-0"
                >
                  View →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {notifications.length === 0 && !error && (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          No notifications. Set up Cloud Functions to create alerts on new
          reports, bans, etc.
        </div>
      )}
    </div>
  );
}
