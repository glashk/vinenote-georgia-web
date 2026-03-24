"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { inventoryService } from "@/services/inventory";
import type { Inventory } from "@/types/firestore";
import Container from "@/components/Container";
import { ArrowLeft } from "lucide-react";

const CATEGORIES: Inventory["category"][] = ["additive", "packaging", "equipment", "chemical", "other"];
const UNITS: Inventory["unit"][] = ["kg", "g", "l", "pcs"];

export default function InventoryFormClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isEdit = !!id;

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Inventory["category"]>("additive");
  const [quantity, setQuantity] = useState("0");
  const [minQuantity, setMinQuantity] = useState("0");
  const [unit, setUnit] = useState<Inventory["unit"]>("kg");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/inventory/add");
  }, [ready, user, router]);

  useEffect(() => {
    if (isEdit && id && user) {
      inventoryService
        .getInventoryItem(user.uid, id)
        .then((item) => {
          if (item) {
            setName(item.name || "");
            setCategory(item.category || "additive");
            setQuantity(String(item.quantity ?? "0"));
            setMinQuantity(String(item.minQuantity ?? "0"));
            setUnit(item.unit || "kg");
            setLocation(item.location || "");
            setNotes(item.notes || "");
          } else {
            router.replace("/inventory");
          }
        })
        .catch(() => router.replace("/inventory"))
        .finally(() => setInitialLoading(false));
    }
  }, [isEdit, id, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    if (!name.trim()) {
      setError(t("inventory.nameRequired"));
      return;
    }
    const q = Number(quantity);
    const minQ = Number(minQuantity);
    if (isNaN(q) || q < 0) {
      setError(t("inventory.quantityInvalid"));
      return;
    }
    if (isNaN(minQ) || minQ < 0) {
      setError(t("inventory.minQuantityInvalid"));
      return;
    }
    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        category,
        quantity: q,
        minQuantity: minQ,
        unit,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      if (isEdit && id) {
        await inventoryService.updateInventoryItem(user.uid, id, data);
      } else {
        await inventoryService.createInventoryItem(user.uid, data);
      }
      router.push("/inventory");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("inventory.saveError"));
    } finally {
      setLoading(false);
    }
  };

  if (!ready || !user) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading…</div>
      </div>
    );
  }

  if (isEdit && initialLoading) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <Container className="py-6 sm:py-8">
        <Link
          href="/inventory"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft size={20} />
          {t("inventory.title")}
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          {isEdit ? t("forms.inventory.editTitle") : t("inventory.addInventory")}
        </h1>

        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm max-w-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-900 mt-3 first:mt-0">
                {t("inventory.nameLabel")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("inventory.namePlaceholder")}
                className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mt-4">
                {t("inventory.categoryLabel")}
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    disabled={loading}
                    className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                      category === c
                        ? "bg-emerald-700 text-white"
                        : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                    }`}
                  >
                    {t(`inventory.categories.${c}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mt-4">
                  {t("inventory.quantityLabel")}
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mt-4">
                  {t("inventory.unitLabel")}
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {UNITS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      disabled={loading}
                      className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                        unit === u
                          ? "bg-emerald-700 text-white"
                          : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                      }`}
                    >
                      {t(`inventory.units.${u}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mt-4">
                {t("inventory.minQuantityLabel")}
              </label>
              <input
                type="number"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                min="0"
                step="0.01"
                className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mt-4">
                {t("inventory.locationLabel")}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("inventory.locationPlaceholder")}
                className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mt-4">
                {t("inventory.notesLabel")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("inventory.notesPlaceholder")}
                rows={4}
                className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 min-h-[110px]"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-4 rounded-xl bg-emerald-700 text-white font-bold text-lg hover:bg-emerald-800 disabled:opacity-70 min-h-[52px]"
            >
              {loading ? "…" : t("common.save")}
            </button>
          </form>
        </div>
      </Container>
    </div>
  );
}
