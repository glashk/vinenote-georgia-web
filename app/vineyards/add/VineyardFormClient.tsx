"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { getFirebaseStorage } from "@/lib/firebase-app";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { vineyardBlocksService } from "@/services/vineyardBlocks";
import Container from "@/components/Container";
import { ArrowLeft, ImageIcon, Camera } from "lucide-react";

interface FormData {
  name: string;
  grapeVariety: string;
  grapeColor: "" | "red" | "white" | "amber";
  year: string;
  area: string;
  notes: string;
  photoUrl: string;
}

export default function VineyardFormClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isEdit = !!id;

  const [formData, setFormData] = useState<FormData>({
    name: "",
    grapeVariety: "",
    grapeColor: "",
    year: "",
    area: "",
    notes: "",
    photoUrl: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/vineyards/add");
  }, [ready, user, router]);

  useEffect(() => {
    if (isEdit && id && user) {
      vineyardBlocksService
        .getVineyardBlock(user.uid, id)
        .then((block) => {
          if (block) {
            const y = block.plantingDate
              ? typeof block.plantingDate === "string"
                ? new Date(block.plantingDate).getFullYear()
                : (block.plantingDate as Date).getFullYear()
              : "";
            setFormData({
              name: block.name || "",
              grapeVariety: block.grapeVariety || "",
              grapeColor: (block.grapeColor as FormData["grapeColor"]) || "",
              year: y ? String(y) : "",
              area: block.area?.toString() || "",
              notes: block.notes || "",
              photoUrl: block.photoUrl || "",
            });
          } else {
            router.replace("/vineyards");
          }
        })
        .catch(() => router.replace("/vineyards"))
        .finally(() => setInitialLoading(false));
    }
  }, [isEdit, id, user, router]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = t("forms.nameRequired");
    if (formData.year.trim()) {
      const y = Number(formData.year);
      if (isNaN(y) || y < 1900 || y > 2100) e.year = t("forms.validation.invalidYear");
    }
    if (formData.area && (isNaN(Number(formData.area)) || Number(formData.area) < 0)) {
      e.area = t("forms.validation.positiveNumber");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const uploadPhoto = useCallback(
    async (file: File) => {
      if (!user) return;
      const storage = await getFirebaseStorage();
      if (!storage) return;
      setUploadingPhoto(true);
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `vineyardBlocks/${user.uid}/${filename}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file, {
          cacheControl: "public,max-age=31536000,immutable",
          contentType: file.type || "image/jpeg",
        });
        const url = await getDownloadURL(storageRef);
        setFormData((prev) => ({ ...prev, photoUrl: url }));
      } catch (err) {
        console.error("Photo upload error:", err);
      } finally {
        setUploadingPhoto(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [user]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) return;
    setLoading(true);
    try {
      const blockData = {
        name: formData.name.trim(),
        grapeVariety: formData.grapeVariety.trim() || undefined,
        grapeColor: formData.grapeColor || undefined,
        plantingDate: formData.year.trim()
          ? new Date(`${formData.year.trim()}-01-01`).toISOString()
          : undefined,
        area: formData.area ? Number(formData.area) : undefined,
        notes: formData.notes.trim() || undefined,
        photoUrl: formData.photoUrl.trim() || undefined,
      };

      if (isEdit && id) {
        await vineyardBlocksService.updateVineyardBlock(user.uid, id, blockData);
        router.push(`/vineyards/detail?id=${id}`);
      } else {
        const newId = await vineyardBlocksService.createVineyardBlock(
          user.uid,
          blockData
        );
        router.push(`/vineyards/detail?id=${newId}`);
      }
    } catch (err) {
      console.error("Save error:", err);
      setErrors({ submit: t("vineyardBlocks.saveError") });
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

  if (initialLoading) {
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
          href={isEdit ? `/vineyards/${id}` : "/vineyards"}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">{t("common.cancel")}</span>
        </Link>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm"
        >
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {t("forms.vineyardBlock.photoLabel")}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadPhoto(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploadingPhoto}
              className="w-full h-44 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors overflow-hidden relative"
            >
              {formData.photoUrl ? (
                <div className="absolute inset-0">
                  <Image
                    src={formData.photoUrl}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <>
                  <ImageIcon size={40} className="text-slate-400" />
                  <span className="text-sm text-slate-500">
                    {uploadingPhoto ? t("vineyards.uploadingPhoto") : t("vineyards.uploadPhoto")}
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t("forms.vineyardBlock.nameLabel")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("forms.vineyardBlock.namePlaceholder")}
                className={`w-full px-4 py-3 rounded-xl border bg-slate-50 ${
                  errors.name ? "border-red-500" : "border-slate-200"
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t("forms.vineyardBlock.grapeVarietyLabel")}
              </label>
              <input
                type="text"
                value={formData.grapeVariety}
                onChange={(e) => setFormData({ ...formData, grapeVariety: e.target.value })}
                placeholder={t("forms.vineyardBlock.grapeVarietyPlaceholder")}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t("forms.vineyardBlock.grapeColorLabel")}
              </label>
              <div className="flex flex-wrap gap-2">
                {(["red", "white", "amber"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        grapeColor: formData.grapeColor === c ? "" : c,
                      })
                    }
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border font-medium ${
                      formData.grapeColor === c
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          c === "red" ? "#8b1e1e" : c === "white" ? "#d8c66a" : "#c45c26",
                      }}
                    />
                    {t(`forms.vineyardBlock.grapeColor${c.charAt(0).toUpperCase() + c.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t("forms.vineyardBlock.yearLabel")}
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={formData.year}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    year: e.target.value.replace(/\D/g, "").slice(0, 4),
                  })
                }
                placeholder={t("forms.vineyardBlock.yearPlaceholder")}
                className={`w-full px-4 py-3 rounded-xl border bg-slate-50 ${
                  errors.year ? "border-red-500" : "border-slate-200"
                }`}
              />
              {errors.year && (
                <p className="mt-1 text-sm text-red-600">{errors.year}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t("forms.vineyardBlock.areaLabel")}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder={t("forms.vineyardBlock.areaPlaceholder")}
                className={`w-full px-4 py-3 rounded-xl border bg-slate-50 ${
                  errors.area ? "border-red-500" : "border-slate-200"
                }`}
              />
              {errors.area && (
                <p className="mt-1 text-sm text-red-600">{errors.area}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t("forms.vineyardBlock.notesLabel")}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t("forms.vineyardBlock.notesPlaceholder")}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 resize-none"
              />
            </div>

            {errors.submit && (
              <p className="text-sm text-red-600">{errors.submit}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-3.5 rounded-xl border border-slate-200 font-semibold text-emerald-700 hover:bg-slate-50"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading ? t("common.processing") : t("common.save")}
              </button>
            </div>
          </div>
        </form>
      </Container>
    </div>
  );
}
