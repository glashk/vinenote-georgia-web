"use client";

import { useEffect, useState } from "react";
import { getDb } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { formatTimeAgo } from "@/modules/admin/utils";
import type { AdminLog } from "@/modules/admin/types";

export default function AuditClient() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
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
        collection(db, "adminLogs"),
        orderBy("timestamp", "desc"),
        limit(200)
      );

      unsub = onSnapshot(
      q,
      (snap) => {
        setLogs(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as AdminLog[]
        );
        setLoading(false);
        setError(null);
      },
      (err) => {
        setLoading(false);
        setError(err?.message ?? "Error loading audit log");
      }
    );
    });

    return () => unsub?.();
  }, []);

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
          Admin Activity Log
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Every moderation action is recorded
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="text-left p-3 font-medium">Admin</th>
              <th className="text-left p-3 font-medium">Action</th>
              <th className="text-left p-3 font-medium">Target</th>
              <th className="text-left p-3 font-medium">Time</th>
              <th className="text-left p-3 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                className="border-t border-slate-200 dark:border-slate-700"
              >
                <td className="p-3">
                  {log.adminEmail ?? log.adminId?.slice(0, 8) ?? "-"}
                </td>
                <td className="p-3 font-medium">{log.action}</td>
                <td className="p-3">
                  {log.targetUserId && (
                    <span className="font-mono text-xs">
                      User: {log.targetUserId.slice(0, 12)}…
                    </span>
                  )}
                  {log.listingId && (
                    <span className="font-mono text-xs ml-1">
                      Listing: {log.listingId.slice(0, 8)}…
                    </span>
                  )}
                  {!log.targetUserId && !log.listingId && "-"}
                </td>
                <td className="p-3">{formatTimeAgo(log.timestamp)}</td>
                <td className="p-3 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                  {log.note ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logs.length === 0 && !error && (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          No audit entries yet. Actions will appear here as you moderate.
        </div>
      )}
    </div>
  );
}
