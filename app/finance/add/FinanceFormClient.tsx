"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { financeService } from "@/services/finance";
import type { FinanceCategory, FinanceType } from "@/types/finance";
import Container from "@/components/Container";
import { ArrowLeft } from "lucide-react";

const TYPES: FinanceType[] = ["income", "expense"];
const INCOME_CATEGORIES: FinanceCategory[] = ["wine_sales", "grape_sales", "other"];
const EXPENSE_CATEGORIES: FinanceCategory[] = ["materials", "salary", "transport", "utilities", "other"];

export default function FinanceFormClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isEdit = !!id;

  const [type, setType] = useState<FinanceType>("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<FinanceCategory>("wine_sales");
  useEffect(() => {
    if (type === "income" && !INCOME_CATEGORIES.includes(category)) {
      setCategory("wine_sales");
    } else if (type === "expense" && !EXPENSE_CATEGORIES.includes(category)) {
      setCategory("materials");
    }
  }, [type, category]);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/finance/add");
  }, [ready, user, router]);

  useEffect(() => {
    if (isEdit && id && user) {
      financeService
        .getFinanceEntry(user.uid, id)
        .then((e) => {
          if (e) {
            setType(e.type);
            setAmount(String(e.amount));
            setCategory(e.category);
            setDate(e.date ? e.date.toString().slice(0, 10) : "");
            setNotes(e.notes || "");
          } else {
            router.replace("/finance");
          }
        })
        .catch(() => router.replace("/finance"))
        .finally(() => setInitialLoading(false));
    }
  }, [isEdit, id, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      setError(t("forms.validation.positiveNumber"));
      return;
    }
    if (!date) {
      setError(t("forms.nameRequired"));
      return;
    }
    setLoading(true);
    try {
      const input = { type, amount: amt, category, date, notes: notes.trim() || undefined };
      if (isEdit && id) {
        await financeService.updateFinanceEntry(user.uid, id, input);
      } else {
        await financeService.createFinanceEntry(user.uid, input);
      }
      router.push("/finance");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  if (!ready || !user) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading…</div>
      </div>
    );
  }

  if (isEdit && initialLoading) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <Container className="py-6 sm:py-8">
        <Link
          href="/finance"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft size={20} />
          {t("finance.title")}
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          {isEdit ? t("finance.form.editTitle") : t("finance.form.title")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("finance.form.type")} {t("forms.required")}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FinanceType)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              {TYPES.map((v) => (
                <option key={v} value={v}>
                  {t(`finance.${v}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("finance.form.amount")} (₾) {t("forms.required")}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              placeholder={t("finance.form.amountPlaceholder")}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("finance.form.category")} {t("forms.required")}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FinanceCategory)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              {(type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((v) => (
                <option key={v} value={v}>
                  {t(`finance.categories.${v}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("finance.form.date")} {t("forms.required")}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("finance.form.notes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? t("common.processing") : t("common.save")}
            </button>
            <Link
              href="/finance"
              className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50"
            >
              {t("common.cancel")}
            </Link>
          </div>
        </form>
      </Container>
    </div>
  );
}
