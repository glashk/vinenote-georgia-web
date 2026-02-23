"use client";

import { useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/reports", label: "Reports", icon: "⚠️" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/listings", label: "Listings", icon: "📦" },
  { href: "/admin/safety", label: "Safety", icon: "🛡️" },
  { href: "/admin/messages", label: "Messages", icon: "💬" },
  { href: "/admin/audit", label: "Audit Log", icon: "📋" },
  { href: "/admin/notifications", label: "Alerts", icon: "🔔" },
];

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("admin-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("admin-theme", "light");
    }
  }, [dark]);

  useEffect(() => {
    const stored = localStorage.getItem("admin-theme");
    setDark(stored === "dark");
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.ctrlKey || e.metaKey) return;

      switch (e.key.toLowerCase()) {
        case "d":
          // Delete - handled in report/listing context
          break;
        case "b":
          // Ban - handled in context
          break;
        case "w":
          // Warn - handled in context
          break;
        case "1":
          router.push("/admin/dashboard");
          e.preventDefault();
          break;
        case "2":
          router.push("/admin/reports");
          e.preventDefault();
          break;
        case "3":
          router.push("/admin/users");
          e.preventDefault();
          break;
        case "4":
          router.push("/admin/listings");
          e.preventDefault();
          break;
      }
    },
    [router],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    router.replace("/admin/login");
  };

  return (
    <div className="admin-shell flex min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <aside className="w-56 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-slate-800 dark:text-slate-100">
                VineNote Admin
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Moderation Console
              </p>
            </div>
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
              title={dark ? "Light mode" : "Dark mode"}
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
        <nav className="flex-1 p-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onMouseEnter={() => router.prefetch(item.href)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
