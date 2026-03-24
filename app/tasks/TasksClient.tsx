"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { tasksService } from "@/services/tasks";
import type { Task } from "@/types/firestore";
import Container from "@/components/Container";
import { ArrowLeft, Plus, CheckSquare } from "lucide-react";

export default function TasksClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/tasks");
  }, [ready, user, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await tasksService.getUserTasks(user.uid);
      setTasks(data);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (!ready || !user) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <Container className="py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">{t("dashboard.title")}</span>
          </Link>
          <Link
            href="/tasks/add"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700"
          >
            <Plus size={18} />
            {t("tasks.createTask")}
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          {t("tasks.title")}
        </h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-pulse text-slate-500">Loading tasks…</div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
              <CheckSquare size={36} className="text-slate-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              {t("tasks.empty")}
            </h2>
            <p className="text-slate-600 mb-6">{t("tasks.emptySubtext")}</p>
            <Link
              href="/tasks/add"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
            >
              <Plus size={18} />
              {t("tasks.createTask")}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/detail?id=${task.id}`}
                className="block p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{task.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {t(`tasks.types.${task.type}`)} · {t(`tasks.statuses.${task.status}`)}
                    </p>
                    {task.dueDate && (
                      <p className="text-xs text-slate-500 mt-1">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      task.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : task.status === "in-progress"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {t(`tasks.statuses.${task.status}`)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
