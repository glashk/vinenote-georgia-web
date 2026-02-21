"use client";

import { useEffect, useState, useCallback } from "react";
import { getDb } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { Report, Listing } from "../types";
import { getListingImageUrl } from "../utils";

export interface ReportWithListing extends Report {
  listing: Listing | null;
}

export function useReports() {
  const [reports, setReports] = useState<ReportWithListing[]>([]);
  const [reportCountByListing, setReportCountByListing] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListing = useCallback(
    async (db: Firestore, listingId: string): Promise<Listing | null> => {
      try {
        const snap = await getDoc(doc(db, "marketListings", listingId));
        if (snap.exists()) return { id: snap.id, ...snap.data() } as Listing;
        return null;
      } catch {
        return null;
      }
    },
    []
  );

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    getDb().then((db) => {
      if (!db) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "reports"),
        orderBy("createdAt", "desc")
      );

      unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const countMap: Record<string, number> = {};
        const reportList: ReportWithListing[] = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const listing = await fetchListing(db, data.listingId ?? "");
          const report: ReportWithListing = {
            id: docSnap.id,
            listingId: data.listingId ?? "",
            reportedUserId: data.reportedUserId ?? "",
            reporterId: data.reporterId ?? "",
            reason: data.reason ?? "",
            createdAt: data.createdAt ?? Timestamp.now(),
            status: data.status,
            reviewedAt: data.reviewedAt,
            listing,
          };

          if (data.status !== "dismissed" && data.status !== "resolved") {
            countMap[report.listingId] = (countMap[report.listingId] ?? 0) + 1;
          }
          reportList.push(report);
        }

        setReportCountByListing(countMap);
        setReports(reportList);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setLoading(false);
        setError(err?.message ?? "Error loading reports");
      }
    );
    });

    return () => unsubscribe?.();
  }, [fetchListing]);

  const pendingReports = reports.filter(
    (r) => r.status !== "dismissed" && r.status !== "resolved"
  );

  return {
    reports,
    pendingReports,
    reportCountByListing,
    loading,
    error,
    getListingImageUrl,
  };
}
