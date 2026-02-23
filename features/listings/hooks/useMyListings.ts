"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getDb } from "@/lib/firebase";
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import type { Listing, ListingStatus, ListingsFilters } from "../types";

function mapDocToListing(docSnap: { id: string; data: () => Record<string, unknown> }): Listing {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    variety: data.variety as string | undefined,
    title: data.title as string | undefined,
    price: typeof data.price === "number" ? data.price : undefined,
    quantity: data.quantity as number | undefined,
    unit: data.unit as string | undefined,
    region: data.region as string | undefined,
    village: data.village as string | undefined,
    category: data.category as string | undefined,
    photoUrls: data.photoUrls as string[] | undefined,
    photoUrls200: data.photoUrls200 as string[] | undefined,
    imageUrl: data.imageUrl as string | undefined,
    image: data.image as string | undefined,
    image200: data.image200 as string | undefined,
    photos: data.photos as string[] | undefined,
    thumbnail: data.thumbnail as string | undefined,
    mainImage: data.mainImage as string | undefined,
    photo: data.photo as string | undefined,
    status: (data.status ?? "active") as ListingStatus,
    userId: data.userId as string | undefined,
    createdAt: data.createdAt as Listing["createdAt"],
  };
}

export function useMyListings(t?: (key: string) => string) {
  const [user, setUser] = useState<User | null>(auth?.currentUser ?? null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListingsFilters>({
    status: "all",
    category: "all",
    search: "",
  });

  const filteredListings = listings.filter((item) => {
    const status = (item.status ?? "active") as ListingStatus;
    const category = item.category ?? "grapes";
    const matchStatus = filters.status === "all" || status === filters.status;
    const matchCategory = filters.category === "all" || category === filters.category;

    const matchSearch = !filters.search.trim()
      ? true
      : (() => {
          const q = filters.search.trim().toLowerCase();
          const fields = [
            item.variety,
            item.title,
            item.region,
            item.village,
            item.category,
          ].filter(Boolean) as string[];
          return fields.some((f) => f.toLowerCase().includes(q));
        })();

    return matchStatus && matchCategory && matchSearch;
  });

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setListings([]);
      return;
    }
    setLoading(true);
    let unsub: (() => void) | undefined;
    getDb().then((db) => {
      if (!db) {
        setListings([]);
        setLoading(false);
        return;
      }
      const q = query(
        collection(db, "marketListings"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      unsub = onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((d) => mapDocToListing(d));
          setListings(list);
          setLoading(false);
        },
        (err) => {
          console.error("My listings load error:", err);
          setListings([]);
          setLoading(false);
        }
      );
    });
    return () => {
      unsub?.();
    };
  }, [user]);

  const updateStatus = useCallback(
    async (listingId: string, status: ListingStatus) => {
      if (!user) return;
      const db = await getDb();
      if (!db) return;
      setError(null);
      try {
        await updateDoc(doc(db, "marketListings", listingId), { status });
        setListings((prev) =>
          prev.map((l) => (l.id === listingId ? { ...l, status } : l))
        );
      } catch (e) {
        console.error("Update status error:", e);
        setError(t?.("market.errorUpdateStatus") ?? "Failed to update status");
      }
    },
    [user]
  );

  const removeListing = useCallback(
    async (listingId: string) => {
      if (!user) return;
      const db = await getDb();
      if (!db) return;
      setError(null);
      try {
        await updateDoc(doc(db, "marketListings", listingId), { status: "removed" });
        setListings((prev) =>
          prev.map((l) =>
            l.id === listingId ? { ...l, status: "removed" as const } : l
          )
        );
      } catch (e) {
        console.error("Remove listing error:", e);
        setError(t?.("market.errorRemoveListing") ?? "Failed to remove listing");
      }
    },
    [user]
  );

  const deleteListing = useCallback(
    async (listingId: string) => {
      if (!user) return;
      const db = await getDb();
      if (!db) return;
      setError(null);
      try {
        await deleteDoc(doc(db, "marketListings", listingId));
        setListings((prev) => prev.filter((l) => l.id !== listingId));
      } catch (e) {
        console.error("Delete listing error:", e);
        setError(t?.("market.errorDeleteListing") ?? "Failed to delete listing");
      }
    },
    [user]
  );

  const activeCount = listings.filter((l) => (l.status ?? "active") === "active").length;

  const statusCounts = useMemo(() => {
    const counts: Record<ListingStatus | "all", number> = {
      all: listings.length,
      active: 0,
      reserved: 0,
      sold: 0,
      expired: 0,
      removed: 0,
    };
    for (const l of listings) {
      const s = (l.status ?? "active") as ListingStatus;
      if (s in counts) counts[s]++;
    }
    return counts;
  }, [listings]);

  return {
    user,
    listings,
    filteredListings,
    loading,
    error,
    setError,
    filters,
    setFilters,
    updateStatus,
    removeListing,
    deleteListing,
    activeCount,
    statusCounts,
  };
}
