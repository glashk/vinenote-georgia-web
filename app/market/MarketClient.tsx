"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
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
  MapPin,
  Calendar,
  Heart,
  Square,
  Phone,
  Package,
} from "lucide-react";

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
  phone?: string;
  contactName?: string;
  photoUrls?: string[];
  imageUrl?: string;
  image?: string;
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
}: {
  listing: Listing | null;
  loading: boolean;
  onBack: () => void;
  t: (key: string) => string;
  getUnitLabel: (unit: string) => string;
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
                <Image
                  src={photoUrls[carouselIndex] ?? photoUrls[0]!}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 672px) 100vw, 672px"
                  unoptimized
                />
              </div>
              {photoUrls.length > 1 && (
                <>
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {photoUrls.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === carouselIndex
                            ? "bg-white scale-125"
                            : "bg-white/50"
                        }`}
                      />
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
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h1 className="text-xl font-bold text-slate-900">{displayTitle}</h1>
            <span
              className="px-3 py-1 rounded-lg text-xs font-bold text-white"
              style={{ backgroundColor: statusColor }}
            >
              {t(
                `market.status${status.charAt(0).toUpperCase() + status.slice(1)}`,
              )}
            </span>
          </div>

          {locationText && (
            <p className="flex items-center gap-2 text-slate-600 text-sm mb-4">
              📍 {locationText}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-white"
              style={{ backgroundColor: getCategoryColor(category) }}
            >
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
                  {listing.sugarBrix} °Brix
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
    "card",
  );
  const [user, setUser] = useState(auth?.currentUser ?? null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteToggling, setFavoriteToggling] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [regionFilter, setRegionFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    getDb().then((db) => {
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
          setListings(list);
          setLoading(false);
          setError(null);
        },
        (err) => {
          setLoading(false);
          setError(err?.message ?? "შეცდომა მოხდა");
        },
      );
    });

    return () => unsubscribe?.();
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
        router.push("/login?redirect=/market");
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

  const loadDetail = useCallback(async () => {
    if (!detailId) return;
    const db = await getDb();
    if (!db) return;
    setDetailLoading(true);
    try {
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
          phone: data.phone,
          contactName: data.contactName,
          photoUrls: data.photoUrls,
          imageUrl: data.imageUrl,
          image: data.image,
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
    router.push("/market");
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
    if (sortBy !== "newest") parts.push(t(`market.sortBy.${sortBy}`));
    return parts.length > 0 ? parts.join(" • ") : t("common.all");
  }, [
    categoryFilter,
    regionFilter,
    villageFilter,
    minPrice,
    maxPrice,
    sortBy,
    t,
  ]);

  const resetFilters = () => {
    setRegionFilter("");
    setVillageFilter("");
    setMinPrice("");
    setMaxPrice("");
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
      />
    );
  }

  if (loading) {
    return (
      <div
        className="min-h-screen py-24 flex flex-col items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <div
          className="w-10 h-10 border-2 border-[#04AA6D] border-t-transparent rounded-full animate-spin"
          aria-hidden
        />
        <p className="mt-4 text-slate-500 text-sm font-medium">
          {t("market.subtitle")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header: compact, scannable */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {t("market.title")}
              </h1>
              <p className="text-slate-500 mt-0.5 text-sm sm:text-base">
                {t("market.subtitle")}
              </p>
            </div>
            <Link
              href="/"
              className="vn-btn vn-btn-ghost text-sm shrink-0 self-start sm:self-center focus-visible:ring-2 focus-visible:ring-[#04AA6D]/50"
            >
              ← {t("nav.home")}
            </Link>
          </div>

          {/* Search: primary action */}
          <div className="relative max-w-xl">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("market.searchPlaceholder")}
              aria-label={t("market.searchPlaceholder")}
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-base shadow-sm hover:border-slate-300 focus:ring-2 focus:ring-[#04AA6D]/25 focus:border-[#04AA6D] outline-none transition-all duration-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-[#04AA6D]/50"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </header>

        {/* Toolbar: unified controls */}
        <div className="vn-glass vn-card vn-card-pad mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex bg-slate-100/80 rounded-xl p-1 gap-0.5">
                {[
                  { mode: "grid" as const, icon: LayoutGrid },
                  { mode: "card" as const, icon: LayoutList },
                  { mode: "detailed" as const, icon: List },
                ].map(({ mode, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`p-2.5 rounded-lg transition-all duration-300 ease-out ${
                      viewMode === mode
                        ? "bg-white text-[#04AA6D] shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                    }`}
                    aria-label={`${mode} view`}
                  >
                    <Icon size={18} strokeWidth={2} />
                  </button>
                ))}
              </div>
              <span className="text-slate-600 font-medium">
                {t("market.listingsFound").replace(
                  "{{count}}",
                  String(filteredListings.length),
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-sm hidden sm:inline">
                {t("market.sortByLabel")}:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                aria-label={t("market.sortByLabel")}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:border-slate-300 focus:ring-2 focus:ring-[#04AA6D]/25 focus:border-[#04AA6D] outline-none transition-all cursor-pointer"
              >
                <option value="newest">{t("market.sortBy.newest")}</option>
                <option value="price_asc">
                  {t("market.sortBy.price_asc")}
                </option>
                <option value="price_desc">
                  {t("market.sortBy.price_desc")}
                </option>
                <option value="brix_asc">{t("market.sortBy.brix_asc")}</option>
                <option value="brix_desc">
                  {t("market.sortBy.brix_desc")}
                </option>
                <option value="vintage_asc">
                  {t("market.sortBy.vintage_asc")}
                </option>
                <option value="vintage_desc">
                  {t("market.sortBy.vintage_desc")}
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Category chips: clear affordance */}
        <nav
          className="flex flex-wrap gap-2 mb-4"
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
              onClick={() => setCategoryFilter(c)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#04AA6D] ${
                categoryFilter === c
                  ? "bg-[#04AA6D] border-[#04AA6D] text-white shadow-lg shadow-[#04AA6D]/20"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {c !== "all" && (
                <span className="text-base" aria-hidden>
                  {CATEGORY_ICONS[c] ?? "📦"}
                </span>
              )}
              {c === "all"
                ? t("common.all")
                : t(`market.category${c.charAt(0).toUpperCase() + c.slice(1)}`)}
            </button>
          ))}
        </nav>

        {/* Filters toggle */}
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          aria-controls="market-filters"
          className="flex items-center gap-2 w-full py-3 px-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all mb-6 focus-visible:ring-2 focus-visible:ring-[#04AA6D]/30 focus-visible:outline-none"
        >
          <span className="flex-1 text-left truncate font-medium">
            {filterSummary}
          </span>
          {filtersOpen ? (
            <ChevronUp size={18} className="text-slate-500 shrink-0" />
          ) : (
            <ChevronDown size={18} className="text-slate-500 shrink-0" />
          )}
        </button>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50/90 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Expanded filters */}
        {filtersOpen && (
          <div
            id="market-filters"
            className="mb-6 p-5 vn-glass vn-card vn-card-pad space-y-5 animate-fade-in"
            role="region"
            aria-label="Filters"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t("market.region")}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setRegionFilter("")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    !regionFilter
                      ? "bg-[#04AA6D] text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {t("market.allRegions")}
                </button>
                {uniqueRegions.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRegionFilter(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      regionFilter === r
                        ? "bg-[#04AA6D] text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            {uniqueVillages.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t("market.village")}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setVillageFilter("")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      !villageFilter
                        ? "bg-[#04AA6D] text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {t("market.allVillages")}
                  </button>
                  {uniqueVillages.map((v) => (
                    <button
                      key={v}
                      onClick={() => setVillageFilter(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        villageFilter === v
                          ? "bg-[#04AA6D] text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
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
                  className="w-full max-w-[100px] px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-[#04AA6D]/40 focus:border-[#04AA6D] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
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
                  className="w-full max-w-[100px] px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-[#04AA6D]/40 focus:border-[#04AA6D] outline-none"
                />
              </div>
            </div>
            <button
              onClick={resetFilters}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              {t("common.reset")}
            </button>
          </div>
        )}

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
                  setCategoryFilter("all");
                  setSearchQuery("");
                  setFiltersOpen(false);
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
          /* Grid view: 4-column compact cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredListings.map((listing, index) => {
              const imgUrl = getListingImageUrl(listing);
              const photoUrls = getPhotoUrls(listing);
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
                  onClick={() => router.push(`/market?id=${listing.id}`)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && router.push(`/market?id=${listing.id}`)
                  }
                  className="vn-glass vn-card overflow-hidden cursor-pointer vn-card-hover group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#04AA6D] rounded-2xl animate-fade-in-stagger"
                  style={{ animationDelay: `${Math.min(index * 40, 300)}ms` }}
                >
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-slate-300 text-4xl">
                        {CATEGORY_ICONS[category] ?? "🍇"}
                      </span>
                    )}
                    {photoUrls.length > 1 && (
                      <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5">
                        {photoUrls.slice(0, 3).map((_, i) => (
                          <span
                            key={i}
                            className="w-2 h-2 rounded-full bg-white/90 shadow-sm"
                          />
                        ))}
                      </div>
                    )}
                    <button
                      onClick={(e) => toggleFavorite(listing.id, e)}
                      disabled={favoriteToggling === listing.id}
                      className={`absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-sm transition-colors ${
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
                          favoriteIds.has(listing.id) ? "currentColor" : "none"
                        }
                      />
                    </button>
                  </div>
                  <div className="p-4 flex flex-col">
                    <div className="mb-2">
                      <span className="text-lg font-bold text-[#04AA6D] tabular-nums">
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
                          {listing.quantity} {unitLabel}
                        </span>
                      )}
                      {listing.sugarBrix != null && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-emerald-50 text-emerald-800">
                          {listing.sugarBrix} °Brix
                        </span>
                      )}
                      {listing.vintageYear != null && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-sky-50 text-sky-800">
                          {listing.vintageYear}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100/80">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: getCategoryColor(category) }}
                      >
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
            className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in"
          >
            {filteredListings.map((listing) => {
              const imgUrl = getListingImageUrl(listing);
              const photoUrls = getPhotoUrls(listing);
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
                  onClick={() => router.push(`/market?id=${listing.id}`)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && router.push(`/market?id=${listing.id}`)
                  }
                  className="vn-glass vn-card overflow-hidden cursor-pointer vn-card-hover flex flex-col sm:flex-row group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#04AA6D] rounded-2xl"
                >
                  <div className="relative w-full sm:w-2/5 sm:min-w-[160px] aspect-[4/3] bg-slate-100 overflow-hidden flex-shrink-0">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-slate-300 text-3xl">
                        {CATEGORY_ICONS[category] ?? "🍇"}
                      </span>
                    )}
                    {photoUrls.length > 1 && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                        {photoUrls.slice(0, 3).map((_, i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-white/80"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-5 flex flex-col min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 line-clamp-2">
                        {displayTitle}
                      </h3>
                      <button
                        onClick={(e) => toggleFavorite(listing.id, e)}
                        disabled={favoriteToggling === listing.id}
                        className={`shrink-0 transition-colors ${
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
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl font-bold text-[#04AA6D] tracking-tight">
                        {listing.price != null && listing.price > 0
                          ? `${listing.price.toLocaleString()} ₾`
                          : t("market.priceByAgreement")}
                      </span>
                      {listing.quantity != null && unitLabel && (
                        <span className="text-slate-500 text-sm font-medium">
                          {listing.quantity} / {unitLabel}
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
                          <Square size={14} />
                          {listing.quantity} {unitLabel}
                        </span>
                      )}
                      {listing.sugarBrix != null && (
                        <span>{listing.sugarBrix} °Brix</span>
                      )}
                      {listing.vintageYear != null && (
                        <span>{listing.vintageYear}</span>
                      )}
                      <span className="flex items-center gap-1 ml-auto">
                        {formatTimeAgo(listing.createdAt)}
                      </span>
                    </div>
                    <span
                      className="mt-2 text-xs font-medium"
                      style={{ color: getCategoryColor(category) }}
                    >
                      {t(getCategoryLabelKey(category))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Detailed list view: ss.ge-style layout */
          <div key="detailed" className="space-y-4 animate-fade-in">
            {filteredListings.map((listing, index) => {
              const photoUrls = getPhotoUrls(listing);
              const imgUrl = photoUrls[0] ?? null;
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
              const status = listing.status ?? "active";
              const statusColor = STATUS_COLORS[status] ?? "#8a8a8a";

              return (
                <article
                  key={listing.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/market?id=${listing.id}`)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && router.push(`/market?id=${listing.id}`)
                  }
                  className="market-list-card group relative cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#04AA6D] animate-fade-in-stagger"
                  style={{ animationDelay: `${Math.min(index * 40, 350)}ms` }}
                >
                  <div className="flex flex-col sm:flex-row min-h-0">
                    {/* Image: ~40% width, main + thumbnail strip */}
                    <div className="sm:w-[42%] lg:w-[38%] flex-shrink-0 relative">
                      <div className="relative aspect-[4/3] sm:aspect-[4/3] bg-slate-100 overflow-hidden">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-slate-300 text-4xl select-none">
                            {CATEGORY_ICONS[category] ?? "🍇"}
                          </span>
                        )}
                        {/* Badge overlay top-left */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-white"
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
                        <div className="flex gap-1.5 p-2 bg-slate-50 border-t border-slate-100">
                          {photoUrls.slice(0, 2).map((url, i) => (
                            <div
                              key={i}
                              className="w-16 h-16 rounded overflow-hidden bg-slate-200 flex-shrink-0"
                            >
                              <img
                                src={url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {photoUrls.length > 2 && (
                            <div className="w-16 h-16 rounded bg-slate-200 flex items-center justify-center text-slate-500 text-[10px] font-semibold flex-shrink-0 px-1 text-center">
                              {t("market.moreImages").replace(
                                "{{count}}",
                                String(photoUrls.length - 2),
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Main content: title, price, location, description, features row */}
                    <div className="flex-1 flex flex-col min-w-0 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2 flex-1">
                          {displayTitle}
                        </h2>
                        <button
                          onClick={(e) => toggleFavorite(listing.id, e)}
                          disabled={favoriteToggling === listing.id}
                          className={`shrink-0 p-2 rounded-lg transition-colors ${
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
                              favoriteIds.has(listing.id)
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-baseline gap-2 mb-2">
                        <span className="text-xl font-bold text-[#04AA6D] tabular-nums">
                          {listing.price != null && listing.price > 0
                            ? `${listing.price.toLocaleString()} ₾`
                            : t("market.priceByAgreement")}
                        </span>
                        {listing.quantity != null && unitLabel && (
                          <span className="text-slate-500 text-sm">
                            {listing.quantity} / {unitLabel}
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
                        <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-3">
                          {listing.notes || listing.description}
                        </p>
                      )}

                      {/* Features row: icon + text (like reference) */}
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-slate-600 text-sm mt-auto">
                        {listing.quantity != null && unitLabel && (
                          <span className="inline-flex items-center gap-1.5">
                            <Package size={14} className="text-slate-400" />
                            {listing.quantity} {unitLabel}
                          </span>
                        )}
                        {listing.sugarBrix != null && (
                          <span className="inline-flex items-center gap-1.5">
                            °B {listing.sugarBrix}
                          </span>
                        )}
                        {listing.vintageYear != null && (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-400" />
                            {listing.vintageYear}
                          </span>
                        )}
                        {listing.harvestDate && (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-400" />
                            {formatHarvestDate(listing.harvestDate)}
                          </span>
                        )}
                      </div>

                      {/* Favorite + publish time at bottom */}
                      <div className="flex flex-col items-end gap-1 mt-4 pt-4 border-t border-slate-100">
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
                            size={20}
                            strokeWidth={2}
                            fill={
                              favoriteIds.has(listing.id)
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>
                        <span className="text-slate-400 text-xs">
                          {formatTimeAgo(listing.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Right sidebar: avatar, contact, location, time (compact) */}
                    <div className="sm:w-[140px] lg:w-[160px] flex-shrink-0 flex flex-col items-center sm:items-center p-4 sm:py-5 sm:px-4 border-t sm:border-t-0 sm:border-l border-slate-100">
                      <div className="flex flex-col items-center lg:items-center gap-2 text-center">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
                          style={{
                            backgroundColor: getCategoryColor(category),
                          }}
                        >
                          {(listing.contactName || "?").charAt(0).toUpperCase()}
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
                        <p className="text-slate-400 text-xs">
                          {formatTimeAgo(listing.createdAt)}
                        </p>
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
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
