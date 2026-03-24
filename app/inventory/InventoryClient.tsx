"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { inventoryService } from "@/services/inventory";
import type { Inventory } from "@/types/firestore";
import Container from "@/components/Container";
import { ArrowLeft, Plus, ClipboardList, Box, AlertCircle, Search, X } from "lucide-react";

const CATEGORIES: (Inventory["category"] | "all")[] = [
  "all",
  "additive",
  "packaging",
  "equipment",
  "chemical",
  "other",
];

export default function InventoryClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [items, setItems] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Inventory["category"] | "all">("all");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await inventoryService.getUserInventory(user.uid);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/inventory");
  }, [ready, user, router]);

  useEffect(() => {
    load();
  }, [load]);

  const isLow = useCallback((it: Inventory) => {
    const min = Number(it.minQuantity) || 0;
    if (min <= 0) return false;
    return Number(it.quantity) <= min;
  }, []);

  const unitLabel = (u: Inventory["unit"]) => t(`inventory.units.${u}`);
  const categoryLabel = (c: Inventory["category"]) => t(`inventory.categories.${c}`);

  const counterText = useMemo(() => {
    return items.length === 1
      ? t("inventory.subtitle").replace("{{count}}", String(items.length))
      : t("inventory.subtitlePlural").replace("{{count}}", String(items.length));
  }, [items.length, t]);

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((it) => {
      if (category !== "all" && it.category !== category) return false;
      if (!q) return true;
      const hay = `${it.name ?? ""} ${it.location ?? ""} ${it.notes ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
    filtered.sort((a, b) => {
      const al = isLow(a) ? 1 : 0;
      const bl = isLow(b) ? 1 : 0;
      if (al !== bl) return bl - al;
      return String(a.name ?? "").toLowerCase().localeCompare(String(b.name ?? "").toLowerCase());
    });
    return filtered;
  }, [category, isLow, items, query]);

  const clearFilters = useCallback(() => {
    setQuery("");
    setCategory("all");
  }, []);

  if (!ready || !user) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <Container className="py-6 sm:py-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">{t("dashboard.title")}</span>
          </Link>
          <Link
            href="/inventory/add"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800"
          >
            <Plus size={18} />
            {t("inventory.addInventory")}
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          {t("inventory.title")}
        </h1>
        <p className="text-sm text-slate-600 mb-4">{counterText}</p>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("inventory.searchPlaceholder")}
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={t("common.clear")}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                category === c
                  ? "bg-emerald-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {c === "all" ? t("inventory.all") : categoryLabel(c)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-pulse text-slate-500">Loading inventory…</div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={28} className="text-emerald-700" />
            </div>
            <p className="text-slate-600 font-medium mb-4">{t("inventory.empty")}</p>
            <Link
              href="/inventory/add"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800"
            >
              <Plus size={18} />
              {t("inventory.addInventory")}
            </Link>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl bg-white border border-slate-200">
            <p className="font-bold text-slate-900 mb-2">{t("inventory.noResultsTitle")}</p>
            <p className="text-sm text-slate-600 mb-4">{t("inventory.noResultsText")}</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 font-semibold hover:bg-slate-200"
            >
              {t("common.clear")}
            </button>
          </div>
        ) : (
          <div className="space-y-3 pb-6">
            {visibleItems.map((item) => {
              const low = isLow(item);
              const min = Number(item.minQuantity) || 0;
              return (
                <Link
                  key={item.id}
                  href={`/inventory/detail?id=${item.id}`}
                  className={`block p-4 rounded-xl border transition-all ${
                    low
                      ? "bg-white border-red-200 hover:border-red-300"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        low ? "bg-red-50" : "bg-emerald-50"
                      }`}
                    >
                      {low ? (
                        <AlertCircle size={18} className="text-red-600" />
                      ) : (
                        <Box size={18} className="text-emerald-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 truncate">{item.name}</h3>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                            low
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {item.quantity} {unitLabel(item.unit)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold mt-1 truncate">
                        {categoryLabel(item.category)}
                        {item.location ? ` • ${item.location}` : ""}
                      </p>
                      {min > 0 && (
                        <p
                          className={`text-xs mt-1.5 font-semibold ${
                            low ? "text-red-600" : "text-slate-600"
                          }`}
                        >
                          {low
                            ? `${t("inventory.low")} • ${t("inventory.min")}: ${item.minQuantity} ${unitLabel(item.unit)}`
                            : `${t("inventory.min")}: ${item.minQuantity} ${unitLabel(item.unit)}`}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Floating add - fixed bottom right on mobile */}
        <Link
          href="/inventory/add"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg hover:bg-teal-700 sm:hidden"
          aria-label={t("inventory.addInventory")}
        >
          <Plus size={24} />
        </Link>
      </Container>
    </div>
  );
}
