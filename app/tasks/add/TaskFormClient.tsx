"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { tasksService } from "@/services/tasks";
import { vineyardBlocksService } from "@/services/vineyardBlocks";
import type { Task } from "@/types/firestore";
import type { VineyardBlock } from "@/types/vineyard";
import Container from "@/components/Container";
import { ArrowLeft } from "lucide-react";

const TASK_TYPES: Task["type"][] = ["pruning", "spraying", "harvesting", "fertilizing", "irrigation", "other"];
const STATUSES: Task["status"][] = ["pending", "in-progress", "completed", "cancelled"];
const PRIORITIES: Task["priority"][] = ["low", "medium", "high"];

export default function TaskFormClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isEdit = !!id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<Task["type"]>("pruning");
  const [status, setStatus] = useState<Task["status"]>("pending");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [vineyardBlockId, setVineyardBlockId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/tasks/add");
  }, [ready, user, router]);

  useEffect(() => {
    if (user) {
      vineyardBlocksService.getUserVineyardBlocks(user.uid).then(setBlocks);
    }
  }, [user]);

  useEffect(() => {
    if (isEdit && id && user) {
      tasksService
        .getTask(user.uid, id)
        .then((task) => {
          if (task) {
            setTitle(task.title || "");
            setDescription(task.description || "");
            setType(task.type || "pruning");
            setStatus(task.status || "pending");
            setPriority(task.priority || "medium");
            setVineyardBlockId(task.vineyardBlockId || "");
            setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
            setNotes(task.notes || "");
          } else {
            router.replace("/tasks");
          }
        })
        .catch(() => router.replace("/tasks"))
        .finally(() => setInitialLoading(false));
    }
  }, [isEdit, id, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    if (!title.trim()) {
      setError(t("forms.nameRequired"));
      return;
    }
    setLoading(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        status,
        priority,
        vineyardBlockId: vineyardBlockId || undefined,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
      };
      if (isEdit && id) {
        await tasksService.updateTask(user.uid, id, data);
      } else {
        await tasksService.createTask(user.uid, data);
      }
      router.push("/tasks");
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
          href="/tasks"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft size={20} />
          {t("tasks.title")}
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          {isEdit ? t("forms.task.editTitle") : t("forms.task.createTitle")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.task.titleLabel")} {t("forms.required")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("forms.task.titlePlaceholder")}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.task.typeLabel")}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Task["type"])}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              {TASK_TYPES.map((v) => (
                <option key={v} value={v}>
                  {t(`tasks.types.${v}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.task.blockLabel")}
            </label>
            <select
              value={vineyardBlockId}
              onChange={(e) => setVineyardBlockId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              <option value="">{t("forms.task.blockPlaceholder")}</option>
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.grapeVariety ? `(${b.grapeVariety})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.task.statusLabel")}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Task["status"])}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              {STATUSES.map((v) => (
                <option key={v} value={v}>
                  {t(`tasks.statuses.${v}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.task.priorityLabel")}
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task["priority"])}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
            >
              {PRIORITIES.map((v) => (
                <option key={v} value={v}>
                  {t(`tasks.priorities.${v}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.task.dueDateLabel")}
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.task.descriptionLabel")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("forms.task.notesLabel")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? t("common.processing") : t("common.save")}
            </button>
            <Link
              href="/tasks"
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
