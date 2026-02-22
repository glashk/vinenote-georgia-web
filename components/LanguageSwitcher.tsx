"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface LanguageSwitcherProps {
  variant?: "light" | "dark";
  className?: string;
}

export default function LanguageSwitcher({
  variant = "light",
  className = "",
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const isDark = variant === "dark";

  return (
    <div
      className={`flex items-center gap-1 sm:gap-2 rounded-full transition-colors duration-200 ease-in-out p-1.5 ${
        isDark
          ? "bg-amber-300/30 border border-amber-700/40"
          : "bg-vineyard-50 border border-vineyard-200 shadow-none"
      } ${className}`}
    >
      <button
        onClick={() => setLanguage("en")}
        className={`px-2 py-1 rounded-full transition-all duration-200 text-sm sm:text-[10px] font-medium ${
          language === "en"
            ? isDark
              ? "bg-amber-600 text-amber-950"
              : "bg-vineyard-600 text-white"
            : isDark
              ? "text-amber-200/90 hover:text-amber-50 hover:bg-amber-900/50"
              : "text-slate-700 hover:text-slate-950 hover:bg-white/30"
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("ka")}
        className={`px-2 py-1 rounded-full transition-colors duration-200 ease-in-out  text-sm sm:text-[10px] font-medium ${
          language === "ka"
            ? isDark
              ? "bg-amber-600 text-amber-950"
              : "bg-vineyard-600 text-white"
            : isDark
              ? "text-amber-200/90 hover:text-amber-50 hover:bg-amber-900/50"
              : "text-slate-700 hover:text-slate-950 hover:bg-white/30"
        }`}
        aria-label="Switch to Georgian"
      >
        ქა
      </button>
    </div>
  );
}
