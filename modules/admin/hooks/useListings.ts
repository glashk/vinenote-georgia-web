"use client";

import { useEffect, useState } from "react";
import { getDb } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import type { Listing } from "../types";

export type ListingFilter = "all" | "active" | "hidden" | "flagged";

export function useListings(filter: ListingFilter = "all") {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    getDb().then((db) => {
      if (!db) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "marketListings"),
        orderBy("createdAt", "desc")
      );

      unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Listing[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt ?? Timestamp.now(),
          } as Listing;
        });
        setListings(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setLoading(false);
        setError(err?.message ?? "Error loading listings");
      }
    );
    });

    return () => unsubscribe?.();
  }, []);

  const filteredListings = listings.filter((l) => {
    if (filter === "active") return !l.hidden && !l.flaggedBySystem;
    if (filter === "hidden") return l.hidden === true;
    if (filter === "flagged") return l.flaggedBySystem === true;
    return true;
  });

  return {
    listings: filteredListings,
    allListings: listings,
    loading,
    error,
  };
}
