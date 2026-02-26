"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

interface AuthGateProps {
  children: React.ReactNode;
  /** Shown when user is not logged in (after auth has loaded). Default: login prompt. */
  fallback?: React.ReactNode;
}

/**
 * Shows children immediately. When auth loads:
 * - If user is logged in: shows children
 * - If not: shows fallback (login prompt by default)
 * No blocking - children render on first paint; UI updates after auth hydrates.
 */
export function AuthGate({ children, fallback }: AuthGateProps) {
  const { user, ready } = useAuth();
  const { t } = useLanguage();

  // Render immediately - never block. When auth not ready, show fallback (safe for protected pages).
  if (!ready || !user) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center px-4 py-12">
        <p className="text-slate-600 mb-4">{t("auth.signIn.noAccount")}</p>
        <Link
          href="/login"
          className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
        >
          {t("nav.signIn")}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
