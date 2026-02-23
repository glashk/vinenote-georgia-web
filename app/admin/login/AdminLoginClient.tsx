"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { checkIsAdmin } from "@/lib/isAdmin";

const inputClass =
  "w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors";
const labelClass = "block text-sm font-semibold text-slate-700 mb-2";

export default function AdminLoginClient() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ email: string | null } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ? { email: u.email ?? null } : null);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.refresh();
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (!auth) {
      setError(t("adminLogin.firebaseError"));
      setLoading(false);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const isAdmin = await checkIsAdmin();
      if (!isAdmin) {
        await signOut(auth);
        setError(t("adminLogin.accessDenied"));
        return;
      }
      router.replace("/admin/reports");
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      setError(e?.message ?? t("adminLogin.loginError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f4f0] px-4 py-14 sm:py-20">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-col">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
                <Shield size={28} strokeWidth={2.5} className="text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                  {t("adminLogin.title")}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {t("adminLogin.subtitle")}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="email" className={labelClass}>
                  {t("adminLogin.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={inputClass}
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className={labelClass}>
                  {t("adminLogin.password")}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className={inputClass}
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 rounded-lg bg-red-50 px-3 py-2">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[52px] rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-emerald-500/25 transition-all hover:bg-emerald-700 disabled:opacity-60 disabled:hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              >
                {loading ? t("adminLogin.loading") : t("adminLogin.submit")}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-slate-600 hover:text-red-600 font-medium transition-colors"
                >
                  {t("adminLogin.logout")}
                </button>
              )}
              <Link
                href="/"
                className="flex items-center justify-center gap-3 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                <span aria-hidden>←</span>
                {t("adminLogin.backToHome")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
