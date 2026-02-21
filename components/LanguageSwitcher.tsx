"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 sm:gap-2 rounded-xl p-0.5 sm:p-1 vn-glass shadow-none">
      <button
        onClick={() => setLanguage("en")}
        className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
          language === "en"
            ? "bg-vineyard-800 text-white"
            : "text-slate-700 hover:text-slate-950 hover:bg-white/30"
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("ka")}
        className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
          language === "ka"
            ? "bg-vineyard-800 text-white"
            : "text-slate-700 hover:text-slate-950 hover:bg-white/30"
        }`}
        aria-label="Switch to Georgian"
      >
        KA
      </button>
    </div>
  );
}
