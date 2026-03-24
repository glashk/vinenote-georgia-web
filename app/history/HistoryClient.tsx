"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Container from "@/components/Container";
import { ArrowLeft, History } from "lucide-react";

export default function HistoryClient() {
  const { user, ready } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login?redirect=/history");
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
          {t("history.title")}
        </h1>
        <p className="text-slate-600 mb-8">{t("history.subtitle")}</p>

        <div className="text-center py-16 px-4">
          <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
            <History size={36} className="text-slate-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            {t("history.empty")}
          </h2>
          <p className="text-slate-600">
            Activity timeline will appear here as you use the app.
          </p>
        </div>
      </Container>
    </div>
  );
}
