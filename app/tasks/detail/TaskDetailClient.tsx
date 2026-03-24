"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { tasksService } from "@/services/tasks";
import { vineyardBlocksService } from "@/services/vineyardBlocks";
import type { Task } from "@/types/firestore";
import type { VineyardBlock } from "@/types/vineyard";
import Container from "@/components/Container";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

export default function TaskDetailClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [task, setTask] = useState<Task | null>(null);
  const [block, setBlock] = useState<VineyardBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/tasks/detail");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user || !id) {
      if (!id) router.replace("/tasks");
      setLoading(false);
      return;
    }
    tasksService
      .getTask(user.uid, id)
      .then(async (t) => {
        setTask(t);
        if (t?.vineyardBlockId) {
          const b = await vineyardBlocksService.getVineyardBlock(user.uid, t.vineyardBlockId);
          setBlock(b);
        }
      })
      .catch(() => setTask(null))
      .finally(() => setLoading(false));
  }, [user, id, router]);

  const handleDelete = async () => {
    if (!user || !id || !confirm(t("common.deleteConfirm"))) return;
    setDeleting(true);
    try {
      await tasksService.deleteTask(user.uid, id);
      router.push("/tasks");
    } catch {
      setDeleting(false);
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

  if (!task) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-600">{t("vineyardBlocks.notFound")}</p>
        <Link href="/tasks" className="text-emerald-600 font-semibold">
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
            href="/tasks"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={20} />
            {t("tasks.title")}
          </Link>
          <div className="flex gap-2">
            <Link
              href={`/tasks/add?id=${id}`}
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

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">{task.title}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
              {t(`tasks.types.${task.type}`)}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
              {t(`tasks.statuses.${task.status}`)}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
              {t(`tasks.priorities.${task.priority}`)}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            {block && (
              <p>
                <span className="text-slate-500">{t("tasks.vineyardBlockLabel")}:</span> {block.name}
              </p>
            )}
            <p>
              <span className="text-slate-500">{t("forms.task.typeLabel")}:</span>{" "}
              {t(`tasks.types.${task.type}`)}
            </p>
            <p>
              <span className="text-slate-500">{t("forms.task.statusLabel")}:</span>{" "}
              <span
                className={`font-medium ${
                  task.status === "completed"
                    ? "text-emerald-600"
                    : task.status === "in-progress"
                      ? "text-amber-600"
                      : "text-slate-700"
                }`}
              >
                {t(`tasks.statuses.${task.status}`)}
              </span>
            </p>
            <p>
              <span className="text-slate-500">{t("forms.task.priorityLabel")}:</span>{" "}
              {t(`tasks.priorities.${task.priority}`)}
            </p>
            {task.dueDate && (
              <p>
                <span className="text-slate-500">{t("forms.task.dueDateLabel")}:</span>{" "}
                {new Date(task.dueDate).toLocaleDateString()}
              </p>
            )}
            {task.description && (
              <p className="pt-2">
                <span className="text-slate-500">{t("forms.task.descriptionLabel")}:</span>
                <br />
                <span className="text-slate-700">{task.description}</span>
              </p>
            )}
            {task.notes && (
              <p className="pt-2">
                <span className="text-slate-500">{t("forms.task.notesLabel")}:</span>
                <br />
                <span className="text-slate-700">{task.notes}</span>
              </p>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
