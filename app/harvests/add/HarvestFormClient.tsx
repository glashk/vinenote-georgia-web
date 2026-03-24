"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { harvestsService } from "@/services/harvests";
import { vineyardBlocksService } from "@/services/vineyardBlocks";
import { containersService } from "@/services/containers";
import type { VineyardBlock } from "@/types/vineyard";
import type { Container } from "@/types/firestore";
import type { Harvest } from "@/types/firestore";
import Container from "@/components/Container";
import { ArrowLeft } from "lucide-react";

const UNITS: Harvest["unit"][] = ["kg", "tons", "lbs"];
const QUALITIES: Harvest["quality"][] = ["excellent", "good", "fair", "poor"];

export default function HarvestFormClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isEdit = !!id;

  const [vineyardBlocks, setVineyardBlocks] = useState<VineyardBlock[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [vineyardBlockId, setVineyardBlockId] = useState("");
  const [date, setDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<Harvest["unit"]>("kg");
  const [sugarLevel, setSugarLevel] = useState("");
  const [containerId, setContainerId] = useState("");
  const [grapeVariety, setGrapeVariety] = useState("");
  const [quality, setQuality] = useState<Harvest["quality"] | "">("");
  const [weatherConditions, setWeatherConditions] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/harvests/add");
  }, [ready, user, router]);

  useEffect(() => {
    if (user) {
      Promise.all([
        vineyardBlocksService.getUserVineyardBlocks(user.uid),
        containersService.getUserContainers(user.uid),
      ]).then(([b, c]) => {
        setVineyardBlocks(b);
        setContainers(c);
      });
    }
  }, [user]);

  useEffect(() => {
    if (isEdit && id && user) {
      harvestsService
        .getHarvest(user.uid, id)
        .then((h) => {
          if (h) {
            setVineyardBlockId(h.vineyardBlockId || "");
            setDate(h.date ? h.date.slice(0, 10) : "");
            setQuantity(String(h.quantity || ""));
            setUnit(h.unit || "kg");
            setSugarLevel(h.sugarBrix != null ? String(h.sugarBrix) : "");
            setContainerId(h.containers?.[0] || "");
            setGrapeVariety(h.grapeVariety || "");
            setQuality(h.quality || "");
            setWeatherConditions(h.weatherConditions || "");
            setNotes(h.notes || "");
          } else {
            router.replace("/harvests");
          }
        })
        .catch(() => router.replace("/harvests"))
        .finally(() => setInitialLoading(false));
    }
  }, [isEdit, id, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    if (!vineyardBlockId) {
      setError(t("forms.nameRequired"));
      return;
    }
    if (!date) {
      setError(t("forms.nameRequired"));
      return;
    }
    const q = Number(quantity);
    if (isNaN(q) || q <= 0) {
      setError(t("forms.validation.positiveNumber"));
      return;
    }
    setLoading(true);
    try {
      const data = {
        vineyardBlockId,
        date,
        quantity: q,
        unit,
        sugarBrix: sugarLevel ? Number(sugarLevel) : undefined,
        containers: containerId ? [containerId] : undefined,
        grapeVariety: grapeVariety.trim() || undefined,
        quality: quality || undefined,
        weatherConditions: weatherConditions.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      if (isEdit && id) {
        await harvestsService.updateHarvest(user.uid, id, data);
      } else {
        await harvestsService.createHarvest(user.uid, data);
      }
      router.push("/harvests");
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
          href="/harvests"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft size={20} />
          {t("harvests.title")}
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          {isEdit ? t("forms.harvest.editTitle") : t("forms.harvest.createTitle")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.harvest.vineyardBlockLabel")} {t("forms.required")}
            </label>
            <select
              value={vineyardBlockId}
              onChange={(e) => setVineyardBlockId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              <option value="">{t("common.all")}</option>
              {vineyardBlocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.grapeVariety ? `(${b.grapeVariety})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.harvest.dateLabel")} {t("forms.required")}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("forms.harvest.quantityKgLabel")} {t("forms.required")}
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("forms.harvest.unitLabel")}
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Harvest["unit"])}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {t(`harvests.units.${u}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.harvest.sugarLevelLabel")}
            </label>
            <input
              type="number"
              value={sugarLevel}
              onChange={(e) => setSugarLevel(e.target.value)}
              min="0"
              max="30"
              step="0.1"
              placeholder={t("forms.harvest.sugarLevelPlaceholder")}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.harvest.destinationContainerLabel")}
            </label>
            <select
              value={containerId}
              onChange={(e) => setContainerId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              <option value="">—</option>
              {containers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({t(`containers.types.${c.type}`)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.harvest.grapeVarietyLabel")}
            </label>
            <input
              type="text"
              value={grapeVariety}
              onChange={(e) => setGrapeVariety(e.target.value)}
              placeholder={t("forms.harvest.grapeVarietyPlaceholder")}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.harvest.qualityLabel")}
            </label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as Harvest["quality"] | "")}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              <option value="">—</option>
              {QUALITIES.map((q) => (
                <option key={q} value={q}>
                  {t(`harvests.qualities.${q}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("harvests.weatherLabel")}
            </label>
            <input
              type="text"
              value={weatherConditions}
              onChange={(e) => setWeatherConditions(e.target.value)}
              placeholder="e.g. Sunny, 25°C"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.harvest.notesLabel")}
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
              href="/harvests"
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
