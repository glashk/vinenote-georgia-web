"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
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
  Timestamp,
} from "firebase/firestore";
import { useLanguage } from "@/contexts/LanguageContext";

const LISTING_EXPIRY_DAYS = 30;

type ListingStatus = "active" | "reserved" | "sold" | "expired" | "removed";

interface Listing {
  id: string;
  variety?: string;
  title?: string;
  price?: number;
  quantity?: number;
  unit?: string;
  region?: string;
  village?: string;
  category?: string;
  photoUrls?: string[];
  imageUrl?: string;
  image?: string;
  photos?: string[];
  thumbnail?: string;
  status?: ListingStatus;
  userId?: string;
  createdAt?: Timestamp | { seconds: number; nanoseconds?: number } | Date;
}

const STATUS_COLORS: Record<ListingStatus, string> = {
  active: "#4a7c59",
  reserved: "#c7772c",
  sold: "#6b6b6b",
  expired: "#8a9a85",
  removed: "#c44d2e",
};

const CATEGORY_COLORS: Record<string, string> = {
  grapes: "#2d5a27",
  wine: "#872817",
  nobati: "#C7772C",
  inventory: "#5a6b7d",
  seedlings: "#4a7c59",
};

const CATEGORY_ICONS: Record<string, string> = {
  grapes: "🍇",
  wine: "🍷",
  nobati: "🥜",
  inventory: "📦",
  seedlings: "🌱",
};

function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.grapes;
}

function getCategoryLabelKey(cat: string): string {
  const c = cat?.toLowerCase() ?? "grapes";
  const cap = c.charAt(0).toUpperCase() + c.slice(1);
  return `market.category${cap}`;
}

function getListingImageUrl(listing: Listing | null): string | null {
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

function getDaysLeft(
  createdAt:
    | Timestamp
    | { seconds: number; nanoseconds?: number }
    | Date
    | undefined
): number {
  if (!createdAt) return 0;
  let date: Date;
  if (createdAt instanceof Date) {
    date = createdAt;
  } else if (
    createdAt &&
    typeof (createdAt as Timestamp).toDate === "function"
  ) {
    date = (createdAt as Timestamp).toDate();
  } else if (
    createdAt &&
    typeof (createdAt as { seconds: number }).seconds === "number"
  ) {
    const t = createdAt as { seconds: number; nanoseconds?: number };
    date = new Date(t.seconds * 1000 + (t.nanoseconds ?? 0) / 1_000_000);
  } else {
    return 0;
  }
  const expiry = new Date(date);
  expiry.setDate(expiry.getDate() + LISTING_EXPIRY_DAYS);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function getExpiryProgress(
  createdAt:
    | Timestamp
    | { seconds: number; nanoseconds?: number }
    | Date
    | undefined
): number {
  if (!createdAt) return 0;
  let date: Date;
  if (createdAt instanceof Date) {
    date = createdAt;
  } else if (
    createdAt &&
    typeof (createdAt as Timestamp).toDate === "function"
  ) {
    date = (createdAt as Timestamp).toDate();
  } else if (
    createdAt &&
    typeof (createdAt as { seconds: number }).seconds === "number"
  ) {
    const t = createdAt as { seconds: number; nanoseconds?: number };
    date = new Date(t.seconds * 1000 + (t.nanoseconds ?? 0) / 1_000_000);
  } else {
    return 0;
  }
  const expiry = new Date(date);
  expiry.setDate(expiry.getDate() + LISTING_EXPIRY_DAYS);
  const now = new Date();
  const total = expiry.getTime() - date.getTime();
  const elapsed = now.getTime() - date.getTime();
  return Math.min(1, Math.max(0, elapsed / total));
}

export default function MyListingsClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const [user, setUser] = useState(auth?.currentUser ?? null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
          const list: Listing[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              variety: data.variety,
              title: data.title,
              price: typeof data.price === "number" ? data.price : undefined,
              quantity: data.quantity,
              unit: data.unit,
              region: data.region,
              village: data.village,
              category: data.category,
              photoUrls: data.photoUrls,
              imageUrl: data.imageUrl,
              image: data.image,
              photos: data.photos,
              thumbnail: data.thumbnail,
              status: (data.status ?? "active") as ListingStatus,
              userId: data.userId,
              createdAt: data.createdAt,
            };
          });
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
    return () => unsub?.();
  }, [user]);

  const handleMarkRemoved = useCallback(
    async (item: Listing) => {
      if (!user || item.status === "removed") return;
      if (!confirm(t("market.removeConfirm") + "\n\nOK = Remove from market, Cancel = Delete permanently")) return;
      const db = await getDb();
      if (!db) return;
      try {
        await updateDoc(doc(db, "marketListings", item.id), { status: "removed" });
        setListings((prev) =>
          prev.map((l) =>
            l.id === item.id ? { ...l, status: "removed" as const } : l
          )
        );
      } catch (e) {
        console.error("Remove listing error:", e);
        alert(t("common.error") + ": " + t("market.errorLoad"));
      }
    },
    [user, t]
  );

  const handleDelete = useCallback(
    async (item: Listing) => {
      if (!user) return;
      if (!confirm(t("market.deleteConfirm"))) return;
      const db = await getDb();
      if (!db) return;
      try {
        await deleteDoc(doc(db, "marketListings", item.id));
        setListings((prev) => prev.filter((l) => l.id !== item.id));
      } catch (e) {
        console.error("Delete listing error:", e);
        alert(t("common.error") + ": " + t("market.errorLoad"));
      }
    },
    [user, t]
  );

  const statusLabel = (status: ListingStatus) => {
    const map: Record<ListingStatus, string> = {
      active: "market.statusActive",
      reserved: "market.statusReserved",
      sold: "market.statusSold",
      expired: "market.statusExpired",
      removed: "market.statusRemoved",
    };
    return t(map[status] ?? status);
  };

  const getUnitLabel = (unit: string) => {
    const key = `market.units.${unit}`;
    const label = t(key);
    return label === key ? unit : label;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f4f0]">
        <div className="text-center px-6">
          <p className="text-slate-600 mb-4">{t("auth.signIn.noAccount")}</p>
          <Link href="/login" className="vn-btn vn-btn-primary">
            {t("nav.signIn")}
          </Link>
        </div>
      </div>
    );
  }

  if (loading && listings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f4f0]">
        <div className="w-10 h-10 border-2 border-vineyard-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <section className="relative overflow-hidden py-14 sm:py-20">
        <div className="absolute inset-0">
          <Image
            src="/dan-meyers-0AgtPoAARtE-unsplash-541a468a-f343-4b2a-9896-214be82fd831.png"
            alt="Vineyard"
            fill
            className="object-cover"
            loading="lazy"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-transparent" />
        </div>
        <Container>
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6 gap-4">
              <h1 className="text-2xl font-semibold text-slate-900">
                {t("nav.myListings")}
              </h1>
              <div className="flex items-center gap-2">
                <Link
                  href="/my-listings/add"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vineyard-800 text-white hover:bg-vineyard-900 transition-colors text-sm font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t("market.add")}
                </Link>
                <Link href="/market" className="vn-btn vn-btn-ghost text-sm">
                  ← {t("nav.market")}
                </Link>
              </div>
            </div>

            {listings.length === 0 ? (
              <div className="vn-glass-hero vn-card vn-card-pad text-center py-16">
                <p className="text-lg font-semibold text-slate-900 mb-2">
                  {t("market.emptyFeed")}
                </p>
                <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                  {t("market.emptyFeedSubtext")}
                </p>
                <Link href="/" className="vn-btn vn-btn-primary">
                  {t("market.createFirst")}
                </Link>
                <p className="text-sm text-slate-500 mt-4">
                  {t("market.createFirstHint")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {listings.map((item) => {
                  const photoUrl = getListingImageUrl(item);
                  const variety = item.variety ?? item.title ?? t("market.unknownListing");
                  const status = (item.status ?? "active") as ListingStatus;
                  const daysLeft = getDaysLeft(item.createdAt);
                  const expiryProgress = getExpiryProgress(item.createdAt);

                  return (
                    <div
                      key={item.id}
                      className="vn-glass-hero vn-card overflow-hidden bg-white/90 shadow-md hover:shadow-lg transition-shadow relative"
                    >
                      <span
                        className="absolute top-2.5 right-2.5 inline-flex w-fit items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-white z-10"
                        style={{
                          backgroundColor: getCategoryColor(item.category ?? "grapes"),
                        }}
                      >
                        {CATEGORY_ICONS[item.category ?? "grapes"] ?? "📦"}{" "}
                        {t(getCategoryLabelKey(item.category ?? "grapes"))}
                      </span>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/market?id=${item.id}`)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && router.push(`/market?id=${item.id}`)
                        }
                        className="flex items-center gap-4 p-4 cursor-pointer"
                      >
                        <div className="w-[68px] h-[68px] rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 flex items-center justify-center">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <span className="text-slate-400 text-2xl">
                              {item.category === "wine"
                                ? "🍷"
                                : item.category === "nobati"
                                  ? "🥜"
                                  : item.category === "inventory"
                                    ? "📦"
                                    : item.category === "seedlings"
                                      ? "🌱"
                                      : "🍇"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-slate-900 truncate">
                              {variety}
                            </span>
                            <span
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-white shrink-0"
                              style={{
                                backgroundColor: STATUS_COLORS[status] || "#8a9a85",
                              }}
                            >
                              {statusLabel(status)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 truncate mb-1">
                            {[item.region, item.village].filter(Boolean).join(", ") || "—"}
                          </p>
                          <p className="text-sm text-vineyard-800 font-semibold">
                            {item.quantity} {getUnitLabel(item.unit ?? "kg")}
                            {item.price != null && item.price > 0 ? (
                              ` • ${item.price} ₾`
                            ) : (
                              <span className="text-slate-600 font-medium">
                                {" "}
                                • {t("market.priceByAgreement")}
                              </span>
                            )}
                          </p>
                          {status === "active" && (
                            <div className="mt-2">
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-vineyard-600 rounded-full transition-all"
                                  style={{
                                    width: `${Math.max(0, expiryProgress * 100)}%`,
                                  }}
                                />
                              </div>
                              <p className="text-xs text-slate-600 font-semibold mt-1">
                                {daysLeft > 0
                                  ? t("market.daysLeft").replace("{{count}}", String(daysLeft))
                                  : t("market.statusExpired")}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/my-listings/edit?id=${item.id}`);
                            }}
                            className="p-2.5 text-vineyard-800 hover:bg-white/50 rounded-lg transition-colors"
                            aria-label={t("common.edit")}
                            title={t("common.edit")}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          {status !== "removed" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkRemoved(item);
                              }}
                              className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              aria-label={t("market.removeListing")}
                              title={t("market.removeListing")}
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                />
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item);
                            }}
                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label={t("market.deleteListing")}
                            title={t("market.deleteListing")}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Container>
      </section>
    </div>
  );
}
