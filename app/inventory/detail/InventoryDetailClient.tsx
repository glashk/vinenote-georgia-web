"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { inventoryService } from "@/services/inventory";
import type { Inventory } from "@/types/firestore";
import Container from "@/components/Container";
import { ArrowLeft, ImageIcon, MapPin, ArrowUpDown } from "lucide-react";

export default function InventoryDetailClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [item, setItem] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState("");

  const load = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    try {
      const doc = await inventoryService.getInventoryItem(user.uid, id);
      setItem(doc);
    } catch {
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/inventory/detail");
  }, [ready, user, router]);

  useEffect(() => {
    load();
  }, [load]);

  const unitLabel = (u: Inventory["unit"]) => t(`inventory.units.${u}`);
  const categoryLabel = (c: Inventory["category"]) => t(`inventory.categories.${c}`);

  const low = item
    ? (() => {
        const min = Number(item.minQuantity) || 0;
        if (min <= 0) return false;
        return Number(item.quantity) <= min;
      })()
    : false;

  const minQuantity = Number(item?.minQuantity) || 0;

  const closeModal = () => {
    setModalVisible(false);
    setAmount("");
  };

  const parseAmount = (): number | null => {
    const n = Number(amount);
    if (!amount.trim() || Number.isNaN(n) || n <= 0) return null;
    return n;
  };

  const adjust = async (direction: "add" | "remove") => {
    if (!user || !item) return;
    const n = parseAmount();
    if (n == null) {
      alert(t("inventory.amountInvalid"));
      return;
    }
    const delta = direction === "add" ? n : -n;
    setUpdating(true);
    try {
      const next = await inventoryService.adjustInventoryQuantity(
        user.uid,
        item.id,
        delta
      );
      setItem((prev) => (prev ? { ...prev, quantity: next } : prev));
      closeModal();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "inventory.quantityCannotBeNegative") {
        alert(t("inventory.quantityCannotBeNegative"));
      } else {
        alert(t("inventory.updateQuantityError"));
      }
    } finally {
      setUpdating(false);
    }
  };

  if (!ready || !user) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading…</div>
      </div>
    );
  }

  if (!id) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading…</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-600 italic">{t("inventory.notFound")}</p>
        <Link href="/inventory" className="text-emerald-700 font-bold">
          {t("common.cancel")}
        </Link>
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

        {/* Hero card */}
        <div
          className={`p-4 rounded-2xl bg-white border mb-4 ${
            low ? "border-red-200" : "border-slate-200"
          }`}
        >
          <div className="relative">
            {item.photoUrl ? (
              <div className="w-full h-[200px] rounded-xl overflow-hidden bg-slate-100">
                <Image
                  src={item.photoUrl}
                  alt=""
                  width={400}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-[200px] rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-2">
                <ImageIcon size={30} className="text-emerald-700" />
                <span className="text-emerald-700 font-bold">
                  {t("inventory.addPhoto")}
                </span>
              </div>
            )}

            <div className="absolute left-2.5 top-2.5 right-2.5 flex items-center justify-between gap-2">
              {low ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-red-50/95 border border-red-200/95">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-red-600 font-bold text-xs">
                    {t("inventory.low")}
                  </span>
                </span>
              ) : (
                <span />
              )}
              <span className="px-2.5 py-1.5 rounded-full bg-emerald-50/95 border border-emerald-200/95 text-emerald-700 font-bold text-xs">
                {categoryLabel(item.category)}
              </span>
            </div>
          </div>

          <h1 className="text-xl font-bold text-slate-900 mt-4">
            {item.name}
          </h1>

          {item.location && (
            <div className="flex items-center gap-1.5 mt-2">
              <MapPin size={16} className="text-slate-500" />
              <span className="text-slate-600 font-semibold truncate">
                {item.location}
              </span>
            </div>
          )}
        </div>

        {/* Quantity card */}
        <div
          className={`p-4 rounded-2xl bg-white border mb-4 ${
            low ? "border-red-200" : "border-slate-200"
          }`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-slate-600 font-bold text-sm">
              {t("inventory.quantityLabel")}
            </span>
            {minQuantity > 0 ? (
              <span
                className={`text-xs font-bold ${
                  low ? "text-red-600" : "text-slate-600"
                }`}
              >
                {t("inventory.min")}: {item.minQuantity} {unitLabel(item.unit)}
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-semibold">
                {t("common.none")}
              </span>
            )}
          </div>

          <p
            className={`mt-2 text-3xl font-bold ${
              low ? "text-red-600" : "text-emerald-700"
            }`}
          >
            {item.quantity}{" "}
            <span className={low ? "text-red-600" : "text-emerald-700"}>
              {unitLabel(item.unit)}
            </span>
          </p>

          <button
            onClick={() => setModalVisible(true)}
            className="w-full mt-4 py-4 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 hover:bg-emerald-800"
          >
            <ArrowUpDown size={18} />
            {t("inventory.updateQuantity")}
          </button>
        </div>

        {/* Details card */}
        {(item.notes || item.location || minQuantity > 0) && (
          <div className="p-4 rounded-2xl bg-white border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">
              {t("inventory.itemTitle")}
            </h2>

            {minQuantity > 0 && (
              <div className="flex justify-between mt-3">
                <span className="text-slate-600 font-bold text-sm">
                  {t("inventory.minQuantityLabel")}
                </span>
                <span className="text-slate-900 font-bold text-sm">
                  {item.minQuantity} {unitLabel(item.unit)}
                </span>
              </div>
            )}

            {item.location && (
              <div className="flex justify-between mt-3">
                <span className="text-slate-600 font-bold text-sm">
                  {t("inventory.locationLabel")}
                </span>
                <span className="text-slate-900 font-bold text-sm">
                  {item.location}
                </span>
              </div>
            )}

            {item.notes && (
              <div className="mt-3">
                <span className="text-slate-600 font-bold text-sm block">
                  {t("inventory.notesLabel")}
                </span>
                <p className="text-slate-700 mt-1.5 leading-relaxed whitespace-pre-wrap">
                  {item.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Update quantity modal */}
        {modalVisible && (
          <div
            className="fixed inset-0 bg-black/35 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-2xl p-4 max-w-sm w-full border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-slate-900">
                {t("inventory.updateQuantity")}
              </h3>
              <p className="text-sm text-slate-600 mt-2">
                {t("inventory.amountLabel")} ({unitLabel(item.unit)})
              </p>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t("inventory.amountPlaceholder")}
                min="0"
                step="0.01"
                disabled={updating}
                className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-lg"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => adjust("add")}
                  disabled={updating}
                  className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 hover:bg-emerald-800 disabled:opacity-50"
                >
                  <span>+</span>
                  {t("inventory.addQuantity")}
                </button>
                <button
                  onClick={() => adjust("remove")}
                  disabled={updating}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-50"
                >
                  <span>−</span>
                  {t("inventory.removeQuantity")}
                </button>
              </div>

              <button
                onClick={closeModal}
                disabled={updating}
                className="w-full mt-3 py-2 text-emerald-700 font-bold text-sm"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
