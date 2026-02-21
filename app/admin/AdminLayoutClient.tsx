"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import AdminShell from "@/modules/admin/components/AdminShell";

const ADMIN_DENIED_MESSAGE = "You do not have administrator access";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, loading, user } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (loading) return;
    if (isLoginPage) {
      if (user && isAdmin) router.replace("/admin/dashboard");
      return;
    }
    if (!user) {
      router.replace("/admin/login");
      return;
    }
    if (!isAdmin) {
      router.replace("/");
    }
  }, [isAdmin, loading, user, isLoginPage, router]);

  if (loading && !isLoginPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 text-sm">Checking access...</p>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 max-w-md">
          <p className="text-red-600 dark:text-red-400 font-medium">{ADMIN_DENIED_MESSAGE}</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
