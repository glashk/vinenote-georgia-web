"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { financeService } from "@/services/finance";
import type { FinanceEntry } from "@/types/finance";
import Container from "@/components/Container";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

export default function FinanceDetailClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [entry, setEntry] = useState<FinanceEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/finance/detail");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user || !id) {
      if (!id) router.replace("/finance");
      setLoading(false);
      return;
    }
    financeService
      .getFinanceEntry(user.uid, id)
      .then(setEntry)
      .catch(() => setEntry(null))
      .finally(() => setLoading(false));
  }, [user, id]);

  const handleDelete = async () => {
    if (!user || !id || !confirm(t("common.deleteConfirm"))) return;
    setDeleting(true);
    try {
      await financeService.deleteFinanceEntry(user.uid, id);
      router.push("/finance");
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

  if (!entry) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-600">{t("finance.detail.notFound")}</p>
        <Link href="/finance" className="text-emerald-600 font-semibold">
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
            href="/finance"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={20} />
            {t("finance.title")}
          </Link>
          <div className="flex gap-2">
            <Link
              href={`/finance/add?id=${id}`}
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
            {t(`finance.categories.${entry.category}`)}
          </h1>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">{t("finance.form.amount")}:</span>{" "}
              <span
                className={`font-bold ${
                  entry.type === "income" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {entry.type === "income" ? "+" : "-"}₾{entry.amount.toLocaleString()}
              </span>
            </p>
            <p>
              <span className="text-slate-500">{t("finance.form.date")}:</span>{" "}
              {new Date(entry.date).toLocaleDateString()}
            </p>
            <p>
              <span className="text-slate-500">{t("finance.form.type")}:</span> {t(`finance.types.${entry.type}`)}
            </p>
            <p>
              <span className="text-slate-500">{t("finance.form.category")}:</span> {t(`finance.categories.${entry.category}`)}
            </p>
            {entry.notes && (
              <p className="pt-2">
                <span className="text-slate-500">{t("finance.form.notes")}:</span>
                <br />
                <span className="text-slate-700">{entry.notes}</span>
              </p>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
