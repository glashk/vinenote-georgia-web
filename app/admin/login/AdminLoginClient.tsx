"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

const ADMIN_DENIED_MESSAGE = "თქვენ არ გაქვთ ადმინისტრატორის უფლება";

export default function AdminLoginClient() {
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
      setError("Firebase არ იძლევა");
      setLoading(false);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/admin/reports");
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      setError(e?.message ?? "შეცდომა შესვლისას");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="vn-glass vn-card vn-card-pad w-full max-w-sm">
        <h1 className="text-xl font-semibold text-slate-900 mb-6">
          ადმინისტრატორის შესვლა
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              ელფოსტა
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              პაროლი
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="vn-btn vn-btn-primary w-full disabled:opacity-50"
          >
            {loading ? "შესვლა..." : "შესვლა"}
          </button>
        </form>
        <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="vn-btn vn-btn-ghost text-slate-600 hover:text-red-600"
            >
              გასვლა
            </button>
          )}
          <Link
            href="/"
            className="flex items-center justify-center gap-3 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            <span aria-hidden>←</span>
            მთავარი გვერდი
          </Link>
        </div>
      </div>
    </div>
  );
}
