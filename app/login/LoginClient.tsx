"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/Container";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useLanguage } from "@/contexts/LanguageContext";

function getAuthErrorMessage(code: string, t: (key: string) => string): string {
  switch (code) {
    case "auth/invalid-email":
      return t("auth.errors.invalidEmail");
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return t("auth.errors.wrongPassword");
    case "auth/user-not-found":
      return t("auth.errors.userNotFound");
    case "auth/user-disabled":
      return t("auth.errors.default");
    default:
      return t("auth.errors.default");
  }
}

export default function LoginClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setForgotLoading(true);
    if (!auth) {
      setError(t("auth.errors.default"));
      setForgotLoading(false);
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setForgotSuccess(true);
    } catch (err: unknown) {
      const e = err as { code?: string };
      setError(getAuthErrorMessage(e?.code ?? "", t));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (!auth) {
      setError(t("auth.errors.default"));
      setLoading(false);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace(redirect.startsWith("/") ? redirect : "/");
    } catch (err: unknown) {
      const e = err as { code?: string };
      setError(getAuthErrorMessage(e?.code ?? "", t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-14 sm:py-20">
        <div className="absolute inset-0">
          <Image
            src="/dan-meyers-0AgtPoAARtE-unsplash-541a468a-f343-4b2a-9896-214be82fd831.png"
            alt="Vineyard"
            fill
            className="object-cover"
            loading="lazy"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-transparent" />
        </div>
        <Container>
          <div className="relative z-10 max-w-md mx-auto">
            <div className="vn-glass-hero vn-card vn-card-pad">
              <h1 className="text-2xl font-semibold text-slate-900 mb-6">
                {forgotMode ? t("auth.forgotPassword.title") : t("auth.signIn.title")}
              </h1>

              {forgotMode ? (
                <>
                  {forgotSuccess ? (
                    <div className="space-y-4">
                      <p className="text-slate-700 text-sm">{t("auth.forgotPassword.success")}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotMode(false);
                          setForgotSuccess(false);
                        }}
                        className="vn-btn vn-btn-primary w-full"
                      >
                        {t("auth.forgotPassword.backToSignIn")}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotSubmit} className="space-y-4">
                      <p className="text-slate-600 text-sm">{t("auth.forgotPassword.description")}</p>
                      <div>
                        <label
                          htmlFor="forgot-email"
                          className="block text-sm font-medium text-slate-700 mb-1"
                        >
                          {t("auth.forgotPassword.email")}
                        </label>
                        <input
                          id="forgot-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-vineyard-600 focus:border-vineyard-600 outline-none"
                          placeholder="you@example.com"
                        />
                      </div>
                      {error && <p className="text-red-600 text-sm">{error}</p>}
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="vn-btn vn-btn-primary w-full disabled:opacity-50"
                      >
                        {forgotLoading ? t("auth.forgotPassword.loading") : t("auth.forgotPassword.submit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotMode(false);
                          setError(null);
                        }}
                        className="vn-btn vn-btn-ghost w-full"
                      >
                        {t("auth.forgotPassword.backToSignIn")}
                      </button>
                    </form>
                  )}
                </>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      {t("auth.signIn.email")}
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-vineyard-600 focus:border-vineyard-600 outline-none"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      {t("auth.signIn.password")}
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="w-full px-4 py-2 pr-12 rounded-xl border border-slate-300 focus:ring-2 focus:ring-vineyard-600 focus:border-vineyard-600 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-slate-700 rounded-lg"
                        aria-label={showPassword ? t("auth.signIn.hidePassword") : t("auth.signIn.showPassword")}
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="text-sm vn-link"
                    >
                      {t("auth.signIn.forgotPassword")}
                    </button>
                  </div>
                  {error && (
                    <p className="text-red-600 text-sm">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="vn-btn vn-btn-primary w-full disabled:opacity-50"
                  >
                    {loading ? t("auth.signIn.loading") : t("auth.signIn.submit")}
                  </button>
                </form>
              )}

              {!forgotMode && (
              <p className="mt-6 text-center text-sm text-slate-600">
                {t("auth.signIn.noAccount")}{" "}
                <Link
                  href="/signup"
                  className="vn-link font-medium"
                >
                  {t("auth.signIn.signUp")}
                </Link>
              </p>
              )}

              <div className="mt-4 text-center">
                <Link href="/" className="vn-link text-sm">
                  {t("nav.home")}
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
