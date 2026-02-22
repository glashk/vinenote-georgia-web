"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDb } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { formatTimeAgo, getListingImageUrl } from "@/modules/admin/utils";
import type { Listing } from "@/modules/admin/types";

const SUSPICIOUS_KEYWORDS = ["free", "test", "spam", "scam", "fake"];
const MAX_LISTINGS_PER_DAY = 10;

export default function SafetyClient() {
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [flaggedListings, setFlaggedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    getDb().then((db) => {
      if (!db) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "marketListings"),
        orderBy("createdAt", "desc")
      );

      unsub = onSnapshot(q, (snap) => {
      const list: Listing[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as Listing));

      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const listingsByUser: Record<string, Listing[]> = {};
      const listingsByUserToday: Record<string, number> = {};
      const titles: Record<string, number> = {};

      list.forEach((l) => {
        const uid = l.userId ?? "unknown";
        if (!listingsByUser[uid]) listingsByUser[uid] = [];
        listingsByUser[uid].push(l);

        const created = (l.createdAt as { seconds?: number })?.seconds
          ? (l.createdAt as { seconds: number }).seconds * 1000
          : 0;
        if (now - created < oneDay) {
          listingsByUserToday[uid] = (listingsByUserToday[uid] ?? 0) + 1;
        }

        const title = (l.title ?? l.variety ?? "").toLowerCase();
        if (title) titles[title] = (titles[title] ?? 0) + 1;
      });

      const flagged: Listing[] = [];
      list.forEach((l) => {
        const reasonsForThis: string[] = [];
        if (l.price === 0) reasonsForThis.push("Price = 0");
        if (
          SUSPICIOUS_KEYWORDS.some((k) =>
            (l.title ?? "").toLowerCase().includes(k)
          )
        ) {
          reasonsForThis.push("Suspicious keyword");
        }
        const uid = l.userId ?? "unknown";
        if ((listingsByUserToday[uid] ?? 0) > MAX_LISTINGS_PER_DAY) {
          reasonsForThis.push("Too many listings today");
        }
        const title = (l.title ?? l.variety ?? "").toLowerCase();
        if (title && (titles[title] ?? 0) > 3) {
          reasonsForThis.push("Duplicate title");
        }
        if (reasonsForThis.length > 0 || l.flaggedBySystem) {
          flagged.push({
            ...l,
            flagReasons: reasonsForThis.length > 0 ? reasonsForThis : (l.flagReasons ?? []),
          });
        }
      });

      setAllListings(list);
      setFlaggedListings(flagged);
      setLoading(false);
    });
    });

    return () => unsub?.();
  }, []);

  const handleClearFlag = async (listingId: string) => {
    const db = await getDb();
    if (!db) return;
    setActionLoading(listingId);
    try {
      await updateDoc(doc(db, "marketListings", listingId), {
        flaggedBySystem: false,
        flagReasons: [],
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePersistFlag = async (listingId: string, reasons: string[]) => {
    const db = await getDb();
    if (!db) return;
    setActionLoading(listingId);
    try {
      await updateDoc(doc(db, "marketListings", listingId), {
        flaggedBySystem: true,
        flagReasons: reasons,
        flaggedAt: serverTimestamp(),
      });
    } finally {
      setActionLoading(null);
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
          Marketplace Safety Tools
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Auto-flagged listings and safety rules
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h1 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
          Auto-flag rules
        </h1>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
          <li>• Price = 0</li>
          <li>• Suspicious keywords: {SUSPICIOUS_KEYWORDS.join(", ")}</li>
          <li>• More than {MAX_LISTINGS_PER_DAY} listings per day</li>
          <li>• Identical titles repeated (3+ times)</li>
        </ul>
      </div>

      <div>
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Flagged by system ({flaggedListings.length})
        </h2>
        {flaggedListings.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            No listings flagged by system
          </div>
        ) : (
          <div className="space-y-4">
            {flaggedListings.map((listing) => {
              const imgUrl = getListingImageUrl(listing);
              const isBusy = actionLoading === listing.id;
              return (
                <div
                  key={listing.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex gap-4"
                >
                  <div className="w-20 h-20 rounded-lg bg-slate-200 dark:bg-slate-600 overflow-hidden flex-shrink-0">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      {listing.title ?? listing.variety ?? "Untitled"}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(listing.flagReasons ?? []).map((r) => (
                        <span
                          key={r}
                          className="px-2 py-0.5 rounded text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {formatTimeAgo(listing.createdAt)} • {listing.userId?.slice(0, 8)}…
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      href="/admin/listings"
                      className="px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-700"
                    >
                      View
                    </Link>
                    {listing.flaggedBySystem ? (
                      <button
                        onClick={() => handleClearFlag(listing.id)}
                        disabled={isBusy}
                        className="px-3 py-2 text-sm rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800"
                      >
                        Clear flag
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handlePersistFlag(listing.id, listing.flagReasons ?? [])
                        }
                        disabled={isBusy}
                        className="px-3 py-2 text-sm rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800"
                      >
                        Persist flag
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
