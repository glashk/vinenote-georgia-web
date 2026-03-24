"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { containersService } from "@/services/containers";
import type { Container } from "@/types/firestore";
import Container from "@/components/Container";
import { ArrowLeft } from "lucide-react";

const TYPES: Container["type"][] = ["qvevri", "tank", "barrel", "bottle", "box", "crate", "other"];
const STATUSES: Container["status"][] = ["available", "in-use", "maintenance", "retired", "fermenting", "aging", "finished"];
const UNITS: Container["unit"][] = ["liters", "gallons"];
const MATERIALS: (Container["material"] | "")[] = ["", "clay", "stainless-steel", "oak", "plastic", "glass", "other"];

export default function ContainerFormClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isEdit = !!id;

  const [name, setName] = useState("");
  const [type, setType] = useState<Container["type"]>("qvevri");
  const [capacity, setCapacity] = useState("");
  const [unit, setUnit] = useState<Container["unit"]>("liters");
  const [material, setMaterial] = useState<Container["material"] | "">("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<Container["status"]>("available");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/containers/add");
  }, [ready, user, router]);

  useEffect(() => {
    if (isEdit && id && user) {
      containersService
        .getContainer(user.uid, id)
        .then((c) => {
          if (c) {
            setName(c.name || "");
            setType(c.type || "qvevri");
            setCapacity(String(c.capacity || ""));
            setUnit(c.unit || "liters");
            setMaterial(c.material || "");
            setLocation(c.location || "");
            setStatus(c.status || "available");
            setNotes(c.notes || "");
          } else {
            router.replace("/containers");
          }
        })
        .catch(() => router.replace("/containers"))
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
    const cap = Number(capacity);
    if (isNaN(cap) || cap <= 0) {
      setError(t("forms.validation.positiveNumber"));
      return;
    }
    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        type,
        capacity: cap,
        unit,
        material: material || undefined,
        location: location.trim() || undefined,
        status,
        notes: notes.trim() || undefined,
      };
      if (isEdit && id) {
        await containersService.updateContainer(user.uid, id, data);
      } else {
        await containersService.createContainer(user.uid, data);
      }
      router.push("/containers");
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
          href="/containers"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft size={20} />
          {t("containers.title")}
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          {isEdit ? t("forms.container.editTitle") : t("forms.container.createTitle")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.container.nameLabel")} {t("forms.required")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("forms.container.namePlaceholder")}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.container.typeLabel")}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Container["type"])}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              {TYPES.map((v) => (
                <option key={v} value={v}>
                  {t(`containers.types.${v}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("forms.container.capacityLabel")} {t("forms.required")}
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                min="0"
                step="0.1"
                placeholder={t("forms.container.capacityPlaceholder")}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("containers.unitLabel")}
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Container["unit"])}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.container.materialLabel")}
            </label>
            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value as Container["material"] | "")}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              {MATERIALS.map((m) => (
                <option key={m || "none"} value={m}>
                  {m ? t(`containers.materials.${m}`) : "—"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.container.locationLabel")}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("forms.container.locationPlaceholder")}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.container.statusLabel")}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Container["status"])}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              {STATUSES.map((v) => (
                <option key={v} value={v}>
                  {t(`containers.statuses.${v}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.container.notesLabel")}
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
              href="/containers"
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
