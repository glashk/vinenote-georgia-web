"use client";

import type { WineTasting } from "@/types/firestore";
import { useLanguage } from "@/contexts/LanguageContext";

const COLOR_OPTIONS: NonNullable<WineTasting["color"]>[] = ["light", "medium", "deep"];

type Props = {
  value: Partial<WineTasting>;
  onChange: (tasting: Partial<WineTasting>) => void;
  editable?: boolean;
};

export function TastingForm({ value, onChange, editable = true }: Props) {
  const { t } = useLanguage();

  const update = (patch: Partial<WineTasting>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">
          {t("tasting.aroma")}
        </label>
        <textarea
          value={value.aroma ?? ""}
          onChange={(e) => update({ aroma: e.target.value })}
          placeholder={t("tasting.aromaPlaceholder")}
          rows={2}
          disabled={!editable}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 disabled:opacity-60"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">
          {t("tasting.taste")}
        </label>
        <textarea
          value={value.taste ?? ""}
          onChange={(e) => update({ taste: e.target.value })}
          placeholder={t("tasting.tastePlaceholder")}
          rows={2}
          disabled={!editable}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 disabled:opacity-60"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">
          {t("tasting.color")}
        </label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => editable && update({ color })}
              disabled={!editable}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                value.color === color
                  ? "bg-emerald-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {t(`tasting.colors.${color}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">
          {t("tasting.acidity")} ({(value.acidity ?? 3)}/5)
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={value.acidity ?? 3}
          onChange={(e) => update({ acidity: Number(e.target.value) })}
          disabled={!editable}
          className="w-full h-2 rounded-lg appearance-none bg-slate-200 accent-emerald-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">
          {t("tasting.tannin")} ({(value.tannin ?? 3)}/5)
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={value.tannin ?? 3}
          onChange={(e) => update({ tannin: Number(e.target.value) })}
          disabled={!editable}
          className="w-full h-2 rounded-lg appearance-none bg-slate-200 accent-emerald-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">
          {t("tasting.body")} ({(value.body ?? 3)}/5)
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={value.body ?? 3}
          onChange={(e) => update({ body: Number(e.target.value) })}
          disabled={!editable}
          className="w-full h-2 rounded-lg appearance-none bg-slate-200 accent-emerald-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">
          {t("tasting.overallRating")} ({(value.rating ?? 0)}/5 ★)
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => editable && update({ rating: star })}
              disabled={!editable}
              className={`text-2xl ${
                (value.rating ?? 0) >= star ? "text-amber-500" : "text-slate-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">
          {t("tasting.note")}
        </label>
        <textarea
          value={value.note ?? ""}
          onChange={(e) => update({ note: e.target.value })}
          placeholder={t("tasting.notePlaceholder")}
          rows={3}
          disabled={!editable}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 disabled:opacity-60"
        />
      </div>
    </div>
  );
}
