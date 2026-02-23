"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { getThumbUrl } from "@/lib/imageUtils";
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
import { ConfirmModal } from "@/components/ConfirmModal";

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

type ModalType = null | { type: "remove"; item: Listing } | { type: "delete"; item: Listing };

export default function MyListingsClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const [user, setUser] = useState(auth?.currentUser ?? null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ListingStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredListings = listings.filter((item) => {
    const status = (item.status ?? "active") as ListingStatus;
    const category = item.category ?? "grapes";
    const matchStatus = statusFilter === "all" || status === statusFilter;
    const matchCategory = categoryFilter === "all" || category === categoryFilter;
    return matchStatus && matchCategory;
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
      const db = await getDb();
      if (!db) return;
      setModalLoading(true);
      setError(null);
      try {
        await updateDoc(doc(db, "marketListings", item.id), { status: "removed" });
        setListings((prev) =>
          prev.map((l) =>
            l.id === item.id ? { ...l, status: "removed" as const } : l
          )
        );
        setModal(null);
      } catch (e) {
        console.error("Remove listing error:", e);
        setError(t("common.error") + ": " + t("market.errorLoad"));
      } finally {
        setModalLoading(false);
      }
    },
    [user, t]
  );

  const handleDelete = useCallback(
    async (item: Listing) => {
      if (!user) return;
      const db = await getDb();
      if (!db) return;
      setModalLoading(true);
      setError(null);
      try {
        await deleteDoc(doc(db, "marketListings", item.id));
        setListings((prev) => prev.filter((l) => l.id !== item.id));
        setModal(null);
      } catch (e) {
        console.error("Delete listing error:", e);
        setError(t("common.error") + ": " + t("market.errorLoad"));
      } finally {
        setModalLoading(false);
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
        <div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0] py-14 sm:py-20">
      <Container>
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8 gap-4">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {t("nav.myListings")}
              </h1>
              <div className="flex items-center gap-2">
                <Link
                  href="/my-listings/add"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm font-medium shadow-lg shadow-emerald-500/25"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t("market.add")}
                </Link>
                <Link href="/" className="vn-btn vn-btn-ghost text-sm">
                  ← {t("nav.market")}
                </Link>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Filters */}
            {listings.length > 0 && (
              <div className="mb-6 flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-slate-600 self-center mr-1">{t("market.status")}:</span>
                  {(["all", "active", "reserved", "sold", "expired", "removed"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        statusFilter === s
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
                          : "bg-white border border-[#e8e6e1] text-slate-700 hover:bg-[#fafaf8]"
                      }`}
                    >
                      {s === "all" ? t("common.all") : t(`market.status${s.charAt(0).toUpperCase() + s.slice(1)}`)}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-slate-600 self-center mr-1">{t("market.category")}:</span>
                  {["all", "grapes", "wine", "nobati", "inventory", "seedlings"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategoryFilter(c)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                        categoryFilter === c
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
                          : "bg-white border border-[#e8e6e1] text-slate-700 hover:bg-[#fafaf8]"
                      }`}
                    >
                      {c === "all" ? t("common.all") : (
                        <>
                          <span>{CATEGORY_ICONS[c] ?? "📦"}</span>
                          {t(getCategoryLabelKey(c))}
                        </>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-slate-500">
                  {filteredListings.length} {t("market.listings")}
                </p>
              </div>
            )}

            {listings.length === 0 ? (
              <div className="vn-glass-hero vn-card vn-card-pad text-center py-20 rounded-2xl">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-6">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-slate-900 mb-2">
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
            ) : filteredListings.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-white/80 border border-[#e8e6e1]">
                <p className="text-slate-600 font-medium">{t("market.emptyFeed")}</p>
                <p className="text-sm text-slate-500 mt-1">{t("market.noMatchFilter")}</p>
                <button
                  onClick={() => { setStatusFilter("all"); setCategoryFilter("all"); }}
                  className="mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-[#f5f4f0] border border-[#e8e6e1] text-slate-700 hover:bg-[#ebe9e4] transition-colors"
                >
                  {t("common.reset")} {t("common.all")}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredListings.map((item) => {
                  const photoUrl = getListingImageUrl(item);
                  const variety = item.variety ?? item.title ?? t("market.unknownListing");
                  const status = (item.status ?? "active") as ListingStatus;
                  const daysLeft = getDaysLeft(item.createdAt);
                  const expiryProgress = getExpiryProgress(item.createdAt);

                  return (
                    <div
                      key={item.id}
                      className="vn-glass-hero vn-card overflow-hidden bg-white/90 shadow-md hover:shadow-xl transition-all duration-200 rounded-2xl border border-white/50 group"
                    >
                      <span
                        className="absolute top-3 right-3 inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-white z-10 shadow-sm"
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
                        onClick={() => router.push(`/?id=${item.id}`)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && router.push(`/?id=${item.id}`)
                        }
                        className="flex items-center gap-4 p-5 cursor-pointer"
                      >
                        <div className="relative w-[80px] h-[80px] rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 flex items-center justify-center">
                          {photoUrl ? (
                            <Image
                              src={getThumbUrl(photoUrl, 200) ?? photoUrl}
                              alt=""
                              fill
                              sizes="80px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <span className="text-slate-400 text-3xl">
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
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 truncate text-lg">
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
                          <p className="text-sm text-emerald-800 font-semibold">
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
                              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-600 rounded-full transition-all"
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
                            className="p-3 text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
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
                                setModal({ type: "remove", item });
                              }}
                              className="p-3 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
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
                              setModal({ type: "delete", item });
                            }}
                            className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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

      {/* Remove confirmation modal */}
      {modal?.type === "remove" && (
        <ConfirmModal
          open={true}
          onClose={() => setModal(null)}
          onConfirm={() => handleMarkRemoved(modal.item)}
          title={t("market.removeConfirm")}
          message={t("market.removeConfirmMessage")}
          confirmLabel={t("market.removeListing")}
          cancelLabel={t("common.cancel")}
          variant="warning"
          loading={modalLoading}
        />
      )}

      {/* Delete confirmation modal */}
      {modal?.type === "delete" && (
        <ConfirmModal
          open={true}
          onClose={() => setModal(null)}
          onConfirm={() => handleDelete(modal.item)}
          title={t("market.deleteConfirmTitle")}
          message={t("market.deleteConfirm")}
          confirmLabel={t("market.deleteListing")}
          cancelLabel={t("common.cancel")}
          variant="danger"
          loading={modalLoading}
        />
      )}
    </div>
  );
}
