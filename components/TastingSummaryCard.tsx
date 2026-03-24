"use client";

import type { WineTasting } from "@/types/firestore";
import { useLanguage } from "@/contexts/LanguageContext";
import { Wine } from "lucide-react";

function hasAnyTastingData(t: WineTasting): boolean {
  return !!(
    t.aroma ||
    t.taste ||
    t.color ||
    (t.acidity != null && t.acidity > 0) ||
    (t.tannin != null && t.tannin > 0) ||
    (t.body != null && t.body > 0) ||
    (t.rating != null && t.rating > 0) ||
    t.note
  );
}

export function TastingSummaryCard({ tasting }: { tasting: WineTasting }) {
  const { t } = useLanguage();

  if (!hasAnyTastingData(tasting)) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-4">
        <Wine size={22} className="text-emerald-700" />
        <span className="font-semibold text-slate-900">{t("tasting.title")}</span>
      </div>

      {(tasting.aroma || tasting.taste) && (
        <div className="space-y-2 mb-4">
          {tasting.aroma && (
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">
                {t("tasting.aroma")}
              </span>
              <p className="text-sm text-slate-700 mt-0.5">{tasting.aroma}</p>
            </div>
          )}
          {tasting.taste && (
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">
                {t("tasting.taste")}
              </span>
              <p className="text-sm text-slate-700 mt-0.5">{tasting.taste}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-4">
        {tasting.color && (
          <div>
            <span className="text-xs text-slate-500">{t("tasting.color")}: </span>
            <span className="text-sm font-semibold text-emerald-700">
              {t(`tasting.colors.${tasting.color}`)}
            </span>
          </div>
        )}
        {tasting.acidity != null && tasting.acidity > 0 && (
          <div>
            <span className="text-xs text-slate-500">{t("tasting.acidity")}: </span>
            <span className="text-sm font-semibold text-emerald-700">
              {tasting.acidity}/5
            </span>
          </div>
        )}
        {tasting.tannin != null && tasting.tannin > 0 && (
          <div>
            <span className="text-xs text-slate-500">{t("tasting.tannin")}: </span>
            <span className="text-sm font-semibold text-emerald-700">
              {tasting.tannin}/5
            </span>
          </div>
        )}
        {tasting.body != null && tasting.body > 0 && (
          <div>
            <span className="text-xs text-slate-500">{t("tasting.body")}: </span>
            <span className="text-sm font-semibold text-emerald-700">
              {tasting.body}/5
            </span>
          </div>
        )}
      </div>

      {tasting.rating != null && tasting.rating > 0 && (
        <div className="mb-4">
          <span className="text-xs font-semibold text-slate-500 uppercase">
            {t("tasting.overallRating")}
          </span>
          <div className="flex gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-lg ${
                  tasting.rating! >= star ? "text-amber-500" : "text-slate-300"
                }`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      )}

      {tasting.note && (
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">
            {t("tasting.note")}
          </span>
          <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">
            {tasting.note}
          </p>
        </div>
      )}
    </div>
  );
}
