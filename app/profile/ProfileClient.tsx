"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/Container";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ProfileClient() {
  const { t } = useLanguage();
  const [user, setUser] = useState(auth?.currentUser ?? null);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setDisplayName(u?.displayName ?? "");
    });
    return () => unsub();
  }, []);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auth) return;
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      setUser({ ...user, displayName: displayName.trim() } as typeof user);
      setSuccess(true);
    } catch {
      setError(t("auth.errors.default"));
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">{t("auth.signIn.noAccount")}</p>
          <Link href="/login" className="vn-btn vn-btn-primary">
            {t("nav.signIn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-14 sm:py-20">
        <div className="absolute inset-0">
          <Image
            src="/dan-meyers-0AgtPoAARtE-unsplash-541a468a-f343-4b2a-9896-214be82fd831.png"
            alt="Vineyard"
            fill
            className="object-cover"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-transparent" />
        </div>
        <Container>
          <div className="relative z-10 max-w-md mx-auto">
            <div className="vn-glass-hero vn-card vn-card-pad">
              <h1 className="text-2xl font-semibold text-slate-900 mb-6">
                {t("nav.profile")}
              </h1>
              <form onSubmit={handleSaveName} className="space-y-4">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-1">
                    {t("profile.name")}
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t("profile.editName")}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-vineyard-600 focus:border-vineyard-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("profile.email")}
                  </label>
                  <p className="px-4 py-2 text-slate-600 bg-slate-100 rounded-xl">{user.email}</p>
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                {success && <p className="text-vineyard-700 text-sm">{t("auth.success.profileUpdated")}</p>}
                <button
                  type="submit"
                  disabled={saving}
                  className="vn-btn vn-btn-primary disabled:opacity-50"
                >
                  {saving ? t("profile.saving") : t("profile.save")}
                </button>
              </form>
              <div className="mt-6">
                <Link href="/" className="vn-link">
                  ← {t("nav.home")}
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
