"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { getDb } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { useLanguage } from "@/contexts/LanguageContext";

type MarketCategory = "grapes" | "wine" | "nobati";

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
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 text-sm"
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
            <div className="aspect-[4/3] bg-slate-200 flex items-center justify-center">
              <span className="text-slate-400 text-4xl">
                {category === "wine"
                  ? "🍷"
                  : category === "nobati"
                    ? "🥜"
                    : "🍇"}
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
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-white ${
                category === "wine"
                  ? "bg-[#872817]"
                  : category === "nobati"
                    ? "bg-[#C7772C]"
                    : "bg-[#99Aa3D]"
              }`}
            >
              {t(
                `market.category${
                  category === "grapes"
                    ? "Grapes"
                    : category === "wine"
                      ? "Wine"
                      : "Nobati"
                }`,
              )}
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
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-4xl mx-auto flex justify-center">
          <div className="w-10 h-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {t("market.title")}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {t("market.subtitle")}
            </p>
          </div>
          <Link href="/" className="vn-btn vn-btn-ghost text-sm">
            ← {t("nav.home")}
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        <p className="text-slate-500 text-sm mb-4">
          {listings.length} {t("market.listings")}
        </p>

        {listings.length === 0 ? (
          <div className="vn-glass vn-card vn-card-pad text-center py-16">
            <p className="text-slate-500">{t("market.empty")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => {
              const imgUrl = getListingImageUrl(listing);
              const displayTitle =
                listing.variety ?? listing.title ?? t("market.unknownListing");
              const hasLocation =
                [listing.region, listing.village].filter(Boolean).length > 0;
              const category = listing.category ?? "grapes";
              const formattedHarvest =
                listing.harvestDate && formatHarvestDate(listing.harvestDate);

              return (
                <div
                  key={listing.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/market?id=${listing.id}`)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && router.push(`/market?id=${listing.id}`)
                  }
                  className="vn-glass vn-card vn-card-pad cursor-pointer hover:opacity-95 transition-opacity"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 rounded-xl bg-slate-200 overflow-hidden flex items-center justify-center">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt=""
                            className="w-full h-full object-cover"
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
                            category === "wine"
                              ? "bg-[#872817]"
                              : category === "nobati"
                                ? "bg-[#C7772C]"
                                : "bg-[#99Aa3D]"
                          }`}
                        >
                          {t(
                            `market.category${category === "grapes" ? "Grapes" : category === "wine" ? "Wine" : "Nobati"}`,
                          )}
                        </span>
                        <span className="font-medium text-slate-900">
                          {displayTitle}
                        </span>
                      </div>
                      {hasLocation && (
                        <p className="text-slate-600 text-sm mb-1">
                          📍{" "}
                          {[listing.region, listing.village]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                      {listing.quantity != null && listing.unit && (
                        <p className="text-slate-600 text-sm mb-1">
                          {listing.quantity}{" "}
                          {(() => {
                            const key = `market.units.${listing.unit}`;
                            const label = t(key);
                            return label === key ? listing.unit : label;
                          })()}
                        </p>
                      )}
                      {(formattedHarvest ||
                        listing.sugarBrix != null ||
                        listing.vintageYear != null) && (
                        <p className="text-slate-500 text-xs mb-2">
                          {[
                            formattedHarvest,
                            listing.sugarBrix != null
                              ? `${listing.sugarBrix} °Brix`
                              : null,
                            listing.vintageYear != null
                              ? `${listing.vintageYear}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span
                          className={
                            listing.price != null && listing.price > 0
                              ? "inline-block px-3 py-1 rounded-full text-sm font-bold text-white bg-[#04AA6D] border border-[#04AA6D]"
                              : "inline-block px-3 py-1 rounded-md text-xs text-slate-600 bg-slate-100"
                          }
                        >
                          {listing.price != null && listing.price > 0
                            ? `${listing.price} ₾`
                            : t("market.priceByAgreement")}
                        </span>
                        {listing.phone && (
                          <a
                            href={`tel:${listing.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold text-white bg-[#04AA6D] hover:bg-[#039a5e] transition-colors"
                          >
                            {listing.contactName && (
                              <span className="truncate max-w-[120px]">
                                {listing.contactName}
                              </span>
                            )}
                            📞
                          </a>
                        )}
                      </div>
                    </div>
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
