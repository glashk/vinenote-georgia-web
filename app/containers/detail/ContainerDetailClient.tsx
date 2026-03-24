"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { containersService } from "@/services/containers";
import type { Container } from "@/types/firestore";
import Container from "@/components/Container";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

export default function ContainerDetailClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [container, setContainer] = useState<Container | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/containers/detail");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user || !id) {
      if (!id) router.replace("/containers");
      setLoading(false);
      return;
    }
    containersService
      .getContainer(user.uid, id)
      .then(setContainer)
      .catch(() => setContainer(null))
      .finally(() => setLoading(false));
  }, [user, id]);

  const handleDelete = async () => {
    if (!user || !id || !confirm(t("common.deleteConfirm"))) return;
    setDeleting(true);
    try {
      await containersService.deleteContainer(user.uid, id);
      router.push("/containers");
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

  if (!container) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-600">{t("containerDetail.notFound")}</p>
        <Link href="/containers" className="text-emerald-600 font-semibold">
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
            href="/containers"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={20} />
            {t("containers.title")}
          </Link>
          <div className="flex gap-2">
            <Link
              href={`/containers/add?id=${id}`}
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
          <h1 className="text-2xl font-bold text-slate-900 mb-4">{container.name}</h1>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">{t("forms.container.typeLabel")}:</span>{" "}
              {t(`containers.types.${container.type}`)}
            </p>
            <p>
              <span className="text-slate-500">{t("forms.container.capacityLabel")}:</span>{" "}
              {container.capacity} {t(`containers.units.${container.unit}`)}
            </p>
            {container.material && (
              <p>
                <span className="text-slate-500">{t("forms.container.materialLabel")}:</span>{" "}
                {t(`containers.materials.${container.material}`)}
              </p>
            )}
            {container.location && (
              <p>
                <span className="text-slate-500">{t("forms.container.locationLabel")}:</span> {container.location}
              </p>
            )}
            <p>
              <span className="text-slate-500">{t("forms.container.statusLabel")}:</span>{" "}
              <span className="font-medium">
                {t(`containers.statuses.${container.status}`)}
              </span>
            </p>
            {container.notes && (
              <p className="pt-2">
                <span className="text-slate-500">{t("forms.container.notesLabel")}:</span>
                <br />
                <span className="text-slate-700">{container.notes}</span>
              </p>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
