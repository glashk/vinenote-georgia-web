"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useLanguage } from "@/contexts/LanguageContext";

function getAuthErrorMessage(code: string, t: (key: string) => string): string {
  switch (code) {
    case "auth/invalid-email":
      return t("auth.errors.invalidEmail");
    case "auth/email-already-in-use":
      return t("auth.errors.emailInUse");
    case "auth/weak-password":
      return t("auth.errors.weakPassword");
    default:
      return t("auth.errors.default");
  }
}

const inputClass =
  "w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors";
const labelClass = "block text-sm font-semibold text-slate-700 mb-2";

export default function SignupClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginHref = redirect !== "/" ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError(t("auth.errors.passwordMismatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("auth.errors.weakPassword"));
      return;
    }
    setLoading(true);
    if (!auth) {
      setError(t("auth.errors.default"));
      setLoading(false);
      return;
    }
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      if (name.trim()) {
        await updateProfile(user, { displayName: name.trim() });
      }
      router.replace(redirect.startsWith("/") ? redirect : "/");
    } catch (err: unknown) {
      const e = err as { code?: string };
      setError(getAuthErrorMessage(e?.code ?? "", t));
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ show }: { show: boolean }) =>
    show ? (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    ) : (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f4f0] px-4 py-14 sm:py-20">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-col">
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
                  <UserPlus size={28} strokeWidth={2.5} className="text-emerald-600" />
                </div>
                <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                  {t("auth.signUp.title")}
                </h1>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {t("auth.signUp.subtitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="name" className={labelClass}>
                  {t("auth.signUp.name")}
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className={inputClass}
                  placeholder={t("auth.signUp.namePlaceholder")}
                />
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>
                  {t("auth.signUp.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className={labelClass}>
                  {t("auth.signUp.password")}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={6}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                    aria-label={showPassword ? t("auth.signUp.hidePassword") : t("auth.signUp.showPassword")}
                  >
                    <EyeIcon show={showPassword} />
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">{t("auth.signUp.passwordHint")}</p>
              </div>
              <div>
                <label htmlFor="confirmPassword" className={labelClass}>
                  {t("auth.signUp.confirmPassword")}
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    minLength={6}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                    aria-label={showConfirmPassword ? t("auth.signUp.hidePassword") : t("auth.signUp.showPassword")}
                  >
                    <EyeIcon show={showConfirmPassword} />
                  </button>
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-600 rounded-lg bg-red-50 px-3 py-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[52px] rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-emerald-500/25 transition-all hover:bg-emerald-700 disabled:opacity-60 disabled:hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              >
                {loading ? t("auth.signUp.loading") : t("auth.signUp.submit")}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              {t("auth.signUp.hasAccount")}{" "}
              <Link href={loginHref} className="font-semibold text-emerald-600 hover:text-emerald-700">
                {t("auth.signUp.signIn")}
              </Link>
            </p>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <Link
                href="/"
                className="flex items-center justify-center gap-3 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                <span aria-hidden>←</span>
                {t("common.backToHome")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
