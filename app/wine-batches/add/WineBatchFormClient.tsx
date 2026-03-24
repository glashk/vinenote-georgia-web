"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { wineBatchesService } from "@/services/wineBatches";
import { harvestsService } from "@/services/harvests";
import { containersService } from "@/services/containers";
import type { WineBatch } from "@/types/firestore";
import Container from "@/components/Container";
import { ArrowLeft } from "lucide-react";

const STATUSES: WineBatch["status"][] = ["fermenting", "aging", "bottled", "completed", "discarded"];

export default function WineBatchFormClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const harvestIdParam = searchParams.get("harvestId");
  const isEdit = !!id;

  const [name, setName] = useState("");
  const [vintage, setVintage] = useState("");
  const [grapeVariety, setGrapeVariety] = useState("");
  const [harvestId, setHarvestId] = useState("");
  const [containerId, setContainerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [volume, setVolume] = useState("");
  const [status, setStatus] = useState<WineBatch["status"]>("fermenting");
  const [alcoholContent, setAlcoholContent] = useState("");
  const [pH, setPH] = useState("");
  const [notes, setNotes] = useState("");
  const [harvests, setHarvests] = useState<{ id: string; date: string; quantity: number; unit: string }[]>([]);
  const [containers, setContainers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/wine-batches/add");
  }, [ready, user, router]);

  useEffect(() => {
    if (user) {
      Promise.all([
        harvestsService.getUserHarvests(user.uid),
        containersService.getUserContainers(user.uid),
      ]).then(([h, c]) => {
        setHarvests(h.map((x) => ({ id: x.id, date: x.date, quantity: x.quantity, unit: x.unit })));
        setContainers(c.map((x) => ({ id: x.id, name: x.name })));
      });
    }
  }, [user]);

  useEffect(() => {
    if (harvestIdParam && !isEdit) setHarvestId(harvestIdParam);
  }, [harvestIdParam, isEdit]);

  useEffect(() => {
    if (isEdit && id && user) {
      wineBatchesService
        .getWineBatch(user.uid, id)
        .then((b) => {
          if (b) {
            setName(b.name || "");
            setVintage(b.vintage ? String(b.vintage) : "");
            setGrapeVariety(b.grapeVariety || "");
            setHarvestId(b.harvestId || "");
            setContainerId(b.containerId || "");
            setStartDate(b.startDate ? b.startDate.slice(0, 10) : "");
            setVolume(String(b.volume || ""));
            setStatus(b.status || "fermenting");
            setAlcoholContent(b.alcoholContent != null ? String(b.alcoholContent) : "");
            setPH(b.pH != null ? String(b.pH) : "");
            setNotes(b.notes || "");
          } else {
            router.replace("/wine-batches");
          }
        })
        .catch(() => router.replace("/wine-batches"))
        .finally(() => setInitialLoading(false));
    }
  }, [isEdit, id, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    if (!name.trim()) {
      setError(t("forms.nameRequired"));
      return;
    }
    if (!startDate) {
      setError(t("forms.nameRequired"));
      return;
    }
    const vol = Number(volume);
    if (isNaN(vol) || vol <= 0) {
      setError(t("forms.validation.positiveNumber"));
      return;
    }
    const v = vintage ? Number(vintage) : undefined;
    if (vintage && (isNaN(v!) || v! < 1900 || v! > 2100)) {
      setError(t("forms.validation.invalidYear"));
      return;
    }
    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        vintage: v,
        grapeVariety: grapeVariety.trim() || undefined,
        harvestId: harvestId || undefined,
        containerId: containerId || undefined,
        startDate,
        volume: vol,
        status,
        alcoholContent: alcoholContent ? Number(alcoholContent) : undefined,
        pH: pH ? Number(pH) : undefined,
        notes: notes.trim() || undefined,
      };
      if (isEdit && id) {
        await wineBatchesService.updateWineBatch(user.uid, id, data);
      } else {
        await wineBatchesService.createWineBatch(user.uid, data);
      }
      router.push("/wine-batches");
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
          href="/wine-batches"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft size={20} />
          {t("wineBatches.title")}
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          {isEdit ? t("forms.wineBatch.editTitle") : t("forms.wineBatch.createTitle")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.wineBatch.nameLabel")} {t("forms.required")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("forms.wineBatch.namePlaceholder")}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("forms.wineBatch.vintageLabel")}
              </label>
              <input
                type="number"
                value={vintage}
                onChange={(e) => setVintage(e.target.value)}
                min="1900"
                max="2100"
                placeholder={t("forms.wineBatch.vintagePlaceholder")}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("forms.wineBatch.volumeLabel")} {t("forms.required")}
              </label>
              <input
                type="number"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                min="0"
                step="0.1"
                placeholder={t("forms.wineBatch.volumePlaceholder")}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.wineBatch.grapeVarietyLabel")}
            </label>
            <input
              type="text"
              value={grapeVariety}
              onChange={(e) => setGrapeVariety(e.target.value)}
              placeholder={t("forms.wineBatch.grapeVarietyPlaceholder")}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.wineBatch.harvestLabel")}
            </label>
            <select
              value={harvestId}
              onChange={(e) => setHarvestId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              <option value="">—</option>
              {harvests.map((h) => (
                <option key={h.id} value={h.id}>
                  {new Date(h.date).toLocaleDateString()} · {h.quantity} {h.unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.wineBatch.containerLabel")}
            </label>
            <select
              value={containerId}
              onChange={(e) => setContainerId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              <option value="">—</option>
              {containers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("wineBatches.startDateLabel")} {t("forms.required")}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.wineBatch.statusLabel")}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as WineBatch["status"])}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              {STATUSES.map((v) => (
                <option key={v} value={v}>
                  {t(`wineBatches.statuses.${v}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("forms.wineBatch.alcoholContentLabel")}
              </label>
              <input
                type="number"
                value={alcoholContent}
                onChange={(e) => setAlcoholContent(e.target.value)}
                min="0"
                max="25"
                step="0.1"
                placeholder={t("forms.wineBatch.alcoholContentPlaceholder")}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("forms.wineBatch.phLabel")}
              </label>
              <input
                type="number"
                value={pH}
                onChange={(e) => setPH(e.target.value)}
                min="0"
                max="14"
                step="0.1"
                placeholder={t("forms.wineBatch.phPlaceholder")}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.wineBatch.notesLabel")}
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
              href="/wine-batches"
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
