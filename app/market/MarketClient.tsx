"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getDb, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  List,
  LayoutGrid,
  LayoutList,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  SlidersHorizontal,
  MapPin,
  Calendar,
  Heart,
  Share2,
  Square,
  Phone,
  Package,
} from "lucide-react";
import OptimizedListingImage, {
  ThumbnailImage,
} from "@/components/OptimizedListingImage";
import ListingCardSkeleton from "@/components/ListingCardSkeleton";

type MarketCategory = "grapes" | "wine" | "nobati" | "inventory" | "seedlings";
type CategoryFilter = "all" | MarketCategory;
type SortBy =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "brix_asc"
  | "brix_desc"
  | "vintage_asc"
  | "vintage_desc";

const CATEGORY_ICONS: Record<string, string> = {
  grapes: "🍇",
  wine: "🍷",
  nobati: "🥜",
  inventory: "📦",
  seedlings: "🌱",
};

const CATEGORY_COLORS: Record<string, string> = {
  grapes: "#2d5a27",
  wine: "#872817",
  nobati: "#C7772C",
  inventory: "#5a6b7d",
  seedlings: "#4a7c59",
};

function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.grapes;
}

function getCategoryLabelKey(cat: string): string {
  const c = cat?.toLowerCase() ?? "grapes";
  const cap = c.charAt(0).toUpperCase() + c.slice(1);
  return `market.category${cap}`;
}

interface Listing {
  id: string;
  variety?: string;
  title?: string;
  description?: string;
  notes?: string;
  price?: number;
  quantity?: number;
  unit?: string;
  region?: string;
  village?: string;
  category?: string;
  harvestDate?: string;
  sugarBrix?: number;
  vintageYear?: number;
  wineType?: string;
  phone?: string;
  contactName?: string;
  photoUrls?: string[];
  photoUrls200?: string[];
  photoUrls400?: string[];
  imageUrl?: string;
  image?: string;
  image200?: string;
  image400?: string;
  photos?: string[];
  thumbnail?: string;
  hidden?: boolean;
  status?: string;
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

function getPhotoUrls(listing: Listing | null): string[] {
  if (!listing) return [];
  if (listing.photoUrls?.length) return listing.photoUrls;
  const single =
    listing.imageUrl ??
    listing.image ??
    listing.thumbnail ??
    listing.photos?.[0];
  return single ? [single] : [];
}

const STATUS_COLORS: Record<string, string> = {
  active: "#04AA6D",
  reserved: "#c7772c",
  sold: "#6b6b6b",
  expired: "#8a9a85",
  removed: "#8a8a8a",
};

function formatHarvestDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
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

function ListingDetailView({
  listing,
  loading,
  onBack,
  t,
  getUnitLabel,
  onShare,
  onToggleFavorite,
  favoriteIds,
  favoriteToggling,
}: {
  listing: Listing | null;
  loading: boolean;
  onBack: () => void;
  t: (key: string) => string;
  getUnitLabel: (unit: string) => string;
  onShare?: (listingId: string) => void;
  onToggleFavorite?: (listingId: string, e: React.MouseEvent) => void;
  favoriteIds?: Set<string>;
  favoriteToggling?: string | null;
}) {
  const [carouselIndex, setCarouselIndex] = useState(0);

  if (loading && !listing) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 flex justify-center items-center">
        <div className="w-10 h-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing || listing.hidden) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center py-16">
          <p className="text-slate-600 mb-4">{t("market.errorLoad")}</p>
          <button onClick={onBack} className="vn-btn vn-btn-primary">
            ← {t("market.backToList")}
          </button>
        </div>
      </div>
    );
  }

  const photoUrls = getPhotoUrls(listing);
  const displayTitle =
    listing.variety ?? listing.title ?? t("market.unknownListing");
  const category = listing.category ?? "grapes";
  const locationText = [listing.region, listing.village]
    .filter(Boolean)
    .join(", ");
  const status = listing.status ?? "active";
  const statusColor = STATUS_COLORS[status] ?? "#8a8a8a";

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
        >
          ← {t("market.backToList")}
        </button>

        <div className="vn-glass vn-card overflow-hidden rounded-2xl mb-6">
          {photoUrls.length > 0 ? (
            <div className="relative">
              <div className="relative aspect-[4/3] bg-slate-200 overflow-hidden">
                <OptimizedListingImage
                  src={photoUrls[carouselIndex] ?? photoUrls[0]!}
                  image200={
                    listing.photoUrls200?.[carouselIndex] ??
                    listing.photoUrls200?.[0] ??
                    listing.image200
                  }
                  image400={
                    listing.photoUrls400?.[carouselIndex] ??
                    listing.photoUrls400?.[0] ??
                    listing.image400
                  }
                  context="detail"
                  sizes="(max-width: 672px) 100vw, 672px"
                  fill
                  objectFit="cover"
                />
              </div>
              {photoUrls.length > 1 && (
                <>
                  <div className="flex gap-2 p-3 bg-slate-50 border-t border-slate-100 overflow-x-auto">
                    {photoUrls.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCarouselIndex(i)}
                        className={`relative w-16 h-16 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0 transition-all ${
                          i === carouselIndex
                            ? "ring-2 ring-[#04AA6D] ring-offset-1"
                            : "opacity-80 hover:opacity-100"
                        }`}
                      >
                        <ThumbnailImage
                          src={url}
                          image200={
                            listing.photoUrls200?.[i] ?? listing.image200
                          }
                          className="object-cover"
                          fill
                        />
                      </button>
                    ))}
                  </div>
                  <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 flex justify-between">
                    <button
                      onClick={() =>
                        setCarouselIndex((i) =>
                          i === 0 ? photoUrls.length - 1 : i - 1,
                        )
                      }
                      className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() =>
                        setCarouselIndex((i) =>
                          i === photoUrls.length - 1 ? 0 : i + 1,
                        )
                      }
                      className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60"
                    >
                      ›
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center">
              <span className="text-slate-400 text-4xl">
                {CATEGORY_ICONS[category] ?? "🍇"}
              </span>
            </div>
          )}
        </div>

        <div className="vn-glass vn-card vn-card-pad">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
            <h1 className="text-xl font-bold text-slate-900 flex-1">
              {displayTitle}
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-1">
                {onToggleFavorite && favoriteIds && listing && (
                  <button
                    onClick={(e) => onToggleFavorite(listing.id, e)}
                    disabled={favoriteToggling === listing.id}
                    className={`p-2 rounded-lg transition-colors ${
                      favoriteIds.has(listing.id)
                        ? "text-rose-500"
                        : "text-slate-400 hover:text-rose-500 hover:bg-rose-50/50"
                    } ${favoriteToggling === listing.id ? "opacity-60" : ""}`}
                    aria-label={
                      favoriteIds.has(listing.id)
                        ? "Remove from favorites"
                        : "Add to favorites"
                    }
                  >
                    <Heart
                      size={20}
                      strokeWidth={2}
                      fill={
                        favoriteIds.has(listing.id) ? "currentColor" : "none"
                      }
                    />
                  </button>
                )}
                {onShare && listing && (
                  <button
                    onClick={() => onShare(listing.id)}
                    className="p-2 rounded-lg transition-colors text-slate-400 hover:text-[#04AA6D] hover:bg-slate-50/50"
                    aria-label={t("market.share")}
                  >
                    <Share2 size={20} strokeWidth={2} />
                  </button>
                )}
              </div>
              <span
                className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: statusColor }}
              >
                {t(
                  `market.status${status.charAt(0).toUpperCase() + status.slice(1)}`,
                )}
              </span>
            </div>
          </div>

          {locationText && (
            <p className="flex items-center gap-2 text-slate-600 text-sm mb-4">
              📍 {locationText}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className="inline-flex w-fit items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-white"
              style={{ backgroundColor: getCategoryColor(category) }}
            >
              {CATEGORY_ICONS[category] ?? "📦"}{" "}
              {t(getCategoryLabelKey(category))}
            </span>
            <span className="text-lg font-bold text-[#04AA6D]">
              {listing.price != null && listing.price > 0
                ? `${listing.price} ₾`
                : t("market.priceByAgreement")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-100 rounded-xl mb-6">
            {listing.quantity != null && listing.unit && (
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">
                  {t("common.quantity")}
                </p>
                <p className="font-bold text-slate-900">
                  {listing.quantity} {getUnitLabel(listing.unit)}
                </p>
              </div>
            )}
            {category === "grapes" && listing.sugarBrix != null && (
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">
                  {t("market.sugarBrix")}
                </p>
                <p className="font-bold text-slate-900">
                  {listing.sugarBrix} {t("market.brixUnit")}
                </p>
              </div>
            )}
            {category === "wine" && listing.vintageYear != null && (
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">
                  {t("market.vintageYear")}
                </p>
                <p className="font-bold text-slate-900">
                  {listing.vintageYear}
                </p>
              </div>
            )}
            {listing.harvestDate && (
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">
                  {t("market.harvestDate")}
                </p>
                <p className="font-bold text-slate-900">
                  {formatHarvestDate(listing.harvestDate)}
                </p>
              </div>
            )}
          </div>

          {listing.description && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                {t("market.description")}
              </h3>
              <p className="text-slate-700 leading-relaxed">
                {listing.description}
              </p>
            </div>
          )}

          {listing.notes && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                {t("common.notes")}
              </h3>
              <p className="text-slate-700 leading-relaxed">{listing.notes}</p>
            </div>
          )}

          {listing.phone && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#04AA6D] flex items-center justify-center text-white font-bold text-lg">
                  {(listing.contactName || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {listing.contactName || t("market.contact")}
                  </p>
                  <p className="text-sm text-slate-500">
                    {t("market.contact")}
                  </p>
                </div>
              </div>
              <a
                href={`tel:${listing.phone}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-[#04AA6D] hover:bg-[#039a5e] transition-colors"
              >
                <span>📞</span>
                {listing.phone}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function withViewTransition(cb: () => void) {
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    (
      document as Document & {
        startViewTransition: (cb: () => void | Promise<void>) => void;
      }
    ).startViewTransition(() => {
      flushSync(cb);
    });
  } else {
    cb();
  }
}

export default function MarketClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailId = searchParams.get("id");
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingDetail, setListingDetail] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "card" | "detailed">(
    "grid",
  );

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setViewMode("grid");
    }
  }, []);
  const [user, setUser] = useState(auth?.currentUser ?? null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteToggling, setFavoriteToggling] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [regionFilter, setRegionFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [minBrix, setMinBrix] = useState("");
  const [maxBrix, setMaxBrix] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedImageByListing, setSelectedImageByListing] = useState<
    Record<string, number>
  >({});

  const setListingImage = (listingId: string, index: number) => {
    setSelectedImageByListing((prev) => ({ ...prev, [listingId]: index }));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(e.target as Node)
      ) {
        setSortDropdownOpen(false);
      }
    };
    if (sortDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sortDropdownOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    const timeout = setTimeout(() => {
      setLoading(false);
      setError("დატვირთვა ვერ მოხერხდა");
    }, 10000);

    getDb()
      .then((db) => {
        if (!db) {
          setLoading(false);
          return;
        }

        const listingsRef = collection(db, "marketListings");

        unsubscribe = onSnapshot(
          listingsRef,
          (snapshot) => {
            const list: Listing[] = snapshot.docs
              .map((docSnap) => {
                const data = docSnap.data();
                return {
                  id: docSnap.id,
                  variety: data.variety,
                  title: data.title,
                  description: data.description,
                  notes: data.notes,
                  price:
                    typeof data.price === "number" ? data.price : undefined,
                  quantity: data.quantity,
                  unit: data.unit,
                  region: data.region,
                  village: data.village,
                  category: data.category,
                  harvestDate: data.harvestDate,
                  sugarBrix: data.sugarBrix,
                  vintageYear: data.vintageYear,
                  wineType: data.wineType,
                  phone: data.phone,
                  contactName: data.contactName,
                  photoUrls: data.photoUrls,
                  photoUrls200: data.photoUrls200,
                  photoUrls400: data.photoUrls400,
                  imageUrl: data.imageUrl,
                  image: data.image,
                  image200: data.image200,
                  image400: data.image400,
                  photos: data.photos,
                  thumbnail: data.thumbnail,
                  hidden: data.hidden,
                  userId: data.userId,
                  createdAt: data.createdAt,
                };
              })
              .filter((l) => !l.hidden);
            list.sort((a, b) => {
              const aTime =
                a.createdAt &&
                typeof (a.createdAt as { seconds: number }).seconds === "number"
                  ? (a.createdAt as { seconds: number }).seconds * 1000
                  : 0;
              const bTime =
                b.createdAt &&
                typeof (b.createdAt as { seconds: number }).seconds === "number"
                  ? (b.createdAt as { seconds: number }).seconds * 1000
                  : 0;
              return bTime - aTime;
            });
            clearTimeout(timeout);
            setListings(list);
            setLoading(false);
            setError(null);
          },
          (err) => {
            clearTimeout(timeout);
            setLoading(false);
            setError(err?.message ?? "შეცდომა მოხდა");
          },
        );
      })
      .catch(() => {
        clearTimeout(timeout);
        setLoading(false);
        setError("შეცდომა მოხდა");
      });

    return () => {
      clearTimeout(timeout);
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    let unsub: (() => void) | undefined;
    getDb().then((db) => {
      if (!db) return;
      const favoritesRef = collection(db, "users", user.uid, "favorites");
      unsub = onSnapshot(favoritesRef, (snapshot) => {
        const ids = new Set<string>();
        snapshot.docs.forEach((d) => ids.add(d.id));
        setFavoriteIds(ids);
      });
    });
    return () => unsub?.();
  }, [user]);

  const toggleFavorite = useCallback(
    async (listingId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) {
        router.push("/login?redirect=/");
        return;
      }
      const db = await getDb();
      if (!db) return;
      setFavoriteToggling(listingId);
      try {
        const favRef = doc(db, "users", user.uid, "favorites", listingId);
        if (favoriteIds.has(listingId)) {
          await deleteDoc(favRef);
        } else {
          await setDoc(favRef, {
            listingId,
            createdAt: serverTimestamp(),
          });
        }
      } catch {
        // Silent fail or toast in future
      } finally {
        setFavoriteToggling(null);
      }
    },
    [user, favoriteIds, router],
  );

  const handleShare = useCallback((listingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/?id=${listingId}`
        : `/?id=${listingId}`;
    const title = "VineNote Georgia - Market";
    if (navigator.share) {
      navigator
        .share({
          title,
          url,
          text: title,
        })
        .catch(() => {
          navigator.clipboard?.writeText(url);
        });
    } else {
      navigator.clipboard?.writeText(url);
    }
  }, []);

  const loadDetail = useCallback(async () => {
    if (!detailId) return;
    setDetailLoading(true);
    try {
      const db = await getDb();
      if (!db) {
        setListingDetail(null);
        return;
      }
      const snap = await getDoc(doc(db, "marketListings", detailId));
      if (snap.exists()) {
        const data = snap.data();
        setListingDetail({
          id: snap.id,
          variety: data.variety,
          title: data.title,
          description: data.description,
          notes: data.notes,
          price: typeof data.price === "number" ? data.price : undefined,
          quantity: data.quantity,
          unit: data.unit,
          region: data.region,
          village: data.village,
          category: data.category,
          harvestDate: data.harvestDate,
          sugarBrix: data.sugarBrix,
          vintageYear: data.vintageYear,
          wineType: data.wineType,
          phone: data.phone,
          contactName: data.contactName,
          photoUrls: data.photoUrls,
          photoUrls200: data.photoUrls200,
          photoUrls400: data.photoUrls400,
          imageUrl: data.imageUrl,
          image: data.image,
          image200: data.image200,
          image400: data.image400,
          photos: data.photos,
          thumbnail: data.thumbnail,
          hidden: data.hidden,
          status: data.status ?? "active",
          userId: data.userId,
          createdAt: data.createdAt,
        });
      } else {
        setListingDetail(null);
      }
    } catch {
      setListingDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, [detailId]);

  useEffect(() => {
    if (detailId) loadDetail();
    else setListingDetail(null);
  }, [detailId, loadDetail]);

  const closeDetail = useCallback(() => {
    router.push("/");
  }, [router]);

  const uniqueRegions = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => {
      const r = l.region?.trim();
      if (r) set.add(r);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [listings]);

  const uniqueVillages = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => {
      const v = l.village?.trim();
      if (v) set.add(v);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [listings]);

  const filteredListings = useMemo(() => {
    let result = listings;

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (l) =>
          l.variety?.toLowerCase().includes(q) ||
          l.title?.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q) ||
          l.region?.toLowerCase().includes(q) ||
          l.village?.toLowerCase().includes(q) ||
          l.notes?.toLowerCase().includes(q),
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter(
        (l) => (l.category ?? "grapes") === categoryFilter,
      );
    }

    if (regionFilter) {
      result = result.filter(
        (l) => l.region?.trim().toLowerCase() === regionFilter.toLowerCase(),
      );
    }

    if (villageFilter) {
      result = result.filter(
        (l) => l.village?.trim().toLowerCase() === villageFilter.toLowerCase(),
      );
    }

    if (maxPrice.trim()) {
      const max = Number(maxPrice.replace(",", ".").trim());
      if (!Number.isNaN(max) && max >= 0) {
        result = result.filter((l) => {
          const p = l.price ?? 0;
          return p > 0 && p <= max;
        });
      }
    }

    if (minPrice.trim()) {
      const min = Number(minPrice.replace(",", ".").trim());
      if (!Number.isNaN(min) && min >= 0) {
        result = result.filter((l) => {
          const p = l.price ?? 0;
          return p >= min;
        });
      }
    }

    if (maxBrix.trim()) {
      const max = Number(maxBrix.replace(",", ".").trim());
      if (!Number.isNaN(max) && max >= 0) {
        result = result.filter((l) => {
          const b = l.sugarBrix ?? 0;
          return b > 0 && b <= max;
        });
      }
    }

    if (minBrix.trim()) {
      const min = Number(minBrix.replace(",", ".").trim());
      if (!Number.isNaN(min) && min >= 0) {
        result = result.filter((l) => {
          const b = l.sugarBrix ?? 0;
          return b >= min;
        });
      }
    }

    if (favoritesOnly && user) {
      result = result.filter((l) => favoriteIds.has(l.id));
    }

    const sorted = [...result];
    switch (sortBy) {
      case "price_asc":
        sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "price_desc":
        sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "brix_asc":
        sorted.sort((a, b) => (a.sugarBrix ?? 0) - (b.sugarBrix ?? 0));
        break;
      case "brix_desc":
        sorted.sort((a, b) => (b.sugarBrix ?? 0) - (a.sugarBrix ?? 0));
        break;
      case "vintage_asc":
        sorted.sort((a, b) => (a.vintageYear ?? 0) - (b.vintageYear ?? 0));
        break;
      case "vintage_desc":
        sorted.sort((a, b) => (b.vintageYear ?? 0) - (a.vintageYear ?? 0));
        break;
      default:
        sorted.sort((a, b) => {
          const aTime =
            a.createdAt &&
            typeof (a.createdAt as { seconds: number }).seconds === "number"
              ? (a.createdAt as { seconds: number }).seconds * 1000
              : 0;
          const bTime =
            b.createdAt &&
            typeof (b.createdAt as { seconds: number }).seconds === "number"
              ? (b.createdAt as { seconds: number }).seconds * 1000
              : 0;
          return bTime - aTime;
        });
    }
    return sorted;
  }, [
    listings,
    searchQuery,
    categoryFilter,
    regionFilter,
    villageFilter,
    maxPrice,
    minPrice,
    minBrix,
    maxBrix,
    favoritesOnly,
    user,
    favoriteIds,
    sortBy,
  ]);

  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (categoryFilter !== "all")
      parts.push(
        t(
          `market.category${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)}`,
        ),
      );
    if (regionFilter) parts.push(regionFilter);
    if (villageFilter) parts.push(villageFilter);
    if (minPrice.trim()) parts.push(`≥ ${minPrice.trim()} ₾`);
    if (maxPrice.trim()) parts.push(`≤ ${maxPrice.trim()} ₾`);
    if (minBrix.trim())
      parts.push(`≥ ${minBrix.trim()} ${t("market.brixUnit")}`);
    if (maxBrix.trim())
      parts.push(`≤ ${maxBrix.trim()} ${t("market.brixUnit")}`);
    if (favoritesOnly) parts.push(t("market.favorites"));
    if (sortBy !== "newest") parts.push(t(`market.sortBy.${sortBy}`));
    return parts.length > 0 ? parts.join(" • ") : t("common.all");
  }, [
    categoryFilter,
    regionFilter,
    villageFilter,
    minPrice,
    maxPrice,
    minBrix,
    maxBrix,
    favoritesOnly,
    sortBy,
    t,
  ]);

  const hasActiveFilters = Boolean(
    regionFilter ||
    villageFilter ||
    minPrice.trim() ||
    maxPrice.trim() ||
    minBrix.trim() ||
    maxBrix.trim() ||
    favoritesOnly,
  );

  const resetFilters = () => {
    setRegionFilter("");
    setVillageFilter("");
    setMinPrice("");
    setMaxPrice("");
    setMinBrix("");
    setMaxBrix("");
    setFavoritesOnly(false);
    setSortBy("newest");
  };

  if (detailId) {
    return (
      <ListingDetailView
        listing={listingDetail}
        loading={detailLoading}
        onBack={closeDetail}
        t={t}
        getUnitLabel={(unit) => {
          const key = `market.units.${unit}`;
          const label = t(key);
          return label === key ? unit : label;
        }}
        onShare={(id: string) =>
          handleShare(id, { stopPropagation: () => {} } as React.MouseEvent)
        }
        onToggleFavorite={toggleFavorite}
        favoriteIds={favoriteIds}
        favoriteToggling={favoriteToggling}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 market-grid-transition">
            {Array.from({ length: 12 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-8 px-4 sm:px-6">
      <div data-market-main className="max-w-7xl mx-auto">
        {/* Header: unified modern UX - solid bg to avoid backdrop-filter changing when grid/list below changes */}
        <header
          data-market-header
          className="relative z-20 mb-6 sm:mb-8 bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.06)] overflow-visible"
        >
          <div className="p-3 sm:p-4 space-y-4 sm:space-y-5">
            {/* Mobile: Search, then Categories, then Controls */}
            <div className="flex flex-col gap-3 md:hidden">
              {/* Search */}
              <div className="relative min-w-0 group">
                <Search
                  size={20}
                  className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors duration-200 group-focus-within:text-[#04AA6D]"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("market.searchPlaceholder")}
                  aria-label={t("market.searchPlaceholder")}
                  className="search-no-native-clear w-full pl-11 sm:pl-12 pr-11 sm:pr-12 py-2 sm:py-3.5 rounded-xl sm:rounded-2xl border-2 border-slate-200/80 text-slate-900 placeholder-slate-400 text-base font-normal shadow-[0_1px_3px_rgba(15,23,42,0.06)] hover:border-slate-300 hover:shadow-md focus:ring-2 focus:ring-[#04AA6D]/25 focus:border-[#04AA6D] outline-none transition-all duration-200 bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label={t("market.clearSearch")}
                    className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all focus-visible:ring-2 focus-visible:ring-[#04AA6D]/50"
                  >
                    <X size={18} strokeWidth={2.5} />
                  </button>
                )}
              </div>
              {/* Categories - under search on mobile, full-width scroll */}
              <nav
                className="flex gap-2 overflow-x-auto pb-1 -mx-3 scrollbar-hide touch-pan-x px-3"
                aria-label="Filter by category"
              >
                {(
                  [
                    "all",
                    "grapes",
                    "wine",
                    "nobati",
                    "inventory",
                    "seedlings",
                  ] as const
                ).map((c) => (
                  <button
                    key={c}
                    onClick={() =>
                      withViewTransition(() => setCategoryFilter(c))
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border-2 shrink-0 transition-all duration-200 ${
                      categoryFilter === c
                        ? "bg-[#04AA6D] border-[#04AA6D] text-white"
                        : "bg-white border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {c !== "all" && (
                      <span className="text-base shrink-0">
                        {CATEGORY_ICONS[c] ?? "📦"}
                      </span>
                    )}
                    <span className="whitespace-nowrap">
                      {c === "all"
                        ? t("common.all")
                        : t(
                            `market.category${c.charAt(0).toUpperCase() + c.slice(1)}`,
                          )}
                    </span>
                  </button>
                ))}
              </nav>
              {/* Controls - mobile: two containers with justify-between */}
              <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                {/* Container 1: Sort, Filter, Favorites */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Sort dropdown */}
                  <div
                    className="relative flex-1 sm:flex-initial min-w-0"
                    ref={(el) => {
                      if (el?.offsetParent)
                        (
                          sortDropdownRef as React.MutableRefObject<HTMLDivElement | null>
                        ).current = el;
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setSortDropdownOpen((v) => !v)}
                      aria-expanded={sortDropdownOpen}
                      aria-haspopup="listbox"
                      aria-label={t("market.sortByLabel")}
                      className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border-2 border-slate-200/80 bg-white text-slate-700 text-sm font-semibold shadow-[0_2px_6px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(15,23,42,0.1),0_2px_4px_rgba(15,23,42,0.06)] focus:ring-2 focus:ring-[#04AA6D]/25 focus:border-[#04AA6D] outline-none transition-all cursor-pointer h-11 sm:h-[52px]"
                    >
                      <ArrowUpDown
                        size={18}
                        className="shrink-0 md:hidden"
                        strokeWidth={2}
                      />
                      <span className="truncate hidden md:inline">
                        {t(`market.sortBy.${sortBy}`)}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`shrink-0 transition-transform duration-200 ${sortDropdownOpen ? "rotate-180" : ""} hidden md:block`}
                      />
                    </button>
                    {sortDropdownOpen && (
                      <div
                        role="listbox"
                        className="absolute left-0 right-0 sm:right-0 sm:left-auto top-full mt-1.5 min-w-[150px] sm:min-w-[200px] w-full sm:w-auto py-1.5 rounded-xl border-2 border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 z-[100] animate-fade-in overflow-hidden"
                      >
                        {(
                          [
                            "newest",
                            "price_asc",
                            "price_desc",
                            "brix_asc",
                            "brix_desc",
                            "vintage_asc",
                            "vintage_desc",
                          ] as SortBy[]
                        ).map((value) => (
                          <button
                            key={value}
                            role="option"
                            aria-selected={sortBy === value}
                            onClick={() => {
                              withViewTransition(() => {
                                setSortBy(value);
                                setSortDropdownOpen(false);
                              });
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors first:pt-3 last:pb-3 ${
                              sortBy === value
                                ? "bg-[#04AA6D]/10 text-[#04AA6D]"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {t(`market.sortBy.${value}`)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Filters */}
                  <button
                    onClick={() => setFiltersOpen((v) => !v)}
                    aria-expanded={filtersOpen}
                    aria-controls="market-filters"
                    className={`relative flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 flex-1 sm:flex-initial min-w-0 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-sm font-semibold border-2 transition-all h-11 sm:h-[52px] ${
                      filtersOpen
                        ? "bg-[#04AA6D] border-[#04AA6D] text-white shadow-[0_2px_8px_rgba(4,170,109,0.3),0_4px_12px_rgba(0,0,0,0.08)]"
                        : "bg-white border-slate-200/80 text-slate-600 shadow-[0_2px_6px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_4px_12px_rgba(15,23,42,0.1),0_2px_4px_rgba(15,23,42,0.06)]"
                    }`}
                  >
                    <SlidersHorizontal
                      size={18}
                      strokeWidth={2}
                      className="shrink-0"
                    />
                    <span className="max-w-[80px] sm:max-w-[140px] truncate hidden sm:inline">
                      {filterSummary}
                    </span>
                    {hasActiveFilters && !filtersOpen && (
                      <span
                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#04AA6D] ring-2 ring-white"
                        aria-hidden
                      />
                    )}
                    {filtersOpen ? (
                      <ChevronUp size={18} className="shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="shrink-0" />
                    )}
                  </button>
                  {user && (
                    <button
                      type="button"
                      onClick={() =>
                        withViewTransition(() => setFavoritesOnly((v) => !v))
                      }
                      aria-pressed={favoritesOnly}
                      aria-label={t("market.favorites")}
                      className={`flex items-center justify-center gap-1.5 sm:gap-2 shrink-0 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-sm font-semibold border-2 transition-all h-11 sm:h-[52px] ${
                        favoritesOnly
                          ? "bg-[#04AA6D] border-[#04AA6D] text-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
                          : "bg-white border-slate-200/80 text-slate-600 shadow-[0_1px_3px_rgba(15,23,42,0.06)] hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
                      }`}
                    >
                      <Heart
                        size={18}
                        strokeWidth={2}
                        fill={favoritesOnly ? "currentColor" : "none"}
                        className="shrink-0"
                      />
                      <span className="hidden sm:inline">
                        {t("market.favorites")}
                      </span>
                    </button>
                  )}
                </div>
                {/* Container 2: Counter, Grid switcher - mobile only */}
                <div className="md:hidden flex items-center gap-2 shrink-0">
                  <div
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-100/80 border border-slate-200/60 h-11 sm:h-[52px] shrink-0"
                    aria-label={t("market.listingsFound").replace(
                      "{{count}}",
                      String(filteredListings.length),
                    )}
                  >
                    <Package
                      size={15}
                      className="text-slate-500 shrink-0"
                      strokeWidth={2}
                    />
                    <span className="text-slate-600 font-semibold tabular-nums text-sm">
                      {filteredListings.length}
                    </span>
                  </div>
                  <div className="flex bg-slate-100/90 rounded-xl p-1 gap-0.5 shadow-inner shrink-0">
                    {[
                      { mode: "grid" as const, icon: LayoutGrid },
                      { mode: "card" as const, icon: LayoutList },
                      { mode: "detailed" as const, icon: List },
                    ].map(({ mode, icon: Icon }) => (
                      <button
                        key={mode}
                        onClick={() =>
                          withViewTransition(() => setViewMode(mode))
                        }
                        className={`p-2 sm:p-2.5 rounded-lg transition-all duration-300 ${
                          viewMode === mode
                            ? "bg-white text-[#04AA6D] shadow-md"
                            : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
                        } ${mode === "card" ? "hidden" : ""}`}
                        aria-label={`${mode} view`}
                      >
                        <Icon size={18} strokeWidth={2} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop: Row 1 Search + Controls, Row 2 Categories + Counter + Grid */}
            <div className="hidden md:block space-y-4">
              <div className="flex flex-row gap-3">
                <div className="relative min-w-0 flex-1 group">
                  <Search
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors duration-200 group-focus-within:text-[#04AA6D]"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("market.searchPlaceholder")}
                    aria-label={t("market.searchPlaceholder")}
                    className="search-no-native-clear w-full pl-12 pr-12 py-3.5 rounded-2xl border-2 border-slate-200/80 text-slate-900 placeholder-slate-400 text-base font-normal shadow-[0_1px_3px_rgba(15,23,42,0.06)] hover:border-slate-300 hover:shadow-md focus:ring-2 focus:ring-[#04AA6D]/25 focus:border-[#04AA6D] outline-none transition-all duration-200 bg-white"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label={t("market.clearSearch")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all focus-visible:ring-2 focus-visible:ring-[#04AA6D]/50"
                    >
                      <X size={18} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative" ref={sortDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setSortDropdownOpen((v) => !v)}
                      aria-expanded={sortDropdownOpen}
                      aria-haspopup="listbox"
                      aria-label={t("market.sortByLabel")}
                      className="flex items-center gap-2 px-4 py-3.5 rounded-2xl border-2 border-slate-200/80 bg-white text-slate-700 text-sm font-semibold shadow-[0_2px_6px_rgba(15,23,42,0.06)] hover:border-slate-300 focus:ring-2 focus:ring-[#04AA6D]/25 focus:border-[#04AA6D] outline-none transition-all cursor-pointer h-[52px]"
                    >
                      <span className="truncate">
                        {t(`market.sortBy.${sortBy}`)}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`shrink-0 transition-transform duration-200 ${sortDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {sortDropdownOpen && (
                      <div
                        role="listbox"
                        className="absolute right-0 top-full mt-1.5 min-w-[200px] py-1.5 rounded-xl border-2 border-slate-200/80 bg-white shadow-xl z-[100] animate-fade-in overflow-hidden"
                      >
                        {(
                          [
                            "newest",
                            "price_asc",
                            "price_desc",
                            "brix_asc",
                            "brix_desc",
                            "vintage_asc",
                            "vintage_desc",
                          ] as SortBy[]
                        ).map((value) => (
                          <button
                            key={value}
                            role="option"
                            aria-selected={sortBy === value}
                            onClick={() => {
                              withViewTransition(() => {
                                setSortBy(value);
                                setSortDropdownOpen(false);
                              });
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors first:pt-3 last:pb-3 ${sortBy === value ? "bg-[#04AA6D]/10 text-[#04AA6D]" : "text-slate-700 hover:bg-slate-50"}`}
                          >
                            {t(`market.sortBy.${value}`)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setFiltersOpen((v) => !v)}
                    aria-expanded={filtersOpen}
                    aria-controls="market-filters"
                    className={`relative flex items-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-semibold border-2 transition-all h-[52px] ${
                      filtersOpen
                        ? "bg-[#04AA6D] border-[#04AA6D] text-white"
                        : "bg-white border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <SlidersHorizontal
                      size={18}
                      strokeWidth={2}
                      className="shrink-0"
                    />
                    <span className="max-w-[140px] truncate">
                      {filterSummary}
                    </span>
                    {hasActiveFilters && !filtersOpen && (
                      <span
                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#04AA6D] ring-2 ring-white"
                        aria-hidden
                      />
                    )}
                    {filtersOpen ? (
                      <ChevronUp size={18} className="shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="shrink-0" />
                    )}
                  </button>
                  {user && (
                    <button
                      type="button"
                      onClick={() =>
                        withViewTransition(() => setFavoritesOnly((v) => !v))
                      }
                      aria-pressed={favoritesOnly}
                      aria-label={t("market.favorites")}
                      className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-semibold border-2 transition-all h-[52px] ${
                        favoritesOnly
                          ? "bg-[#04AA6D] border-[#04AA6D] text-white"
                          : "bg-white border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <Heart
                        size={18}
                        strokeWidth={2}
                        fill={favoritesOnly ? "currentColor" : "none"}
                        className="shrink-0"
                      />
                      {t("market.favorites")}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-row flex-wrap items-center justify-between gap-3 pt-1">
                <nav
                  className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide min-w-0"
                  aria-label="Filter by category"
                >
                  {(
                    [
                      "all",
                      "grapes",
                      "wine",
                      "nobati",
                      "inventory",
                      "seedlings",
                    ] as const
                  ).map((c) => (
                    <button
                      key={c}
                      onClick={() =>
                        withViewTransition(() => setCategoryFilter(c))
                      }
                      className={`inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold border-2 shrink-0 transition-all duration-200 ${
                        categoryFilter === c
                          ? "bg-[#04AA6D] border-[#04AA6D] text-white"
                          : "bg-white border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {c !== "all" && (
                        <span className="text-base shrink-0">
                          {CATEGORY_ICONS[c] ?? "📦"}
                        </span>
                      )}
                      <span className="whitespace-nowrap">
                        {c === "all"
                          ? t("common.all")
                          : t(
                              `market.category${c.charAt(0).toUpperCase() + c.slice(1)}`,
                            )}
                      </span>
                    </button>
                  ))}
                </nav>
                <div className="hidden md:flex items-center justify-between gap-3 shrink-0">
                  <span className="px-3 py-2 rounded-xl bg-slate-100/90 text-slate-700 font-bold tabular-nums text-sm shadow-[0_1px_4px_rgba(15,23,42,0.05)]">
                    {t("market.listingsFound").replace(
                      "{{count}}",
                      String(filteredListings.length),
                    )}
                  </span>
                  {/* View mode - desktop only */}
                  <div className="flex bg-slate-100/90 rounded-xl p-1 gap-0.5 shadow-inner">
                    {[
                      { mode: "grid" as const, icon: LayoutGrid },
                      { mode: "card" as const, icon: LayoutList },
                      { mode: "detailed" as const, icon: List },
                    ].map(({ mode, icon: Icon }) => (
                      <button
                        key={mode}
                        onClick={() =>
                          withViewTransition(() => setViewMode(mode))
                        }
                        className={`p-2.5 rounded-lg transition-all duration-300 ${
                          viewMode === mode
                            ? "bg-white text-[#04AA6D] shadow-md"
                            : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
                        } ${mode === "card" ? "hidden md:flex" : ""}`}
                        aria-label={`${mode} view`}
                      >
                        <Icon size={18} strokeWidth={2} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Expanded filters */}
            {filtersOpen && (
              <div
                id="market-filters"
                className="pt-4 mt-1 border-t border-slate-200/60 space-y-4 animate-fade-in"
                role="region"
                aria-label="Filters"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-5 justify-between">
                  <div className="flex-1 min-w-0 space-y-4 sm:space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                        {t("market.region")}
                      </label>
                      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide touch-pan-x">
                        <button
                          onClick={() =>
                            withViewTransition(() => setRegionFilter(""))
                          }
                          className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-[0.98] ${!regionFilter ? "bg-[#04AA6D] text-white shadow-md" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                        >
                          {t("market.allRegions")}
                        </button>
                        {uniqueRegions.map((r) => (
                          <button
                            key={r}
                            onClick={() =>
                              withViewTransition(() => setRegionFilter(r))
                            }
                            className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-[0.98] whitespace-nowrap ${regionFilter === r ? "bg-[#04AA6D] text-white shadow-md" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    {uniqueVillages.length > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                          {t("market.village")}
                        </label>
                        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide touch-pan-x">
                          <button
                            onClick={() => setVillageFilter("")}
                            className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-[0.98] ${!villageFilter ? "bg-[#04AA6D] text-white shadow-md" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                          >
                            {t("market.allVillages")}
                          </button>
                          {uniqueVillages.map((v) => (
                            <button
                              key={v}
                              onClick={() =>
                                withViewTransition(() => setVillageFilter(v))
                              }
                              className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-[0.98] whitespace-nowrap ${villageFilter === v ? "bg-[#04AA6D] text-white shadow-md" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                        {t("market.minPrice")}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={minPrice}
                        onChange={(e) =>
                          setMinPrice(e.target.value.replace(/[^0-9.,]/g, ""))
                        }
                        placeholder={t("market.maxPricePlaceholder")}
                        className="w-full px-3 py-3 sm:py-2.5 rounded-xl border-2 border-slate-200 text-base sm:text-sm font-medium focus:ring-2 focus:ring-[#04AA6D]/40 focus:border-[#04AA6D] outline-none transition-all min-h-[44px] sm:min-h-0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                        {t("market.maxPrice")}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={maxPrice}
                        onChange={(e) =>
                          setMaxPrice(e.target.value.replace(/[^0-9.,]/g, ""))
                        }
                        placeholder={t("market.maxPricePlaceholder")}
                        className="w-full px-3 py-3 sm:py-2.5 rounded-xl border-2 border-slate-200 text-base sm:text-sm font-medium focus:ring-2 focus:ring-[#04AA6D]/40 focus:border-[#04AA6D] outline-none transition-all min-h-[44px] sm:min-h-0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                        {t("market.minBrix")}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={minBrix}
                        onChange={(e) =>
                          setMinBrix(e.target.value.replace(/[^0-9.,]/g, ""))
                        }
                        placeholder={t("market.brixPlaceholder")}
                        className="w-full px-3 py-3 sm:py-2.5 rounded-xl border-2 border-slate-200 text-base sm:text-sm font-medium focus:ring-2 focus:ring-[#04AA6D]/40 focus:border-[#04AA6D] outline-none transition-all min-h-[44px] sm:min-h-0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                        {t("market.maxBrix")}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={maxBrix}
                        onChange={(e) =>
                          setMaxBrix(e.target.value.replace(/[^0-9.,]/g, ""))
                        }
                        placeholder={t("market.brixPlaceholder")}
                        className="w-full px-3 py-3 sm:py-2.5 rounded-xl border-2 border-slate-200 text-base sm:text-sm font-medium focus:ring-2 focus:ring-[#04AA6D]/40 focus:border-[#04AA6D] outline-none transition-all min-h-[44px] sm:min-h-0"
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => withViewTransition(resetFilters)}
                  className="inline-flex items-center gap-2 mt-2 sm:mt-4 text-sm bg-red-100/90 rounded-xl px-4 py-2.5 sm:py-2 font-semibold text-slate-600 hover:bg-red-200/80 active:scale-[0.98] transition-colors min-h-[44px] sm:min-h-0"
                >
                  <X size={16} />
                  {t("common.reset")}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mx-5 sm:mx-6 mb-5 sm:mb-6 p-4 rounded-xl bg-red-50/90 border-2 border-red-200 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}
        </header>

        {filteredListings.length === 0 ? (
          <div
            className="vn-glass vn-card vn-card-pad text-center py-24 px-6"
            role="status"
          >
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6 text-4xl">
              🍇
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {t("market.empty")}
            </h2>
            <p className="text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
              {t("market.subtitle")}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  withViewTransition(() => {
                    setCategoryFilter("all");
                    setSearchQuery("");
                    setFiltersOpen(false);
                  });
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                {t("common.reset")}
              </button>
              <Link
                href="/"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#04AA6D] text-white hover:bg-[#039a5e] transition-colors"
              >
                {t("nav.home")}
              </Link>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid view: 2 on mobile, 3 on tablet, 4 on desktop */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 market-grid-transition">
            {filteredListings.map((listing, index) => {
              const photoUrls = getPhotoUrls(listing);
              const selectedIdx = selectedImageByListing[listing.id] ?? 0;
              const imgUrl =
                photoUrls[selectedIdx] ??
                photoUrls[0] ??
                getListingImageUrl(listing);
              const displayTitle =
                listing.variety ?? listing.title ?? t("market.unknownListing");
              const category = listing.category ?? "grapes";
              const locationText = [listing.region, listing.village]
                .filter(Boolean)
                .join(", ");
              const unitLabel = listing.unit
                ? (() => {
                    const key = `market.units.${listing.unit}`;
                    const label = t(key);
                    return label === key ? listing.unit : label;
                  })()
                : null;

              return (
                <article
                  key={listing.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/?id=${listing.id}`)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && router.push(`/?id=${listing.id}`)
                  }
                  className="vn-glass vn-card overflow-hidden cursor-pointer vn-card-hover group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#04AA6D] rounded-2xl market-item-transition"
                  style={
                    {
                      viewTransitionName: `listing-${listing.id}`,
                    } as React.CSSProperties
                  }
                >
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    {imgUrl ? (
                      <OptimizedListingImage
                        src={imgUrl}
                        image200={
                          listing.image200 ??
                          listing.photoUrls200?.[selectedIdx] ??
                          listing.photoUrls200?.[0]
                        }
                        image400={
                          listing.image400 ??
                          listing.photoUrls400?.[selectedIdx] ??
                          listing.photoUrls400?.[0]
                        }
                        context="card"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        priority={index === 0}
                        fill
                        className=""
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-slate-300 text-4xl">
                        {CATEGORY_ICONS[category] ?? "🍇"}
                      </span>
                    )}
                    {photoUrls.length > 1 && (
                      <div
                        className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 px-2 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {photoUrls.slice(0, 5).map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setListingImage(listing.id, i);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className={`relative w-8 h-8 rounded overflow-hidden bg-white/95 shadow-sm flex-shrink-0 transition-all touch-manipulation ${
                              selectedIdx === i
                                ? "ring-2 ring-[#04AA6D] ring-offset-1"
                                : "opacity-80 hover:opacity-100"
                            }`}
                          >
                            <ThumbnailImage
                              src={url}
                              image200={
                                listing.photoUrls200?.[i] ?? listing.image200
                              }
                              fill
                              className="object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5 flex flex-col gap-2">
                      <button
                        onClick={(e) => toggleFavorite(listing.id, e)}
                        disabled={favoriteToggling === listing.id}
                        className={`w-9 h-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-sm transition-colors ${
                          favoriteIds.has(listing.id)
                            ? "text-rose-500"
                            : "text-slate-600 hover:text-rose-500"
                        } ${favoriteToggling === listing.id ? "opacity-60" : ""}`}
                        aria-label="Favorite"
                      >
                        <Heart
                          size={17}
                          strokeWidth={2}
                          fill={
                            favoriteIds.has(listing.id)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                      <button
                        onClick={(e) => handleShare(listing.id, e)}
                        className="w-9 h-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-sm transition-colors text-slate-600 hover:text-[#04AA6D]"
                        aria-label={t("market.share")}
                      >
                        <Share2 size={17} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 flex flex-col">
                    <div className="mb-1.5">
                      <span className="text-base sm:text-lg font-bold text-[#04AA6D] tabular-nums">
                        {listing.price != null && listing.price > 0
                          ? `${listing.price.toLocaleString()} ₾`
                          : t("market.priceByAgreement")}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 mb-1.5 leading-snug">
                      {displayTitle}
                    </h3>
                    {locationText && (
                      <p className="flex items-center gap-1 text-slate-500 text-xs mb-2">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{locationText}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {listing.quantity != null && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-slate-100 text-slate-700">
                          <Package size={12} className="shrink-0" />
                          {listing.quantity} {unitLabel}
                        </span>
                      )}
                      {listing.sugarBrix != null && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-emerald-50 text-emerald-800">
                          {listing.sugarBrix} {t("market.brixUnit")}
                        </span>
                      )}
                      {listing.vintageYear != null && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-sky-50 text-sky-800">
                          {listing.vintageYear}
                        </span>
                      )}
                      {category === "wine" && listing.wineType && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-amber-50 text-amber-800">
                          {listing.wineType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100/80">
                      <span
                        className="inline-flex w-fit items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-white"
                        style={{ backgroundColor: getCategoryColor(category) }}
                      >
                        {CATEGORY_ICONS[category] ?? "📦"}{" "}
                        {t(getCategoryLabelKey(category))}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400 text-xs">
                        {formatTimeAgo(listing.createdAt)}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : viewMode === "card" ? (
          /* Card view: 2-column grid, image left, details right */
          <div
            key="card"
            className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in market-grid-transition"
          >
            {filteredListings.map((listing) => {
              const photoUrls = getPhotoUrls(listing);
              const selectedIdx = selectedImageByListing[listing.id] ?? 0;
              const imgUrl =
                photoUrls[selectedIdx] ??
                photoUrls[0] ??
                getListingImageUrl(listing);
              const displayTitle =
                listing.variety ?? listing.title ?? t("market.unknownListing");
              const category = listing.category ?? "grapes";
              const locationText = [listing.region, listing.village]
                .filter(Boolean)
                .join(", ");
              const unitLabel = listing.unit
                ? (() => {
                    const key = `market.units.${listing.unit}`;
                    const label = t(key);
                    return label === key ? listing.unit : label;
                  })()
                : null;

              return (
                <div
                  key={listing.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/?id=${listing.id}`)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && router.push(`/?id=${listing.id}`)
                  }
                  className="vn-glass vn-card overflow-hidden cursor-pointer vn-card-hover flex flex-col sm:flex-row group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#04AA6D] rounded-2xl market-item-transition"
                  style={
                    {
                      viewTransitionName: `listing-${listing.id}`,
                    } as React.CSSProperties
                  }
                >
                  <div className="relative w-full sm:w-2/5 sm:min-w-[160px] aspect-[4/3] bg-slate-100 overflow-hidden flex-shrink-0">
                    {imgUrl ? (
                      <OptimizedListingImage
                        src={imgUrl}
                        image200={
                          listing.image200 ??
                          listing.photoUrls200?.[selectedIdx] ??
                          listing.photoUrls200?.[0]
                        }
                        image400={
                          listing.image400 ??
                          listing.photoUrls400?.[selectedIdx] ??
                          listing.photoUrls400?.[0]
                        }
                        context="card"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        fill
                        className=""
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-slate-300 text-3xl">
                        {CATEGORY_ICONS[category] ?? "🍇"}
                      </span>
                    )}
                    {photoUrls.length > 1 && (
                      <div
                        className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 px-2 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {photoUrls.slice(0, 5).map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setListingImage(listing.id, i);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded overflow-hidden bg-white/95 shadow-sm flex-shrink-0 transition-all touch-manipulation ${
                              selectedIdx === i
                                ? "ring-2 ring-[#04AA6D] ring-offset-1"
                                : "opacity-80 hover:opacity-100"
                            }`}
                          >
                            <ThumbnailImage
                              src={url}
                              image200={
                                listing.photoUrls200?.[i] ?? listing.image200
                              }
                              fill
                              className="object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-5 flex flex-col min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 line-clamp-2">
                        {displayTitle}
                      </h3>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={(e) => toggleFavorite(listing.id, e)}
                          disabled={favoriteToggling === listing.id}
                          className={`p-1.5 rounded-lg transition-colors ${
                            favoriteIds.has(listing.id)
                              ? "text-rose-500"
                              : "text-slate-400 hover:text-rose-500"
                          } ${favoriteToggling === listing.id ? "opacity-60" : ""}`}
                          aria-label="Favorite"
                        >
                          <Heart
                            size={18}
                            strokeWidth={2}
                            fill={
                              favoriteIds.has(listing.id)
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>
                        <button
                          onClick={(e) => handleShare(listing.id, e)}
                          className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-[#04AA6D]"
                          aria-label={t("market.share")}
                        >
                          <Share2 size={18} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl font-bold text-[#04AA6D] tracking-tight">
                        {listing.price != null && listing.price > 0
                          ? `${listing.price.toLocaleString()} ₾`
                          : t("market.priceByAgreement")}
                      </span>
                      {listing.quantity != null && unitLabel && (
                        <span className="inline-flex items-center gap-1 text-slate-500 text-sm font-medium">
                          <Package size={14} className="shrink-0" />
                          / {unitLabel}
                        </span>
                      )}
                    </div>
                    {locationText && (
                      <p className="flex items-center gap-1.5 text-slate-600 text-sm mb-2 font-medium">
                        <MapPin size={14} />
                        {locationText}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-slate-500 text-sm mt-auto">
                      {listing.quantity != null && unitLabel && (
                        <span className="inline-flex items-center gap-1">
                          <Package size={14} />
                          {listing.quantity} {unitLabel}
                        </span>
                      )}
                      {listing.sugarBrix != null && (
                        <span>
                          {listing.sugarBrix} {t("market.brixUnit")}
                        </span>
                      )}
                      {listing.vintageYear != null && (
                        <span>{listing.vintageYear}</span>
                      )}
                      {category === "wine" && listing.wineType && (
                        <span>{listing.wineType}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100/80">
                      <span
                        className="inline-flex w-fit items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-white"
                        style={{ backgroundColor: getCategoryColor(category) }}
                      >
                        {CATEGORY_ICONS[category] ?? "📦"}{" "}
                        {t(getCategoryLabelKey(category))}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {formatTimeAgo(listing.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List view: mobile = card-style 1 per row with description, desktop = detailed ss.ge-style */
          <>
            {/* Mobile: grid-style card, 1 per row, with description */}
            <div
              key="list-mobile"
              className="block sm:hidden space-y-4 animate-fade-in"
            >
              {filteredListings.map((listing) => {
                const photoUrls = getPhotoUrls(listing);
                const selectedIdx = selectedImageByListing[listing.id] ?? 0;
                const imgUrl =
                  photoUrls[selectedIdx] ??
                  photoUrls[0] ??
                  getListingImageUrl(listing);
                const displayTitle =
                  listing.variety ??
                  listing.title ??
                  t("market.unknownListing");
                const category = listing.category ?? "grapes";
                const locationText = [listing.region, listing.village]
                  .filter(Boolean)
                  .join(", ");
                const unitLabel = listing.unit
                  ? (() => {
                      const key = `market.units.${listing.unit}`;
                      const label = t(key);
                      return label === key ? listing.unit : label;
                    })()
                  : null;

                return (
                  <div
                    key={listing.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/?id=${listing.id}`)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && router.push(`/?id=${listing.id}`)
                    }
                    className="vn-glass vn-card overflow-hidden cursor-pointer vn-card-hover flex flex-col group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#04AA6D] rounded-2xl market-item-transition"
                    style={
                      {
                        viewTransitionName: `listing-${listing.id}`,
                      } as React.CSSProperties
                    }
                  >
                    <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden flex-shrink-0">
                      {imgUrl ? (
                        <OptimizedListingImage
                          src={imgUrl}
                          image200={
                            listing.image200 ??
                            listing.photoUrls200?.[selectedIdx] ??
                            listing.photoUrls200?.[0]
                          }
                          image400={
                            listing.image400 ??
                            listing.photoUrls400?.[selectedIdx] ??
                            listing.photoUrls400?.[0]
                          }
                          context="card"
                          sizes="100vw"
                          fill
                          className=""
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-slate-300 text-4xl">
                          {CATEGORY_ICONS[category] ?? "🍇"}
                        </span>
                      )}
                      {photoUrls.length > 1 && (
                        <div
                          className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 px-2 z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {photoUrls.slice(0, 5).map((url, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setListingImage(listing.id, i);
                              }}
                              onPointerDown={(e) => e.stopPropagation()}
                              className={`relative w-8 h-8 rounded overflow-hidden bg-white/95 shadow-sm flex-shrink-0 transition-all touch-manipulation ${
                                selectedIdx === i
                                  ? "ring-2 ring-[#04AA6D] ring-offset-1"
                                  : "opacity-80 hover:opacity-100"
                              }`}
                            >
                              <ThumbnailImage
                                src={url}
                                image200={
                                  listing.photoUrls200?.[i] ?? listing.image200
                                }
                                fill
                                className="object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4 flex flex-col min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 text-base line-clamp-2">
                          {displayTitle}
                        </h3>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={(e) => toggleFavorite(listing.id, e)}
                            disabled={favoriteToggling === listing.id}
                            className={`p-2 rounded-lg transition-colors ${
                              favoriteIds.has(listing.id)
                                ? "text-rose-500"
                                : "text-slate-400 hover:text-rose-500"
                            } ${favoriteToggling === listing.id ? "opacity-60" : ""}`}
                            aria-label="Favorite"
                          >
                            <Heart
                              size={18}
                              strokeWidth={2}
                              fill={
                                favoriteIds.has(listing.id)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          </button>
                          <button
                            onClick={(e) => handleShare(listing.id, e)}
                            className="p-2 rounded-lg transition-colors text-slate-400 hover:text-[#04AA6D]"
                            aria-label={t("market.share")}
                          >
                            <Share2 size={18} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl font-bold text-[#04AA6D] tracking-tight">
                          {listing.price != null && listing.price > 0
                            ? `${listing.price.toLocaleString()} ₾`
                            : t("market.priceByAgreement")}
                        </span>
                        {listing.quantity != null && unitLabel && (
                          <span className="inline-flex items-center gap-1 text-slate-500 text-sm font-medium">
                            <Package size={14} className="shrink-0" />
                            / {unitLabel}
                          </span>
                        )}
                      </div>
                      {locationText && (
                        <p className="flex items-center gap-1.5 text-slate-600 text-sm mb-2 font-medium">
                          <MapPin size={14} />
                          {locationText}
                        </p>
                      )}
                      {(listing.description || listing.notes) && (
                        <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-3">
                          {listing.notes || listing.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-slate-500 text-sm mt-auto">
                        {listing.quantity != null && unitLabel && (
                          <span className="inline-flex items-center gap-1">
                            <Package size={14} />
                            {listing.quantity} {unitLabel}
                          </span>
                        )}
                        {listing.sugarBrix != null && (
                          <span>
                            {listing.sugarBrix} {t("market.brixUnit")}
                          </span>
                        )}
                        {listing.vintageYear != null && (
                          <span>{listing.vintageYear}</span>
                        )}
                        {category === "wine" && listing.wineType && (
                          <span>{listing.wineType}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100/80">
                        <span
                          className="inline-flex w-fit items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-white"
                          style={{
                            backgroundColor: getCategoryColor(category),
                          }}
                        >
                          {CATEGORY_ICONS[category] ?? "📦"}{" "}
                          {t(getCategoryLabelKey(category))}
                        </span>
                        <span className="text-slate-400 text-xs">
                          {formatTimeAgo(listing.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: detailed list view (ss.ge-style) */}
            <div
              key="list-desktop"
              className="hidden sm:block space-y-4 animate-fade-in"
            >
              {filteredListings.map((listing) => {
                const photoUrls = getPhotoUrls(listing);
                const selectedIdx = selectedImageByListing[listing.id] ?? 0;
                const imgUrl = photoUrls[selectedIdx] ?? photoUrls[0] ?? null;
                const displayTitle =
                  listing.variety ??
                  listing.title ??
                  t("market.unknownListing");
                const category = listing.category ?? "grapes";
                const locationText = [listing.region, listing.village]
                  .filter(Boolean)
                  .join(", ");
                const unitLabel = listing.unit
                  ? (() => {
                      const key = `market.units.${listing.unit}`;
                      const label = t(key);
                      return label === key ? listing.unit : label;
                    })()
                  : null;
                const status = listing.status ?? "active";
                const statusColor = STATUS_COLORS[status] ?? "#8a8a8a";

                return (
                  <article
                    key={listing.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/?id=${listing.id}`)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && router.push(`/?id=${listing.id}`)
                    }
                    className="market-list-card group relative cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#04AA6D] market-item-transition"
                    style={
                      {
                        viewTransitionName: `listing-${listing.id}`,
                      } as React.CSSProperties
                    }
                  >
                    <div className="flex flex-row min-h-0">
                      <div className="w-[42%] lg:w-[38%] flex-shrink-0 relative">
                        <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                          {imgUrl ? (
                            <OptimizedListingImage
                              src={imgUrl}
                              image200={
                                listing.image200 ??
                                listing.photoUrls200?.[selectedIdx] ??
                                listing.photoUrls200?.[0]
                              }
                              image400={
                                listing.image400 ??
                                listing.photoUrls400?.[selectedIdx] ??
                                listing.photoUrls400?.[0]
                              }
                              context="card"
                              sizes="(max-width: 1024px) 33vw, 20vw"
                              fill
                              className=""
                            />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-slate-300 text-4xl select-none">
                              {CATEGORY_ICONS[category] ?? "🍇"}
                            </span>
                          )}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span
                              className="inline-flex w-fit items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-white"
                              style={{
                                backgroundColor: getCategoryColor(category),
                              }}
                            >
                              {CATEGORY_ICONS[category] ?? "📦"}{" "}
                              {t(getCategoryLabelKey(category))}
                            </span>
                            {status !== "active" && (
                              <span
                                className="px-2 py-1 rounded text-xs font-semibold text-white"
                                style={{ backgroundColor: statusColor }}
                              >
                                {t(
                                  `market.status${status.charAt(0).toUpperCase() + status.slice(1)}`,
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        {photoUrls.length > 1 && (
                          <div className="flex gap-1.5 p-2 bg-slate-50 border-t border-slate-100 overflow-x-auto">
                            {photoUrls.map((url, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setListingImage(listing.id, i);
                                }}
                                className={`relative w-16 h-16 rounded overflow-hidden bg-slate-200 flex-shrink-0 transition-all ${
                                  selectedIdx === i
                                    ? "ring-2 ring-[#04AA6D] ring-offset-1"
                                    : "opacity-80 hover:opacity-100"
                                }`}
                              >
                                <ThumbnailImage
                                  src={url}
                                  image200={
                                    listing.photoUrls200?.[i] ?? listing.image200
                                  }
                                  fill
                                  className="object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col sm:contents min-w-0">
                        <div className="flex-1 flex flex-col min-w-0 p-5">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h2 className="text-[24px] font-bold text-slate-900 leading-snug line-clamp-2 flex-1">
                              {displayTitle}
                            </h2>
                            <div className="flex flex-col gap-1 shrink-0">
                              <button
                                onClick={(e) => toggleFavorite(listing.id, e)}
                                disabled={favoriteToggling === listing.id}
                                className={`p-2 rounded-lg transition-colors ${
                                  favoriteIds.has(listing.id)
                                    ? "text-rose-500"
                                    : "text-slate-400 hover:text-rose-500 hover:bg-rose-50/50"
                                } ${favoriteToggling === listing.id ? "opacity-60" : ""}`}
                                aria-label={
                                  favoriteIds.has(listing.id)
                                    ? "Remove from favorites"
                                    : "Add to favorites"
                                }
                              >
                                <Heart
                                  size={18}
                                  strokeWidth={2}
                                  fill={
                                    favoriteIds.has(listing.id)
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                              </button>
                              <button
                                onClick={(e) => handleShare(listing.id, e)}
                                className="p-2 rounded-lg transition-colors text-slate-400 hover:text-[#04AA6D] hover:bg-slate-50/50"
                                aria-label={t("market.share")}
                              >
                                <Share2 size={18} strokeWidth={2} />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-baseline gap-2 mb-2">
                            <span className="text-xl font-bold text-[#04AA6D] tabular-nums">
                              {listing.price != null && listing.price > 0
                                ? `${listing.price.toLocaleString()} ₾`
                                : t("market.priceByAgreement")}
                            </span>
                            {listing.quantity != null && unitLabel && (
                              <span className="inline-flex items-center gap-1 text-slate-500 text-sm font-medium">
                                <Package size={14} className="shrink-0" />
                                / {unitLabel}
                              </span>
                            )}
                          </div>

                          {locationText && (
                            <p className="flex items-center gap-1.5 text-slate-600 text-sm mb-3">
                              <MapPin
                                size={14}
                                className="shrink-0 text-slate-400"
                              />
                              {locationText}
                            </p>
                          )}

                          {(listing.description || listing.notes) && (
                            <p className="text-slate-600 text-base leading-relaxed line-clamp-3 mb-3 font-medium">
                              {listing.notes || listing.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-6 text-slate-600 text-sm mt-auto">
                            {listing.quantity != null && unitLabel && (
                              <span className="inline-flex items-center gap-1.5">
                                <Package
                                  size={12}
                                  className="text-slate-400 shrink-0"
                                />
                                {listing.quantity} {unitLabel}
                              </span>
                            )}
                            {listing.sugarBrix != null && (
                              <span className="inline-flex items-center gap-1.5">
                                {listing.sugarBrix} {t("market.brixUnit")}
                              </span>
                            )}
                            {listing.vintageYear != null && (
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar size={14} className="text-slate-400" />
                                {listing.vintageYear}
                              </span>
                            )}
                            {category === "wine" && listing.wineType && (
                              <span className="inline-flex items-center gap-1.5">
                                {listing.wineType}
                              </span>
                            )}
                            {listing.harvestDate && (
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar size={14} className="text-slate-400" />
                                {formatHarvestDate(listing.harvestDate)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="w-[140px] lg:w-[160px] flex-shrink-0 flex flex-col items-center justify-between p-4 py-5 px-4 border-l border-slate-100">
                          <div className="flex flex-col items-center gap-2 text-center">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
                              style={{
                                backgroundColor: getCategoryColor(category),
                              }}
                            >
                              {(listing.contactName || "?")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                              {t("market.contact")}
                            </p>
                            <p className="font-semibold text-slate-900 text-sm truncate w-full">
                              {listing.contactName || "—"}
                            </p>
                            {locationText && (
                              <p className="text-slate-500 text-xs truncate w-full">
                                {locationText}
                              </p>
                            )}

                            {listing.phone && (
                              <a
                                href={`tel:${listing.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center gap-1.5 w-full mt-2 px-3 py-2 rounded-lg font-semibold text-white bg-[#04AA6D] hover:bg-[#039a5e] text-xs transition-colors"
                              >
                                <Phone size={14} />
                                {listing.phone}
                              </a>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 mt-4 pt-4">
                            <span className="text-slate-400 text-xs">
                              {formatTimeAgo(listing.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
