"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { harvestsService } from "@/services/harvests";
import { vineyardBlocksService } from "@/services/vineyardBlocks";
import { containersService } from "@/services/containers";
import type { Harvest } from "@/types/firestore";
import type { VineyardBlock } from "@/types/vineyard";
import type { Container } from "@/types/firestore";
import Container from "@/components/Container";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

export default function HarvestDetailClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [harvest, setHarvest] = useState<Harvest | null>(null);
  const [block, setBlock] = useState<VineyardBlock | null>(null);
  const [container, setContainer] = useState<Container | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/harvests/detail");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user || !id) {
      if (!id) router.replace("/harvests");
      setLoading(false);
      return;
    }
    harvestsService
      .getHarvest(user.uid, id)
      .then(        async (h) => {
        setHarvest(h);
        if (h?.vineyardBlockId) {
          const b = await vineyardBlocksService.getVineyardBlock(user.uid, h.vineyardBlockId);
          setBlock(b);
        }
        if (h?.containers?.[0]) {
          const c = await containersService.getContainer(user.uid, h.containers[0]);
          setContainer(c);
        }
      })
      .catch(() => setHarvest(null))
      .finally(() => setLoading(false));
  }, [user, id]);

  const handleDelete = async () => {
    if (!user || !id || !confirm(t("common.deleteConfirm"))) return;
    setDeleting(true);
    try {
      await harvestsService.deleteHarvest(user.uid, id);
      router.push("/harvests");
    } catch {
      setDeleting(false);
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

  if (!harvest) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-600">{t("harvests.notFound")}</p>
        <Link href="/harvests" className="text-emerald-600 font-semibold">
          {t("common.backToHome")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <Container className="py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/harvests"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={20} />
            {t("harvests.title")}
          </Link>
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/wine-batches/add?harvestId=${id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
            >
              {t("harvests.createWineBatch")}
            </Link>
            <Link
              href={`/harvests/add?id=${id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Pencil size={16} />
              {t("common.edit")}
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 size={16} />
              {t("common.delete")}
            </button>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            {new Date(harvest.date).toLocaleDateString()} · {harvest.quantity} {harvest.unit}
          </h1>
          <div className="space-y-2 text-sm">
            {block && (
              <p>
                <span className="text-slate-500">{t("harvests.vineyardBlockLabel")}:</span> {block.name}
              </p>
            )}
            {container && (
              <p>
                <span className="text-slate-500">{t("harvests.containerLabel")}:</span> {container.name}
              </p>
            )}
            {harvest.sugarBrix != null && (
              <p>
                <span className="text-slate-500">{t("forms.harvest.sugarLevelLabel")}:</span> {harvest.sugarBrix}
              </p>
            )}
            {harvest.grapeVariety && (
              <p>
                <span className="text-slate-500">{t("harvests.grapeVarietyLabel")}:</span>{" "}
                {harvest.grapeVariety}
              </p>
            )}
            {harvest.quality && (
              <p>
                <span className="text-slate-500">{t("harvests.qualityLabel")}:</span>{" "}
                {t(`harvests.qualities.${harvest.quality}`)}
              </p>
            )}
            {harvest.weatherConditions && (
              <p>
                <span className="text-slate-500">{t("harvests.weatherLabel")}:</span> {harvest.weatherConditions}
              </p>
            )}
            {harvest.notes && (
              <p className="pt-2">
                <span className="text-slate-500">{t("forms.harvest.notesLabel")}:</span>
                <br />
                <span className="text-slate-700">{harvest.notes}</span>
              </p>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
