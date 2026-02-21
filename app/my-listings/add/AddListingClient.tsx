"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getDb } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { Wine, Grape, Apple, Package, Sprout, Camera, Plus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Category = "wine" | "grapes" | "nobati" | "inventory" | "seedlings";

const WINE_UNITS = ["l", "bottles"];
const GRAPE_UNITS = ["kg", "tons"];
const NOBATI_UNITS = ["pcs", "kg"];
const INVENTORY_UNITS = ["pcs", "kg", "l"];
const SEEDLINGS_UNITS = ["pcs"];

const CATEGORY_ICONS: Record<Category, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  wine: Wine,
  grapes: Grape,
  nobati: Apple,
  inventory: Package,
  seedlings: Sprout,
};

function CategoryIcon({ category, active }: { category: Category; active: boolean }) {
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
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split("T")[0]);
  const [sugarBrix, setSugarBrix] = useState("");
  const [vintageYear, setVintageYear] = useState(new Date().getFullYear().toString());
  const [wineType, setWineType] = useState("");
  const [phone, setPhone] = useState("");
  const [contactName, setContactName] = useState("");
  const [notes, setNotes] = useState("");

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
    [category]
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
        : category === "nobati" || category === "inventory" || category === "seedlings"
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
    if (!region.trim()) return { ok: false, message: t("market.validation.regionRequired") };
    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty <= 0)
      return { ok: false, message: t("market.validation.quantityRequired") };
    if (!phone.trim()) return { ok: false, message: t("market.validation.phoneRequired") };
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
        price: price.trim() ? Number(price.replace(",", ".")) : undefined,
        region: region.trim(),
        village: village.trim() || undefined,
        harvestDate: category === "grapes" && harvestDate ? harvestDate : undefined,
        sugarBrix: category === "grapes" && sugarBrix.trim() ? Number(sugarBrix) : undefined,
        vintageYear: category === "wine" && vintageYear.trim() ? Number(vintageYear) : undefined,
        wineType: category === "wine" && wineType.trim() ? wineType.trim() : undefined,
        phone: phone.trim(),
        contactName: contactName.trim() || undefined,
        notes: notes.trim() || undefined,
        status: "active",
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(db, "marketListings"), payload);
      router.push("/my-listings");
    } catch (err) {
      console.error("Add listing error:", err);
      setError(t("market.errorLoad"));
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

  return (
    <div className="min-h-screen bg-[#f5f4f0] py-14 sm:py-20">
      <Container>
        <div className="max-w-xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
              <Plus size={24} strokeWidth={2.5} />
              {t("market.addListing")}
            </h1>
            <Link
              href="/my-listings"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              ← {t("market.backToList")}
            </Link>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              className="bg-white rounded-[18px] p-5 sm:p-6 shadow-sm"
              style={{
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              {/* Add photo placeholder */}
              <label className={labelBase}>{t("market.addPhoto")}</label>
              <div className="flex flex-wrap gap-3 mt-2">
                <div
                  className="w-20 h-20 rounded-[14px] border-2 border-dashed border-[#e0ddd8] flex flex-col items-center justify-center gap-1"
                  aria-hidden
                >
                  <Camera size={28} strokeWidth={2} className="text-[#2d5a27]" />
                  <span className="text-xs text-[#2d5a27] font-medium">
                    {t("market.addPhoto")}
                  </span>
                </div>
              </div>

              {/* Category chips */}
              <label className={labelBase}>{t("market.category")}</label>
              <div className="flex flex-wrap gap-2.5 mt-2">
                {(["wine", "grapes", "nobati", "inventory", "seedlings"] as const).map((c) => {
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
                      {t(`market.category${c.charAt(0).toUpperCase() + c.slice(1)}`)}
                    </button>
                  );
                })}
              </div>

              {/* Variety / Product / Item */}
              <label className={labelBase}>{varietyLabel} *</label>
              <input
                type="text"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder={varietyPlaceholder}
                className={`${inputBase} placeholder-[#8a9a85]`}
                required
              />

              {/* Region */}
              <label className={labelBase}>{t("market.region")} *</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder={t("market.regionPlaceholder")}
                className={`${inputBase} placeholder-[#8a9a85]`}
                required
              />

              {/* Village */}
              <label className={labelBase}>{t("market.village")}</label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder={t("market.villagePlaceholder")}
                className={`${inputBase} placeholder-[#8a9a85]`}
              />

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
                          {t(`market.units.${u}`) !== `market.units.${u}` ? t(`market.units.${u}`) : u}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Grapes: sugar Brix + harvest date */}
              {category === "grapes" && (
                <>
                  <label className={labelBase}>{t("market.sugarBrix")}</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={sugarBrix}
                    onChange={(e) => setSugarBrix(e.target.value)}
                    placeholder={t("market.sugarBrixPlaceholder")}
                    className={`${inputBase} placeholder-[#8a9a85]`}
                  />
                  <label className={labelBase}>{t("market.harvestDate")}</label>
                  <input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className={inputBase}
                  />
                </>
              )}

              {/* Wine: wine type + vintage year */}
              {category === "wine" && (
                <>
                  <label className={labelBase}>{t("market.wineType")}</label>
                  <input
                    type="text"
                    value={wineType}
                    onChange={(e) => setWineType(e.target.value)}
                    placeholder={t("market.wineTypePlaceholder")}
                    className={`${inputBase} placeholder-[#8a9a85]`}
                  />
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

              {/* Contact */}
              <label className={labelBase}>{t("market.contactName")}</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={t("market.contactNamePlaceholder")}
                className={`${inputBase} placeholder-[#8a9a85]`}
              />

              <label className={labelBase}>{t("market.phone")} *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("market.phonePlaceholder")}
                className={`${inputBase} placeholder-[#8a9a85]`}
                required
              />

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

              {error && (
                <p className="mt-4 text-sm text-red-600">{error}</p>
              )}

              {/* Save button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-7 w-full min-h-[54px] rounded-full bg-[#04AA6D] text-white text-base font-bold flex items-center justify-center gap-2 disabled:opacity-70 hover:bg-[#039a5e] transition-colors shadow-sm"
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
