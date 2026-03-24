"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { financeService } from "@/services/finance";
import type { FinanceEntry } from "@/types/finance";
import Container from "@/components/Container";
import { ArrowLeft, Plus, DollarSign } from "lucide-react";

export default function FinanceClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/finance");
  }, [ready, user, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await financeService.getUserFinanceEntries(user.uid);
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const e of entries) {
      if (e.type === "income") income += e.amount;
      else expense += e.amount;
    }
    return { income, expense, total: income - expense };
  }, [entries]);

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
            href="/finance/add"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700"
          >
            <Plus size={18} />
            {t("finance.actions.addEntry")}
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          {t("finance.title")}
        </h1>

        {!loading && entries.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-medium text-emerald-700">{t("finance.income")}</p>
              <p className="text-lg font-bold text-emerald-800">₾{summary.income.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
              <p className="text-xs font-medium text-red-700">{t("finance.expense")}</p>
              <p className="text-lg font-bold text-red-800">₾{summary.expense.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200">
              <p className="text-xs font-medium text-slate-600">Net</p>
              <p className={`text-lg font-bold ${summary.total >= 0 ? "text-emerald-800" : "text-red-800"}`}>
                ₾{summary.total.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-pulse text-slate-500">Loading entries…</div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
              <DollarSign size={36} className="text-slate-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              {t("finance.empty")}
            </h2>
            <p className="text-slate-600 mb-6">{t("finance.emptySubtext")}</p>
            <Link
              href="/finance/add"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
            >
              <Plus size={18} />
              {t("finance.actions.addEntry")}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((e) => (
              <Link
                key={e.id}
                href={`/finance/detail?id=${e.id}`}
                className="block p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {t(`finance.categories.${e.category}`)}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {new Date(e.date).toLocaleDateString()} · {t(`finance.${e.type}`)}
                    </p>
                  </div>
                  <span
                    className={`font-bold ${
                      e.type === "income" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {e.type === "income" ? "+" : "-"}₾{e.amount.toLocaleString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
