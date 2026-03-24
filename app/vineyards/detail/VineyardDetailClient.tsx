"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { vineyardBlocksService } from "@/services/vineyardBlocks";
import type { VineyardBlock } from "@/types/vineyard";
import Container from "@/components/Container";
import { ArrowLeft, Pencil, ImageIcon } from "lucide-react";

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

export default function VineyardDetailClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [block, setBlock] = useState<VineyardBlock | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/vineyards/detail");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user || !id) {
      if (!id) router.replace("/vineyards");
      setLoading(false);
      return;
    }
    vineyardBlocksService
      .getVineyardBlock(user.uid, id)
      .then(setBlock)
      .catch(() => setBlock(null))
      .finally(() => setLoading(false));
  }, [user, id, router]);

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

  if (!block) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-600">{t("vineyardBlocks.notFound")}</p>
        <Link href="/vineyards" className="text-emerald-600 font-semibold">
          {t("common.backToHome")}
        </Link>
      </div>
    );
  }

  const photoUrl = block.photoUrl;
  const bgTint = COLOR_BG[block.grapeColor ?? ""] ?? "#c9c4b8";

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <div
        className="h-56 sm:h-64 relative"
        style={{ backgroundColor: bgTint }}
      >
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon size={64} className="text-slate-400/60" />
          </div>
        )}
        {block.grapeColor && (
          <span
            className="absolute top-4 right-4 px-3 py-1.5 rounded-lg text-white text-sm font-bold"
            style={{ backgroundColor: COLOR_DOT[block.grapeColor] }}
          >
            {t(`vineyardBlocks.grapeColors.${block.grapeColor}`)}
          </span>
        )}
      </div>

      <Container className="py-6 -mt-6 relative">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{block.name}</h1>
                <p className="text-slate-600 mt-1">
                  {block.grapeVariety || "—"} · {year(block)}
                  {block.area != null ? ` · ${block.area} ha` : ""}
                </p>
              </div>
              <Link
                href={`/vineyards/add?id=${block.id}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700"
              >
                <Pencil size={16} />
                {t("common.edit")}
              </Link>
            </div>

            {block.notes && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {t("forms.vineyardBlock.notesLabel")}
                </h2>
                <p className="text-slate-700 whitespace-pre-wrap">{block.notes}</p>
              </div>
            )}

            {block.location?.address && (
              <div>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {t("vineyardBlocks.location")}
                </h2>
                <p className="text-slate-700">{block.location.address}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            href="/vineyards"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">{t("vineyards.backToList")}</span>
          </Link>
        </div>
      </Container>
    </div>
  );
}
