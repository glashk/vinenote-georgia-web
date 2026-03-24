"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { vineyardBlocksService } from "@/services/vineyardBlocks";
import type { VineyardBlock } from "@/types/vineyard";
import Container from "@/components/Container";
import {
  Leaf,
  Plus,
  Search,
  LayoutGrid,
  List,
  ArrowLeft,
  ImageIcon,
} from "lucide-react";

const COLOR_BG: Record<string, string> = {
  red: "#E36A78",
  white: "#DDE6A3",
  amber: "#F0C59A",
};
const COLOR_DOT: Record<string, string> = {
  red: "#B3263A",
  white: "#9AA318",
  amber: "#C7772C",
};

function year(b: VineyardBlock): string {
  const d = b.plantingDate;
  if (!d) return "—";
  const y =
    typeof d === "string" ? new Date(d).getFullYear() : (d as Date).getFullYear();
  return String(y);
}

export default function VineyardsClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [query, setQuery] = useState("");
  const [colorFilter, setColorFilter] = useState<"all" | "red" | "white" | "amber">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/vineyards");
  }, [ready, user, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await vineyardBlocksService.getUserVineyardBlocks(user.uid);
      setBlocks(data);
    } catch {
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleBlocks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blocks.filter((b) => {
      if (colorFilter !== "all" && b.grapeColor !== colorFilter) return false;
      if (!q) return true;
      const hay = `${b.name ?? ""} ${b.grapeVariety ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [blocks, colorFilter, query]);

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
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">{t("dashboard.title")}</span>
          </Link>
          <Link
            href="/vineyards/add"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700"
          >
            <Plus size={18} />
            {t("vineyardBlocks.createBlock")}
          </Link>
        </div>

        <div className="relative mb-4">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("common.search")}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 mb-4">
          {(["all", "red", "white", "amber"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setColorFilter(c)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                colorFilter === c
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {c === "all" ? t("common.all") : t(`vineyardBlocks.grapeColors.${c}`)}
            </button>
          ))}
          <div className="ml-auto flex gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${viewMode === "list" ? "bg-white shadow" : ""}`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${viewMode === "grid" ? "bg-white shadow" : ""}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-pulse text-slate-500">Loading vineyards…</div>
          </div>
        ) : blocks.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
              <Leaf size={36} className="text-slate-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              {t("vineyards.empty")}
            </h2>
            <p className="text-slate-600 mb-6">{t("vineyards.emptySubtext")}</p>
            <Link
              href="/vineyards/add"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
            >
              <Plus size={18} />
              {t("vineyardBlocks.createBlock")}
            </Link>
          </div>
        ) : visibleBlocks.length === 0 ? (
          <p className="text-center py-16 text-slate-600">{t("common.noResults")}</p>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {visibleBlocks.map((b) => (
              <Link
                key={b.id}
                href={`/vineyards/detail?id=${b.id}`}
                className="block rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div
                  className="aspect-[4/3] relative"
                  style={{ backgroundColor: COLOR_BG[b.grapeColor ?? ""] ?? "#e8e6e1" }}
                >
                  {b.photoUrl ? (
                    <Image
                      src={b.photoUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 200px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon size={36} className="text-slate-400" />
                    </div>
                  )}
                  {b.grapeColor && (
                    <span
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: COLOR_DOT[b.grapeColor] }}
                    >
                      {t(`vineyardBlocks.grapeColors.${b.grapeColor}`).charAt(0)}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 truncate">{b.name}</h3>
                  <p className="text-sm text-slate-600">
                    {b.grapeVariety || "—"} · {year(b)}
                  </p>
                  {b.area != null && (
                    <p className="text-xs text-emerald-600 font-semibold mt-1">
                      {b.area} ha
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleBlocks.map((b) => (
              <Link
                key={b.id}
                href={`/vineyards/detail?id=${b.id}`}
                className="flex rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                <div
                  className="w-24 sm:w-32 h-24 sm:h-28 flex-shrink-0 relative"
                  style={{ backgroundColor: COLOR_BG[b.grapeColor ?? ""] ?? "#e8e6e1" }}
                >
                  {b.photoUrl ? (
                    <Image
                      src={b.photoUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon size={32} className="text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 p-4 flex flex-col justify-center">
                  <h3 className="font-bold text-slate-900 truncate">{b.name}</h3>
                  <p className="text-sm text-slate-600">
                    {b.grapeVariety || "—"} · {year(b)}
                    {b.area != null ? ` · ${b.area} ha` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
