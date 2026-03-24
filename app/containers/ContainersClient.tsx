"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { containersService } from "@/services/containers";
import type { Container } from "@/types/firestore";
import Container from "@/components/Container";
import { ArrowLeft, Plus, Box } from "lucide-react";

export default function ContainersClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/containers");
  }, [ready, user, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await containersService.getUserContainers(user.uid);
      setContainers(data);
    } catch {
      setContainers([]);
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
            href="/containers/add"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700"
          >
            <Plus size={18} />
            {t("containers.createContainer")}
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          {t("containers.title")}
        </h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-pulse text-slate-500">Loading containers…</div>
          </div>
        ) : containers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
              <Box size={36} className="text-slate-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              {t("containers.empty")}
            </h2>
            <p className="text-slate-600 mb-6">{t("containers.emptySubtext")}</p>
            <Link
              href="/containers/add"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
            >
              <Plus size={18} />
              {t("containers.createContainer")}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {containers.map((c) => (
              <Link
                key={c.id}
                href={`/containers/detail?id=${c.id}`}
                className="block p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{c.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {t(`containers.types.${c.type}`)} · {c.capacity} {c.unit}
                    </p>
                    <span className="inline-block mt-2 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                      {t(`containers.statuses.${c.status}`)}
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
