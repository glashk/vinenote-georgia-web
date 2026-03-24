"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { wineBatchesService } from "@/services/wineBatches";
import type { WineBatch } from "@/types/firestore";
import Container from "@/components/Container";
import { ArrowLeft, Plus, Wine } from "lucide-react";

export default function WineBatchesClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [batches, setBatches] = useState<WineBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/wine-batches");
  }, [ready, user, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await wineBatchesService.getUserWineBatches(user.uid);
      setBatches(data);
    } catch {
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

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
            href="/wine-batches/add"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700"
          >
            <Plus size={18} />
            {t("wineBatches.createWineBatch")}
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          {t("wineBatches.title")}
        </h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-pulse text-slate-500">Loading wine batches…</div>
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
              <Wine size={36} className="text-slate-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              {t("wineBatches.empty")}
            </h2>
            <p className="text-slate-600 mb-6">{t("wineBatches.emptySubtext")}</p>
            <Link
              href="/wine-batches/add"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
            >
              <Plus size={18} />
              {t("wineBatches.createWineBatch")}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((b) => (
              <Link
                key={b.id}
                href={`/wine-batches/detail?id=${b.id}`}
                className="block p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{b.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {b.vintage ? `${b.vintage} · ` : ""}
                      {b.grapeVariety || "—"} · {b.volume} L
                    </p>
                    <span className="inline-block mt-2 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                      {t(`wineBatches.statuses.${b.status}`)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
