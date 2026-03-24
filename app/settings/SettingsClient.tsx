"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Container from "@/components/Container";
import { ArrowLeft } from "lucide-react";

const WINERY_KEY = "vinenote_winery_name";

export default function SettingsClient() {
  const { user, ready, signOut } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [wineryName, setWineryName] = useState("");

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/settings");
  }, [ready, user, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const name = localStorage.getItem(WINERY_KEY) || "";
      setWineryName(name);
    }
  }, []);

  const handleSaveWineryName = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(WINERY_KEY, wineryName.trim());
    }
  };

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

        <h1 className="text-2xl font-bold text-slate-900 mb-8">
          {t("settings.title")}
        </h1>

        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t("settings.wineryName")}
            </label>
            <input
              type="text"
              value={wineryName}
              onChange={(e) => setWineryName(e.target.value)}
              onBlur={handleSaveWineryName}
              placeholder={t("settings.wineryNamePlaceholder")}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t("settings.language")}
            </label>
            <LanguageSwitcher />
          </div>

          <button
            onClick={async () => {
              await signOut();
              router.replace("/");
            }}
            className="flex w-full items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold hover:bg-red-100 hover:border-red-300 transition-colors"
          >
            {t("settings.signOut")}
          </button>
        </div>
      </Container>
    </div>
  );
}
