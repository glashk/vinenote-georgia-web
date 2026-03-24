"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getWineBatchTimeline,
  addNoteToWineBatchStage,
  addFermentationEvent,
} from "@/services/wineBatchHistory";
import { wineBatchesService } from "@/services/wineBatches";
import type {
  WineBatch,
  WineBatchStage,
  WineTasting,
  FermentationEventType,
} from "@/types/firestore";
import Container from "@/components/Container";
import { FermentationTimeline } from "@/components/FermentationTimeline";
import { TastingForm } from "@/components/TastingForm";
import { TastingSummaryCard } from "@/components/TastingSummaryCard";
import { ArrowLeft, Pencil, Trash2, Plus, X } from "lucide-react";

const EVENT_TYPES: FermentationEventType[] = [
  "created",
  "sugar_measurement",
  "racking",
  "notes",
  "bottling",
];

const REMINDER_TYPES = ["checkFermentation", "racking", "bottling"] as const;

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function WineBatchDetailClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [batch, setBatch] = useState<WineBatch | null>(null);
  const [timeline, setTimeline] = useState<WineBatchStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedStage, setSelectedStage] = useState<WineBatchStage["stage"] | null>(null);
  const [newNote, setNewNote] = useState("");
  const [addEventModal, setAddEventModal] = useState(false);
  const [newEventType, setNewEventType] = useState<FermentationEventType>("notes");
  const [newEventDate, setNewEventDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [newEventNote, setNewEventNote] = useState("");
  const [editingTasting, setEditingTasting] = useState(false);
  const [tastingFormData, setTastingFormData] = useState<Partial<WineTasting>>({});
  const [photoViewerIndex, setPhotoViewerIndex] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user || !id) return;
    try {
      setLoading(true);
      const data = await getWineBatchTimeline(user.uid, id);
      setBatch(data.batch);
      setTimeline(data.timeline);
    } catch {
      setBatch(null);
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/wine-batches/detail");
  }, [ready, user, router]);

  useEffect(() => {
    if (user && id) loadData();
  }, [user, id, loadData]);

  const handleAddNote = async () => {
    if (!user || !batch || !selectedStage || !newNote.trim()) return;
    setSaving(true);
    try {
      await addNoteToWineBatchStage(user.uid, batch.id, selectedStage, newNote.trim());
      const data = await getWineBatchTimeline(user.uid, batch.id);
      setTimeline(data.timeline);
      setNewNote("");
      setSelectedStage(null);
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  };

  const handleAddEvent = async () => {
    if (!user || !batch) return;
    setSaving(true);
    try {
      await addFermentationEvent(user.uid, batch.id, {
        type: newEventType,
        date: newEventDate,
        note: newEventNote.trim() || undefined,
      });
      const data = await getWineBatchTimeline(user.uid, batch.id);
      setBatch(data.batch);
      setAddEventModal(false);
      setNewEventType("notes");
      setNewEventDate(new Date().toISOString().slice(0, 10));
      setNewEventNote("");
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTasting = async () => {
    if (!user || !batch) return;
    setSaving(true);
    try {
      await wineBatchesService.updateWineBatch(user.uid, batch.id, {
        tasting: tastingFormData,
      });
      setBatch((prev) => (prev ? { ...prev, tasting: tastingFormData } : null));
      setEditingTasting(false);
      setTastingFormData({});
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePhoto = async (index: number) => {
    if (!user || !batch || !confirm(t("wineBatchDetail.photos.removeConfirm"))) return;
    const photos = batch.photos ?? [];
    if (index < 0 || index >= photos.length) return;
    setSaving(true);
    try {
      const updated = photos.filter((_, i) => i !== index);
      await wineBatchesService.updateWineBatch(user.uid, batch.id, { photos: updated });
      setBatch((prev) => (prev ? { ...prev, photos: updated } : null));
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!batch || !user) return;
    setExporting(true);
    try {
      const html = generatePDFHTML(batch, timeline, t);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wine-batch-${batch.name.replace(/\s+/g, "-")}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !id || !confirm(t("common.deleteConfirm"))) return;
    setDeleting(true);
    try {
      await wineBatchesService.deleteWineBatch(user.uid, id);
      router.push("/wine-batches");
    } catch {
      setDeleting(false);
    }
  };

  const getStageLabel = (stage: WineBatchStage["stage"]) => {
    switch (stage) {
      case "vineyard":
        return t("wineBatchDetail.vineyard");
      case "harvest":
        return t("wineBatchDetail.harvest");
      case "container":
        return t("wineBatchDetail.container");
      case "status":
        return t("common.status");
      default:
        return stage;
    }
  };

  const getStageIcon = (stage: WineBatchStage["stage"]) => {
    switch (stage) {
      case "vineyard":
        return "🌱";
      case "harvest":
        return "🍇";
      case "container":
        return "🪣";
      case "status":
        return "📊";
      default:
        return "•";
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

  if (!batch) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-600">{t("wineBatchDetail.notFound")}</p>
        <Link href="/wine-batches" className="text-emerald-600 font-semibold">
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
            href="/wine-batches"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={20} />
            {t("wineBatches.title")}
          </Link>
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/wine-batches/add?id=${id}`}
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

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
            {batch.name}
          </h1>
          {batch.vintage && (
            <p className="text-slate-600">
              {t("wineBatches.vintageLabel")}: {batch.vintage}
            </p>
          )}
          {batch.grapeVariety && (
            <p className="text-slate-600">{batch.grapeVariety}</p>
          )}
        </div>

        {/* Export PDF */}
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="w-full mb-6 py-3 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 disabled:opacity-50"
        >
          {exporting ? "Exporting…" : `📄 ${t("wineBatchDetail.exportPdf")}`}
        </button>

        {/* Photos */}
        <section className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {t("wineBatchDetail.photos.title")}
            </h2>
          </div>
          {(batch.photos?.length ?? 0) > 0 ? (
            <div className="flex flex-wrap gap-4">
              {batch.photos!.map((photo, idx) => (
                <div key={idx} className="relative group">
                  <button
                    onClick={() => setPhotoViewerIndex(idx)}
                    className="block w-24 h-24 rounded-xl overflow-hidden border border-slate-200"
                  >
                    <Image
                      src={photo.url}
                      alt=""
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  </button>
                  {photo.uploadedAt && (
                    <span className="text-xs text-slate-500 block mt-1">
                      {new Date(photo.uploadedAt).toLocaleDateString()}
                    </span>
                  )}
                  <button
                    onClick={() => handleRemovePhoto(idx)}
                    disabled={saving}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">
              {t("wineBatchDetail.photos.empty")}
            </p>
          )}
        </section>

        {/* Fermentation Timeline */}
        <section className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {t("wineBatchDetail.fermentTimeline")}
            </h2>
            <button
              onClick={() => setAddEventModal(true)}
              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded-lg"
              aria-label={t("wineBatchDetail.addEvent")}
            >
              <Plus size={28} />
            </button>
          </div>
          <FermentationTimeline
            events={batch.events || []}
            getEventTitle={(type) => t(`wineBatchDetail.eventTypes.${type}`)}
            emptyText={t("wineBatchDetail.noEventsYet")}
          />
        </section>

        {/* Reminders */}
        <section className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            {t("wineBatchDetail.reminders.title")}
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            {t("wineBatchDetail.reminders.subtext")}
          </p>
          <div className="space-y-3">
            {REMINDER_TYPES.map((type) => {
              const reminder = batch.reminders?.[type];
              return (
                <div
                  key={type}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <span className="font-semibold text-slate-900">
                      {t(`wineBatchDetail.reminders.${type}.label`)}
                    </span>
                    {reminder && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {typeof reminder === "object" && reminder.scheduledAt
                          ? `${t("wineBatchDetail.reminders.scheduledFor").replace("{{date}}", formatDate(reminder.scheduledAt))}`
                          : t("wineBatchDetail.reminders.scheduled")}
                      </p>
                    )}
                  </div>
                  {reminder ? (
                    <span className="text-sm text-slate-500">
                      {t("wineBatchDetail.reminders.cancel")}
                    </span>
                  ) : (
                    <span className="text-sm text-emerald-600 font-semibold">
                      {t("wineBatchDetail.reminders.schedule")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Timeline */}
        <section className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {t("wineBatchDetail.timeline")}
          </h2>
          <div className="space-y-5">
            {timeline.map((stage, index) => (
              <div key={index} className="flex gap-4">
                <div className="text-2xl">{getStageIcon(stage.stage)}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-900">
                      {getStageLabel(stage.stage)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDate(stage.date)}
                    </span>
                  </div>
                  {stage.data?.vineyardBlockName && (
                    <p className="text-sm text-slate-600">
                      {t("wineBatchDetail.vineyard")}: {stage.data.vineyardBlockName}
                    </p>
                  )}
                  {stage.data?.containerName && (
                    <p className="text-sm text-slate-600">
                      {t("wineBatchDetail.container")}: {stage.data.containerName}
                    </p>
                  )}
                  {stage.data?.status && (
                    <p className="text-sm text-slate-600">
                      {t("common.status")}:{" "}
                      {t(`wineBatches.statuses.${stage.data.status}`)}
                    </p>
                  )}
                  {stage.notes && (
                    <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">
                      {stage.notes}
                    </p>
                  )}
                  <button
                    onClick={() => setSelectedStage(stage.stage)}
                    className="mt-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    + {t("wineBatchDetail.addNote")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Add Note */}
        {selectedStage && (
          <section className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {t("wineBatchDetail.addNoteTo", {
                stage: getStageLabel(selectedStage),
              })}
            </h2>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={t("wineBatchDetail.enterNote")}
              rows={4}
              disabled={saving}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedStage(null);
                  setNewNote("");
                }}
                disabled={saving}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-emerald-700 font-semibold"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || saving}
                className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-semibold disabled:opacity-50"
              >
                {saving ? "…" : t("wineBatchDetail.saveNote")}
              </button>
            </div>
          </section>
        )}

        {/* Batch Info */}
        <section className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {t("wineBatchDetail.batchInformation")}
          </h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">{t("wineBatchDetail.labels.volume")}:</span>{" "}
              {batch.volume}L
            </p>
            <p>
              <span className="text-slate-500">{t("wineBatchDetail.labels.status")}:</span>{" "}
              {t(`wineBatches.statuses.${batch.status}`)}
            </p>
            {batch.alcoholContent != null && (
              <p>
                <span className="text-slate-500">{t("wineBatchDetail.labels.alcohol")}:</span>{" "}
                {batch.alcoholContent}%
              </p>
            )}
            {batch.pH != null && (
              <p>
                <span className="text-slate-500">{t("wineBatchDetail.labels.ph")}:</span>{" "}
                {batch.pH}
              </p>
            )}
            {batch.startDate && (
              <p>
                <span className="text-slate-500">{t("wineBatchDetail.labels.startDate")}:</span>{" "}
                {formatDate(batch.startDate)}
              </p>
            )}
            {batch.endDate && (
              <p>
                <span className="text-slate-500">{t("wineBatchDetail.labels.endDate")}:</span>{" "}
                {formatDate(batch.endDate)}
              </p>
            )}
          </div>
        </section>

        {/* Tasting */}
        <section className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {t("tasting.title")}
            </h2>
            {!editingTasting && (
              <button
                onClick={() => {
                  setTastingFormData(batch.tasting ?? {});
                  setEditingTasting(true);
                }}
                className="p-1 text-emerald-700 hover:bg-emerald-50 rounded-lg"
              >
                {batch.tasting ? t("tasting.edit") : t("tasting.add")}
              </button>
            )}
          </div>
          {editingTasting ? (
            <>
              <TastingForm
                value={tastingFormData}
                onChange={setTastingFormData}
                editable={!saving}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setEditingTasting(false);
                    setTastingFormData({});
                  }}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-emerald-700 font-semibold"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleSaveTasting}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-semibold disabled:opacity-50"
                >
                  {saving ? "…" : t("common.save")}
                </button>
              </div>
            </>
          ) : batch.tasting ? (
            <TastingSummaryCard tasting={batch.tasting} />
          ) : (
            <p className="text-sm text-slate-500 italic">{t("tasting.empty")}</p>
          )}
        </section>

        {/* General Notes */}
        {batch.notes && (
          <section className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              {t("wineBatchDetail.generalNotes")}
            </h2>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{batch.notes}</p>
          </section>
        )}

        {/* Add Event Modal */}
        {addEventModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setAddEventModal(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                {t("wineBatchDetail.addEvent")}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    {t("wineBatchDetail.eventTypeLabel")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewEventType(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                          newEventType === type
                            ? "bg-emerald-700 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {t(`wineBatchDetail.eventTypes.${type}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    {t("wineBatchDetail.dateLabel")}
                  </label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    {t("wineBatchDetail.enterNote")}
                  </label>
                  <textarea
                    value={newEventNote}
                    onChange={(e) => setNewEventNote(e.target.value)}
                    placeholder={t("wineBatchDetail.eventNotePlaceholder")}
                    rows={3}
                    disabled={saving}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setAddEventModal(false)}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-emerald-700 font-semibold"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleAddEvent}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-semibold disabled:opacity-50"
                >
                  {saving ? "…" : t("wineBatchDetail.saveEvent")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photo viewer modal */}
        {photoViewerIndex != null && batch.photos?.[photoViewerIndex] && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
            onClick={() => setPhotoViewerIndex(null)}
          >
            <Image
              src={batch.photos[photoViewerIndex].url}
              alt=""
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </Container>
    </div>
  );
}

function generatePDFHTML(
  batch: WineBatch,
  timeline: WineBatchStage[],
  t: (key: string, opts?: Record<string, string>) => string
): string {
  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
    h1 { color: #000; border-bottom: 2px solid #000; padding-bottom: 10px; }
    h2 { color: #333; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; display: inline-block; width: 150px; }
    .timeline-item { margin: 15px 0; padding: 10px; border-left: 3px solid #2d5a27; padding-left: 15px; }
    .timeline-stage { font-weight: bold; color: #2d5a27; }
    .timeline-date { color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${batch.name}</h1>
  ${batch.vintage ? `<p><strong>${t("wineBatches.vintageLabel")}:</strong> ${batch.vintage}</p>` : ""}
  ${batch.grapeVariety ? `<p><strong>${t("harvests.grapeVarietyLabel")}:</strong> ${batch.grapeVariety}</p>` : ""}
  <h2>${t("wineBatchDetail.batchInformation")}</h2>
  <div class="info-row"><span class="label">${t("wineBatchDetail.labels.volume")}:</span> ${batch.volume}L</div>
  <div class="info-row"><span class="label">${t("wineBatchDetail.labels.status")}:</span> ${t(`wineBatches.statuses.${batch.status}`)}</div>
  ${batch.alcoholContent != null ? `<div class="info-row"><span class="label">${t("wineBatchDetail.labels.alcohol")}:</span> ${batch.alcoholContent}%</div>` : ""}
  ${batch.pH != null ? `<div class="info-row"><span class="label">${t("wineBatchDetail.labels.ph")}:</span> ${batch.pH}</div>` : ""}
  ${batch.startDate ? `<div class="info-row"><span class="label">${t("wineBatchDetail.labels.startDate")}:</span> ${formatDate(batch.startDate)}</div>` : ""}
  ${batch.endDate ? `<div class="info-row"><span class="label">${t("wineBatchDetail.labels.endDate")}:</span> ${formatDate(batch.endDate)}</div>` : ""}
  <h2>${t("wineBatchDetail.fermentTimeline")}</h2>
  ${timeline.map((stage) => `
    <div class="timeline-item">
      <div class="timeline-stage">${t(`wineBatchDetail.${stage.stage}`)}</div>
      <div class="timeline-date">${formatDate(stage.date)}</div>
      ${stage.notes ? `<div>${stage.notes.replace(/\n/g, "<br>")}</div>` : ""}
    </div>
  `).join("")}
  ${batch.notes ? `<h2>${t("wineBatchDetail.generalNotes")}</h2><p>${batch.notes.replace(/\n/g, "<br>")}</p>` : ""}
  <p style="margin-top: 30px; color: #666; font-size: 12px;">Generated on ${new Date().toLocaleDateString()}</p>
</body>
</html>
  `.trim();
}
