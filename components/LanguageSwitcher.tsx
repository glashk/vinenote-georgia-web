"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface LanguageSwitcherProps {
  variant?: "light" | "dark" | "onDark" | "clay";
  className?: string;
}

export default function LanguageSwitcher({
  variant = "light",
  className = "",
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const isDark = variant === "dark";
  const isOnDark = variant === "onDark";
  const isClay = variant === "clay";

  const containerClass = isClay
    ? "bg-clay-50 border border-clay-200 shadow-none"
    : isDark
    ? "bg-amber-300/30 border border-amber-700/40"
    : isOnDark
      ? "bg-white/10 border border-white/20"
      : "bg-vineyard-50 border border-vineyard-200 shadow-none";

  const activeClass = isClay
    ? "bg-clay-600 text-white"
    : isDark
    ? "bg-amber-600 text-amber-950"
    : isOnDark
      ? "bg-white text-vineyard-800"
      : "bg-vineyard-600 text-white";

  const inactiveClass = isClay
    ? "text-slate-700 hover:text-clay-900 hover:bg-clay-100"
    : isDark
    ? "text-amber-200/90 hover:text-amber-50 hover:bg-amber-900/50"
    : isOnDark
      ? "text-white/80 hover:text-white hover:bg-white/20"
      : "text-slate-700 hover:text-slate-950 hover:bg-white/30";

  return (
    <div
      className={`flex items-center gap-1 sm:gap-2 rounded-full transition-colors duration-200 ease-in-out p-1.5 ${containerClass} ${className}`}
    >
      <button
        onClick={() => setLanguage("en")}
        className={`px-2 py-1 rounded-full transition-all duration-200 text-sm sm:text-[10px] font-medium ${
          language === "en" ? activeClass : inactiveClass
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("ka")}
        className={`px-2 py-1 rounded-full transition-colors duration-200 ease-in-out text-sm sm:text-[10px] font-medium ${
          language === "ka" ? activeClass : inactiveClass
        }`}
        aria-label="Switch to Georgian"
      >
        ქა
      </button>
    </div>
  );
}
