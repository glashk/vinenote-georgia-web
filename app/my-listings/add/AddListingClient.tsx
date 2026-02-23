"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import { auth, getFirebaseStorage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getDb } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Wine,
  Grape,
  Apple,
  Package,
  Sprout,
  Camera,
  Plus,
  X,
  GripVertical,
  ArrowLeft,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import RegionSearchInput from "@/components/RegionSearchInput";

type Category = "wine" | "grapes" | "nobati" | "inventory" | "seedlings";

const WINE_UNITS = ["l", "bottles"];
const GRAPE_UNITS = ["kg", "tons"];
const NOBATI_UNITS = ["pcs", "kg"];
const INVENTORY_UNITS = ["pcs", "kg", "l"];
const SEEDLINGS_UNITS = ["pcs"];

const CATEGORY_ICONS: Record<
  Category,
  React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>
> = {
  wine: Wine,
  grapes: Grape,
  nobati: Apple,
  inventory: Package,
  seedlings: Sprout,
};

function CategoryIcon({
  category,
  active,
}: {
  category: Category;
  active: boolean;
}) {
  const Icon = CATEGORY_ICONS[category];
  return (
    <Icon
      size={20}
      strokeWidth={2}
      className="shrink-0"
      style={{ color: active ? "white" : "#2d5a27" }}
      aria-hidden
    />
  );
}

export default function AddListingClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const [user, setUser] = useState(auth?.currentUser ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<Category>("grapes");
  const [variety, setVariety] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState("");
  const [region, setRegion] = useState("");
  const [village, setVillage] = useState("");
  const [harvestDate, setHarvestDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [sugarBrix, setSugarBrix] = useState("");
  const [vintageYear, setVintageYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [wineType, setWineType] = useState("");
  const [phone, setPhone] = useState("");
  const [contactName, setContactName] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoUploading = uploadingCount > 0;

  const units = useMemo(
    () =>
      category === "wine"
        ? WINE_UNITS
        : category === "grapes"
          ? GRAPE_UNITS
          : category === "nobati"
            ? NOBATI_UNITS
            : category === "inventory"
              ? INVENTORY_UNITS
              : category === "seedlings"
                ? SEEDLINGS_UNITS
                : GRAPE_UNITS,
    [category],
  );

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const defaultUnit =
      category === "wine"
        ? "l"
        : category === "nobati" ||
            category === "inventory" ||
            category === "seedlings"
          ? "pcs"
          : "kg";
    setUnit(units.includes(defaultUnit) ? defaultUnit : units[0]);
  }, [category, units]);

  const validate = (): { ok: boolean; message?: string } => {
    const productOrVariety = variety.trim();
    if (!productOrVariety)
      return {
        ok: false,
        message:
          category === "nobati"
            ? t("market.validation.productRequired")
            : category === "inventory"
              ? t("market.validation.itemRequired")
              : t("market.validation.varietyRequired"),
      };
    if (!region.trim())
      return { ok: false, message: t("market.validation.regionRequired") };
    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty <= 0)
      return { ok: false, message: t("market.validation.quantityRequired") };
    if (!phone.trim())
      return { ok: false, message: t("market.validation.phoneRequired") };
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 9)
      return { ok: false, message: t("market.validation.phoneInvalid") };
    if (category === "grapes" && sugarBrix.trim()) {
      const s = Number(sugarBrix);
      if (Number.isNaN(s) || s < 0 || s > 30)
        return { ok: false, message: t("market.validation.sugarRange") };
    }
    if (category === "wine" && vintageYear.trim()) {
      const y = Number(vintageYear);
      const year = new Date().getFullYear();
      if (Number.isNaN(y) || y < 1900 || y > year + 1)
        return { ok: false, message: t("market.validation.vintageRange") };
    }
    if (price.trim()) {
      const p = Number(price.replace(",", "."));
      if (Number.isNaN(p) || p < 0)
        return { ok: false, message: t("market.validation.priceNonNegative") };
    }
    return { ok: true };
  };

  const uploadPhoto = useCallback(
    async (file: File) => {
      if (!user) return;
      const storage = await getFirebaseStorage();
      if (!storage) {
        setError(t("market.photoUploadError"));
        return;
      }
      setUploadingCount((c) => c + 1);
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `marketListings/${user.uid}/${filename}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        setPhotoUrls((prev) => (prev.length < 5 ? [...prev, url] : prev));
      } catch (err: unknown) {
        console.error("Photo upload error:", err);
        const fbErr = err as { code?: string; message?: string };
        let msg = t("market.photoUploadError");
        if (fbErr?.code === "storage/unauthorized") {
          msg =
            t("market.photoUploadError") +
            " — Run: firebase deploy --only storage";
        } else if (fbErr?.code === "storage/unauthenticated") {
          msg = t("market.photoUploadError") + " — Please sign in again";
        } else if (fbErr?.message) {
          msg = fbErr.message;
        }
        setError(msg);
      } finally {
        setUploadingCount((c) => Math.max(0, c - 1));
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [user, t],
  );

  const handlePhotoInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      const toAdd = Math.min(files.length, 5 - photoUrls.length);
      for (let i = 0; i < toAdd; i++) {
        uploadPhoto(files[i]);
      }
    },
    [photoUrls.length, uploadPhoto],
  );

  const removePhoto = useCallback((index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const movePhoto = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setPhotoUrls((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const v = validate();
    if (!v.ok) {
      setError(v.message ?? t("market.errorLoad"));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const payload: Record<string, unknown> = {
        userId: user.uid,
        category,
        variety: variety.trim(),
        quantity: Number(quantity),
        unit,
        region: region.trim(),
        phone: phone.trim(),
        status: "active",
        createdAt: Timestamp.now(),
      };
      if (price.trim()) payload.price = Number(price.replace(",", "."));
      if (village.trim()) payload.village = village.trim();
      if (category === "grapes" && harvestDate)
        payload.harvestDate = harvestDate;
      if (category === "grapes" && sugarBrix.trim())
        payload.sugarBrix = Number(sugarBrix);
      if (category === "wine" && vintageYear.trim())
        payload.vintageYear = Number(vintageYear);
      if (category === "wine" && wineType.trim())
        payload.wineType = wineType.trim();
      if (contactName.trim()) payload.contactName = contactName.trim();
      if (notes.trim()) payload.notes = notes.trim();
      if (photoUrls.length > 0) payload.photoUrls = photoUrls;
      await addDoc(collection(db, "marketListings"), payload);
      router.push("/my-listings");
    } catch (err: unknown) {
      console.error("Add listing error:", err);
      const fbErr = err as { code?: string; message?: string };
      let msg = t("market.errorLoad");
      if (fbErr?.code === "permission-denied") {
        msg =
          t("market.errorLoad") + " — Permission denied. Please sign in again.";
      } else if (fbErr?.message) {
        msg = fbErr.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const varietyLabel =
    category === "nobati"
      ? t("market.product")
      : category === "inventory"
        ? t("market.item")
        : t("market.variety");
  const varietyPlaceholder =
    category === "nobati"
      ? t("market.productPlaceholder")
      : category === "inventory"
        ? t("market.itemPlaceholder")
        : t("market.varietyPlaceholder");

  const inputBase =
    "mt-2 w-full px-4 py-3.5 rounded-xl border border-[#e8e6e1] bg-[#fafaf8] text-[#1f2a1f] text-base focus:ring-2 focus:ring-[#04AA6D]/40 focus:border-[#04AA6D] outline-none transition-colors";
  const labelBase = "block text-sm font-bold text-[#1f2a1f] mt-4 first:mt-0";

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f4f0] px-4 py-14 sm:py-20">
        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                <Plus
                  size={32}
                  strokeWidth={2.5}
                  className="text-emerald-600"
                />
              </div>
              <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                {t("market.addListing")}
              </h1>
              {/* <p className="mt-3 text-slate-600">
                {t("auth.signIn.noAccount")}
              </p> */}
              <p className="mt-1 text-sm text-slate-500">
                {t("auth.signIn.addListingHint")}
              </p>
              <Link
                href="/login?redirect=/my-listings/add"
                className="mt-8 w-full min-h-[52px] rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-emerald-500/25 transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              >
                {t("nav.signIn")}
              </Link>
              <div className="mt-6 pt-6 w-full border-t border-slate-200">
                <Link
                  href="/"
                  className="flex items-center justify-center gap-3 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <span aria-hidden>←</span>
                  {t("common.backToHome")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0] py-14 sm:py-20">
      <Container>
        <div className="max-w-xl mx-auto px-4">
          <div className="mb-8">
            <Link
              href="/my-listings"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4 transition-colors group"
            >
              <ArrowLeft
                size={18}
                strokeWidth={2}
                className="transition-transform group-hover:-translate-x-0.5"
              />
              {t("market.backToList")}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t("market.addListing")}
            </h1>
            <p className="mt-1.5 text-slate-600 text-base">
              {t("market.addListingSubtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              className="bg-white rounded-[18px] p-5 sm:p-6 shadow-sm"
              style={{
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              {/* Add photo */}
              <label className={labelBase}>{t("market.addPhoto")}</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoInputChange}
                disabled={loading || photoUploading || photoUrls.length >= 5}
              />
              <div className="flex flex-wrap gap-3 mt-2">
                {photoUrls.map((url, idx) => (
                  <div
                    key={url}
                    draggable
                    onDragStart={() => setDraggedPhotoIndex(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (
                        draggedPhotoIndex !== null &&
                        draggedPhotoIndex !== idx
                      ) {
                        movePhoto(draggedPhotoIndex, idx);
                      }
                      setDraggedPhotoIndex(null);
                    }}
                    onDragEnd={() => setDraggedPhotoIndex(null)}
                    className={`relative group cursor-grab active:cursor-grabbing ${
                      draggedPhotoIndex === idx ? "opacity-60" : ""
                    }`}
                  >
                    <div className="relative w-20 h-20 rounded-[14px] overflow-hidden bg-[#ebe9e4] pointer-events-none">
                      <Image
                        src={url}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#04AA6D] text-white">
                        {t("market.mainImage")}
                      </span>
                    )}
                    <div className="absolute bottom-1 left-1 p-1 rounded bg-white/90 text-slate-500">
                      <GripVertical size={12} strokeWidth={2} />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      disabled={loading}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center text-[#c44d2e] hover:bg-red-50 transition-colors disabled:opacity-50"
                      aria-label={t("common.delete")}
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
                {photoUrls.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || photoUploading}
                    className="w-20 h-20 rounded-[14px] border-2 border-dashed border-[#e0ddd8] flex flex-col items-center justify-center gap-1 hover:border-[#2d5a27]/40 hover:bg-[#f5f4f0]/50 transition-colors disabled:opacity-50 disabled:hover:border-[#e0ddd8] disabled:hover:bg-transparent"
                  >
                    {photoUploading ? (
                      <span className="w-5 h-5 border-2 border-[#2d5a27] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Camera
                          size={28}
                          strokeWidth={2}
                          className="text-[#2d5a27]"
                        />
                        <span className="text-xs text-[#2d5a27] font-medium">
                          {t("market.addPhoto")}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Category chips */}
              <label className={labelBase}>{t("market.category")}</label>
              <div className="flex flex-wrap gap-2.5 mt-2 mb-4">
                {(
                  [
                    "wine",
                    "grapes",
                    "nobati",
                    "inventory",
                    "seedlings",
                  ] as const
                ).map((c) => {
                  const active = category === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      disabled={loading}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border text-sm font-semibold transition-colors ${
                        active
                          ? "bg-[#04AA6D] border-[#04AA6D] text-white"
                          : "bg-[#f5f4f0] border-[#e8e6e1] text-[#2c2c2c] hover:border-[#d0cec8]"
                      }`}
                    >
                      <CategoryIcon category={c} active={active} />
                      {t(
                        `market.category${c.charAt(0).toUpperCase() + c.slice(1)}`,
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Variety / Product / Item — for wine/grapes: variety + wineType/sugarBrix side by side */}
              {category === "wine" || category === "grapes" ? (
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-3">
                  <div className="flex-1">
                    <label className={labelBase}>{varietyLabel} *</label>
                    <input
                      type="text"
                      value={variety}
                      onChange={(e) => setVariety(e.target.value)}
                      placeholder={varietyPlaceholder}
                      className={`${inputBase} placeholder-[#8a9a85]`}
                      required
                    />
                  </div>
                  {category === "wine" && (
                    <div className="flex-1">
                      <label className={labelBase}>
                        {t("market.wineType")}
                      </label>
                      <input
                        type="text"
                        value={wineType}
                        onChange={(e) => setWineType(e.target.value)}
                        placeholder={t("market.wineTypePlaceholder")}
                        className={`${inputBase} placeholder-[#8a9a85]`}
                      />
                    </div>
                  )}
                  {category === "grapes" && (
                    <div className="flex-1">
                      <label className={labelBase}>
                        {t("market.sugarBrix")}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={sugarBrix}
                        onChange={(e) => setSugarBrix(e.target.value)}
                        placeholder={t("market.sugarBrixPlaceholder")}
                        className={`${inputBase} placeholder-[#8a9a85]`}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <label className={labelBase}>{varietyLabel} *</label>
                  <input
                    type="text"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    placeholder={varietyPlaceholder}
                    className={`${inputBase} placeholder-[#8a9a85]`}
                    required
                  />
                </>
              )}

              {/* Region + Village side by side on web */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-3 mt-4">
                <div className="flex-1">
                  <label className={labelBase}>{t("market.region")} *</label>
                  <RegionSearchInput
                    className="mt-2"
                    value={region}
                    onChange={setRegion}
                    t={t}
                    placeholder={t("market.selectRegion")}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className={labelBase}>{t("market.village")}</label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder={t("market.villagePlaceholder")}
                    className={`${inputBase} placeholder-[#8a9a85]`}
                  />
                </div>
              </div>

              {/* Quantity + Unit row */}
              <div className="flex gap-3 mt-4">
                <div className="flex-1">
                  <label className={labelBase}>{t("common.quantity")} *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className={inputBase}
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className={labelBase}>{t("market.unit")}</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {units.map((u) => {
                      const active = unit === u;
                      return (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setUnit(u)}
                          disabled={loading}
                          className={`px-3.5 py-2 rounded-full text-sm font-semibold border transition-colors ${
                            active
                              ? "bg-[#04AA6D] border-[#04AA6D] text-white"
                              : "bg-[#f5f4f0] border-[#e8e6e1] text-[#2c2c2c]"
                          }`}
                        >
                          {t(`market.units.${u}`) !== `market.units.${u}`
                            ? t(`market.units.${u}`)
                            : u}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Grapes: harvest date (sugar Brix is beside variety above) */}
              {category === "grapes" && (
                <>
                  <label className={labelBase}>{t("market.harvestDate")}</label>
                  <input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className={inputBase}
                  />
                </>
              )}

              {/* Wine: vintage year (wine type is beside variety above) */}
              {category === "wine" && (
                <>
                  <label className={labelBase}>{t("market.vintageYear")}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={vintageYear}
                    onChange={(e) => setVintageYear(e.target.value)}
                    placeholder={t("market.vintageYearPlaceholder")}
                    className={`${inputBase} placeholder-[#8a9a85]`}
                  />
                </>
              )}

              {/* Contact: name + phone side by side on web */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-3 mt-4">
                <div className="flex-1">
                  <label className={labelBase}>{t("market.contactName")}</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={t("market.contactNamePlaceholder")}
                    className={`${inputBase} placeholder-[#8a9a85]`}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelBase}>{t("market.phone")} *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("market.phonePlaceholder")}
                    className={`${inputBase} placeholder-[#8a9a85]`}
                    required
                  />
                </div>
              </div>

              {/* Price */}
              <label className={labelBase}>{t("market.price")}</label>
              <input
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={t("market.pricePlaceholder")}
                className={`${inputBase} placeholder-[#8a9a85]`}
              />

              {/* Notes */}
              <label className={labelBase}>{t("market.notesOptional")}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("market.notesPlaceholder")}
                rows={3}
                className={`${inputBase} placeholder-[#8a9a85] min-h-[90px] resize-none`}
              />

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              {/* Save button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-7 w-full min-h-[54px] rounded-full bg-[#04AA6D] text-white text-base font-bold flex items-center justify-center gap-3 disabled:opacity-70 hover:bg-[#039a5e] transition-colors shadow-sm"
                style={{
                  boxShadow: "0 4px 8px rgba(4, 170, 109, 0.2)",
                }}
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  t("market.publish")
                )}
              </button>
            </div>
          </form>
        </div>
      </Container>
    </div>
  );
}
