"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getThumbUrl } from "@/lib/imageUtils";
import { getDb } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

const ADMIN_DENIED_MESSAGE = "თქვენ არ გაქვთ ადმინისტრატორის უფლება";

type MarketCategory = "grapes" | "wine" | "nobati";

interface Listing {
  id: string;
  variety?: string;
  title?: string;
  description?: string;
  price?: number;
  quantity?: number;
  unit?: string;
  region?: string;
  village?: string;
  category?: MarketCategory;
  harvestDate?: string;
  sugarBrix?: number;
  vintageYear?: number;
  phone?: string;
  contactName?: string;
  photoUrls?: string[];
  imageUrl?: string;
  image?: string;
  photos?: string[];
  thumbnail?: string;
  hidden?: boolean;
  userId?: string;
  createdAt?: Timestamp | { seconds: number; nanoseconds?: number } | Date;
}

function getListingImageUrl(
  listing: Listing | null | undefined,
): string | null {
  if (!listing) return null;
  return (
    listing.photoUrls?.[0] ??
    listing.imageUrl ??
    listing.image ??
    listing.thumbnail ??
    listing.photos?.[0] ??
    null
  );
}

function formatTimeAgo(
  timestamp:
    | Timestamp
    | { seconds: number; nanoseconds?: number }
    | Date
    | undefined,
): string {
  if (!timestamp) return "-";
  let date: Date;
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (
    timestamp &&
    typeof (timestamp as Timestamp).toDate === "function"
  ) {
    date = (timestamp as Timestamp).toDate();
  } else if (
    timestamp &&
    typeof (timestamp as { seconds: number }).seconds === "number"
  ) {
    const t = timestamp as { seconds: number; nanoseconds?: number };
    date = new Date(t.seconds * 1000 + (t.nanoseconds ?? 0) / 1_000_000);
  } else {
    return "-";
  }
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "ახლახან";
  if (diffMins < 60) return `${diffMins} წუთის წინ`;
  if (diffHours < 24) return `${diffHours} საათის წინ`;
  if (diffDays < 7) return `${diffDays} დღის წინ`;
  return date.toLocaleDateString("ka-GE");
}

export default function MarketClient() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    getDb().then((db) => {
      if (!db) {
        setLoading(false);
        return;
      }

      const listingsRef = collection(db, "marketListings");
      const q = query(listingsRef, orderBy("createdAt", "desc"));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: Listing[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              variety: data.variety,
              title: data.title,
              description: data.description,
              price: typeof data.price === "number" ? data.price : undefined,
              quantity: data.quantity,
              unit: data.unit,
              region: data.region,
              village: data.village,
              category: data.category,
              harvestDate: data.harvestDate,
              sugarBrix: data.sugarBrix,
              vintageYear: data.vintageYear,
              phone: data.phone,
              contactName: data.contactName,
              photoUrls: data.photoUrls,
              imageUrl: data.imageUrl,
              image: data.image,
              photos: data.photos,
              thumbnail: data.thumbnail,
              hidden: data.hidden,
              userId: data.userId,
              createdAt: data.createdAt,
            };
          });
          setListings(list);
          setLoading(false);
          setError(null);
        },
        (err) => {
          setLoading(false);
          if (
            err?.code === "permission-denied" ||
            err?.message?.includes("permission")
          ) {
            setError(ADMIN_DENIED_MESSAGE);
          } else {
            setError(err?.message ?? "შეცდომა მოხდა");
          }
        },
      );
    });

    return () => unsubscribe?.();
  }, []);

  const handleHideListing = async (listingId: string) => {
    const db = await getDb();
    if (!db) return;
    setActionLoading(listingId);
    setError(null);
    try {
      await updateDoc(doc(db, "marketListings", listingId), {
        hidden: true,
        hiddenAt: serverTimestamp(),
        hiddenReason: "admin",
      });
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (
        e?.code === "permission-denied" ||
        e?.message?.includes("permission")
      ) {
        setError(ADMIN_DENIED_MESSAGE);
      } else {
        setError(e?.message ?? "შეცდომა");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnhideListing = async (listingId: string) => {
    const db = await getDb();
    if (!db) return;
    setActionLoading(listingId);
    setError(null);
    try {
      await updateDoc(doc(db, "marketListings", listingId), {
        hidden: false,
        hiddenAt: null,
        hiddenReason: null,
      });
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (
        e?.code === "permission-denied" ||
        e?.message?.includes("permission")
      ) {
        setError(ADMIN_DENIED_MESSAGE);
      } else {
        setError(e?.message ?? "შეცდომა");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    const db = await getDb();
    if (!db) return;
    setActionLoading(listingId);
    setError(null);
    try {
      await deleteDoc(doc(db, "marketListings", listingId));
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (
        e?.code === "permission-denied" ||
        e?.message?.includes("permission")
      ) {
        setError(ADMIN_DENIED_MESSAGE);
      } else {
        setError(e?.message ?? "შეცდომა");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const filteredListings = listings.filter((l) => {
    if (filter === "visible") return !l.hidden;
    if (filter === "hidden") return l.hidden === true;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="w-10 h-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">მარკეტი</h1>
            <p className="text-slate-500 text-sm mt-1">
              ყველა მომხმარებლის ჩანაწერები
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/reports" className="vn-btn vn-btn-ghost text-sm">
              მოხსენებები
            </Link>
            <Link href="/" className="vn-btn vn-btn-ghost text-sm">
              ← მთავარი
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {(["all", "visible", "hidden"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`vn-btn text-sm ${
                filter === f ? "vn-btn-primary" : "vn-btn-ghost"
              }`}
            >
              {f === "all" && "ყველა"}
              {f === "visible" && "ხილული"}
              {f === "hidden" && "დამალული"}
            </button>
          ))}
        </div>

        <p className="text-slate-500 text-sm mb-4">
          სულ: {filteredListings.length} ჩანაწერი
        </p>

        {filteredListings.length === 0 ? (
          <div className="vn-glass vn-card vn-card-pad text-center py-16">
            <p className="text-slate-500">ჩანაწერები არ არის</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredListings.map((listing) => {
              const listingHidden = listing.hidden === true;
              const imgUrl = getListingImageUrl(listing);
              const isBusy = actionLoading === listing.id;

              return (
                <div
                  key={listing.id}
                  className={`vn-glass vn-card vn-card-pad ${
                    listingHidden ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-shrink-0">
                      <div className="relative w-24 h-24 rounded-xl bg-slate-200 overflow-hidden flex items-center justify-center">
                        {imgUrl ? (
                          <Image
                            src={getThumbUrl(imgUrl, 200) ?? imgUrl}
                            alt=""
                            fill
                            sizes="96px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="text-slate-400 text-xs">
                            ფოტო არა
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-white ${
                            (listing.category ?? "grapes") === "wine"
                              ? "bg-[#872817]"
                              : (listing.category ?? "grapes") === "nobati"
                                ? "bg-[#C7772C]"
                                : "bg-[#99Aa3D]"
                          }`}
                        >
                          {(listing.category ?? "grapes") === "grapes"
                            ? "ყურძენი"
                            : (listing.category ?? "grapes") === "wine"
                              ? "ღვინო"
                              : "ნობათი"}
                        </span>
                        <span className="font-medium text-slate-900">
                          {listing.variety ??
                            listing.title ??
                            "უცნობი ჩანაწერი"}
                        </span>
                        {listingHidden && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            დამალული
                          </span>
                        )}
                      </div>
                      {[listing.region, listing.village].filter(Boolean)
                        .length > 0 && (
                        <p className="text-slate-600 text-sm mb-1">
                          📍{" "}
                          {[listing.region, listing.village]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                      {listing.quantity != null && listing.unit && (
                        <p className="text-slate-600 text-sm mb-1">
                          {listing.quantity} {listing.unit}
                        </p>
                      )}
                      {listing.price != null && listing.price > 0 ? (
                        <p className="text-green-700 font-medium text-sm mb-1">
                          {listing.price} ₾
                        </p>
                      ) : (
                        <p className="text-slate-500 text-xs mb-1">
                          შეთანხმებით
                        </p>
                      )}
                      <div className="text-xs text-slate-500 space-y-0.5">
                        <p>მომხმარებელი: {listing.userId ?? "-"}</p>
                        <p>{formatTimeAgo(listing.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                      {listingHidden ? (
                        <button
                          onClick={() => handleUnhideListing(listing.id)}
                          disabled={isBusy}
                          className="vn-btn vn-btn-primary text-sm disabled:opacity-50"
                        >
                          გამოჩენა
                        </button>
                      ) : (
                        <button
                          onClick={() => handleHideListing(listing.id)}
                          disabled={isBusy}
                          className="vn-btn vn-btn-primary text-sm disabled:opacity-50"
                        >
                          დამალვა
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteListing(listing.id)}
                        disabled={isBusy}
                        className="vn-btn text-sm border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        წაშლა
                      </button>
                    </div>
                  </div>
                  {isBusy && (
                    <div className="mt-2 flex gap-2 text-slate-500 text-sm">
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      მუშავდება...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
