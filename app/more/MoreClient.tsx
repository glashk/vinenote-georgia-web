"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Container from "@/components/Container";
import {
  ArrowLeft,
  CheckSquare,
  Wheat,
  Box,
  Wine,
  DollarSign,
  ClipboardList,
  History,
  Settings,
} from "lucide-react";

const LINKS = [
  { href: "/tasks", icon: CheckSquare, key: "tasks" },
  { href: "/harvests", icon: Wheat, key: "harvests" },
  { href: "/containers", icon: Box, key: "containers" },
  { href: "/wine-batches", icon: Wine, key: "wineBatches" },
  { href: "/finance", icon: DollarSign, key: "finance" },
  { href: "/inventory", icon: ClipboardList, key: "inventory" },
  { href: "/history", icon: History, key: "history" },
  { href: "/settings", icon: Settings, key: "settings" },
] as const;

export default function MoreClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login?redirect=/more");
    }
  }, [ready, user, router]);

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
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">{t("dashboard.title")}</span>
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          {t("more.title")}
        </h1>
        <p className="text-slate-600 mb-8">{t("more.subtitle")}</p>

        <div className="space-y-2">
          {LINKS.map(({ href, icon: Icon, key }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:bg-emerald-50/50 hover:border-emerald-200 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Icon size={20} className="text-emerald-600" />
                </div>
                <span className="font-semibold text-slate-800">
                  {t(`more.${key}`)}
                </span>
              </div>
              <span className="text-slate-400">→</span>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
}
