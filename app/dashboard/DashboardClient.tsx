"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { vineyardBlocksService } from "@/services/vineyardBlocks";
import { tasksService } from "@/services/tasks";
import { harvestsService } from "@/services/harvests";
import { containersService } from "@/services/containers";
import { wineBatchesService } from "@/services/wineBatches";
import { financeService } from "@/services/finance";
import { inventoryService } from "@/services/inventory";
import Container from "@/components/Container";
import {
  Layers,
  Leaf,
  ChevronRight,
  Wine,
  CheckSquare,
  Wheat,
  Box,
  DollarSign,
  ClipboardList,
} from "lucide-react";

const WINERY_KEY = "vinenote_winery_name";

export default function DashboardClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login?redirect=/dashboard");
    }
  }, [ready, user, router]);
  const [wineryName, setWineryName] = useState("");
  const [vineyardCount, setVineyardCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [harvestCount, setHarvestCount] = useState(0);
  const [containerCount, setContainerCount] = useState(0);
  const [wineBatchCount, setWineBatchCount] = useState(0);
  const [activeBatchCount, setActiveBatchCount] = useState(0);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const name = localStorage.getItem(WINERY_KEY) || "";
      setWineryName(name.trim());
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [blocks, tasks, harvests, containers, batches, inv] = await Promise.all([
          vineyardBlocksService.getUserVineyardBlocks(user.uid),
          tasksService.getUserTasks(user.uid),
          harvestsService.getUserHarvests(user.uid),
          containersService.getUserContainers(user.uid),
          wineBatchesService.getUserWineBatches(user.uid),
          inventoryService.getUserInventory(user.uid),
        ]);
        const activeBatches = batches.filter(
          (b) => b.status !== "completed" && b.status !== "discarded"
        );
        setVineyardCount(blocks.length);
        setTaskCount(tasks.length);
        setHarvestCount(harvests.length);
        setContainerCount(containers.length);
        setWineBatchCount(batches.length);
        setActiveBatchCount(activeBatches.length);
        setInventoryCount(inv.length);
      } catch {
        setVineyardCount(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (!ready || !user) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading…</div>
      </div>
    );
  }

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <Container className="py-8 sm:py-12">
        <div className="flex flex-col">
          <div className="flex flex-row items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {wineryName || t("dashboard.title")}
              </h1>
              {wineryName && (
                <p className="mt-1 text-sm text-slate-600 font-semibold">
                  {t("dashboard.subtitle")}
                </p>
              )}
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-100/90 border border-slate-200/60">
              <span className="text-slate-700 font-bold text-sm">
                {todayLabel}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
            <Link
              href="/vineyards"
              className="flex flex-col p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl sm:text-3xl font-bold text-emerald-600">
                  {loading ? "—" : vineyardCount}
                </span>
                <Layers size={20} className="text-emerald-600" />
              </div>
              <span className="text-sm text-slate-600 font-medium">
                {t("dashboard.vineyardBlocks")}
              </span>
            </Link>

            <Link
              href="/harvests"
              className="flex flex-col p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl sm:text-3xl font-bold text-emerald-600">
                  {loading ? "—" : harvestCount}
                </span>
                <Wheat size={20} className="text-emerald-600" />
              </div>
              <span className="text-sm text-slate-600 font-medium">
                {t("dashboard.harvests")}
              </span>
            </Link>

            <Link
              href="/wine-batches"
              className="flex flex-col p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-2xl sm:text-3xl font-bold ${
                    activeBatchCount > 0 ? "text-amber-600" : "text-emerald-600"
                  }`}
                >
                  {loading ? "—" : activeBatchCount}
                </span>
                <Wine size={20} className="text-emerald-600" />
              </div>
              <span className="text-sm text-slate-600 font-medium">
                {t("dashboard.activeBatches")}
              </span>
            </Link>

            <Link
              href="/wine-batches"
              className="flex flex-col p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl sm:text-3xl font-bold text-emerald-600">
                  {loading ? "—" : wineBatchCount}
                </span>
                <Wine size={20} className="text-emerald-600" />
              </div>
              <span className="text-sm text-slate-600 font-medium">
                {t("dashboard.wineBatches")}
              </span>
            </Link>

            <Link
              href="/tasks"
              className="flex flex-col p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl sm:text-3xl font-bold text-emerald-600">
                  {loading ? "—" : taskCount}
                </span>
                <CheckSquare size={20} className="text-emerald-600" />
              </div>
              <span className="text-sm text-slate-600 font-medium">
                {t("dashboard.totalTasks")}
              </span>
            </Link>

            <Link
              href="/containers"
              className="flex flex-col p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl sm:text-3xl font-bold text-emerald-600">
                  {loading ? "—" : containerCount}
                </span>
                <Box size={20} className="text-emerald-600" />
              </div>
              <span className="text-sm text-slate-600 font-medium">
                {t("dashboard.containers")}
              </span>
            </Link>

            <Link
              href="/inventory"
              className="flex flex-col p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl sm:text-3xl font-bold text-emerald-600">
                  {loading ? "—" : inventoryCount}
                </span>
                <ClipboardList size={20} className="text-emerald-600" />
              </div>
              <span className="text-sm text-slate-600 font-medium">
                {t("dashboard.inventoryItems")}
              </span>
            </Link>

            <Link
              href="/finance"
              className="flex flex-col p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl sm:text-3xl font-bold text-emerald-600">
                  ₾
                </span>
                <DollarSign size={20} className="text-emerald-600" />
              </div>
              <span className="text-sm text-slate-600 font-medium">
                {t("dashboard.finance")}
              </span>
            </Link>
          </div>

          <div className="space-y-3 mb-6">
            <Link
              href="/harvests/add"
              className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:bg-emerald-50/50 hover:border-emerald-200 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Leaf size={20} className="text-emerald-600" />
                </div>
                <span className="font-semibold text-slate-800">
                  {t("today.addHarvest")}
                </span>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </Link>

            <Link
              href="/containers"
              className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:bg-emerald-50/50 hover:border-emerald-200 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <ClipboardList size={20} className="text-slate-600" />
                </div>
                <span className="font-semibold text-slate-800">
                  {t("today.addContainerNote")}
                </span>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </Link>

            <Link
              href="/tasks/add"
              className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:bg-emerald-50/50 hover:border-emerald-200 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckSquare size={20} className="text-emerald-600" />
                </div>
                <span className="font-semibold text-slate-800">
                  {t("today.addVineyardWork")}
                </span>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </Link>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">{t("more.title")}</h2>
            <Link
              href="/more"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              {t("common.all")} →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Link
              href="/tasks"
              className="flex items-center gap-3 p-1 rounded-xl text-slate-700 hover:bg-slate-50"
            >
              <CheckSquare size={24} className="text-emerald-600" />
              <span className="text-sm font-medium">{t("more.tasks")}</span>
            </Link>
            <Link
              href="/harvests"
              className="flex items-center gap-3 p-1 rounded-xl text-slate-700 hover:bg-slate-50"
            >
              <Wheat size={24} className="text-emerald-600" />
              <span className="text-sm font-medium">{t("more.harvests")}</span>
            </Link>
            <Link
              href="/containers"
              className="flex items-center gap-3 p-1 rounded-xl text-slate-700 hover:bg-slate-50"
            >
              <Box size={24} className="text-emerald-600" />
              <span className="text-sm font-medium">{t("more.containers")}</span>
            </Link>
            <Link
              href="/wine-batches"
              className="flex items-center gap-3 p-1 rounded-xl text-slate-700 hover:bg-slate-50"
            >
              <Wine size={24} className="text-emerald-600" />
              <span className="text-sm font-medium">{t("more.wineBatches")}</span>
            </Link>
            <Link
              href="/finance"
              className="flex items-center gap-3 p-1 rounded-xl text-slate-700 hover:bg-slate-50"
            >
              <DollarSign size={24} className="text-emerald-600" />
              <span className="text-sm font-medium">{t("more.finance")}</span>
            </Link>
            <Link
              href="/inventory"
              className="flex items-center gap-3 p-1 rounded-xl text-slate-700 hover:bg-slate-50"
            >
              <ClipboardList size={24} className="text-emerald-600" />
              <span className="text-sm font-medium">{t("more.inventory")}</span>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
