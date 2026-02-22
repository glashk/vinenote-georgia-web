"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import enTranslations from "@/translations/en.json";
import kaTranslations from "@/translations/ka.json";

type Language = "en" | "ka";

const TRANSLATIONS: Record<Language, Record<string, unknown>> = {
  en: enTranslations as Record<string, unknown>,
  ka: kaTranslations as Record<string, unknown>,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => any;
  getArray: (key: string) => string[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "ka";
  const w = window as Window & { __LOCALE?: string };
  return w.__LOCALE === "ka" || w.__LOCALE === "en" ? w.__LOCALE : "ka";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    const saved = (localStorage.getItem("language") as Language) || "ka";
    if (saved === "en" || saved === "ka") setLanguageState(saved);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") localStorage.setItem("language", lang);
  };

  const translations = TRANSLATIONS[language];

  const t = (key: string): any => {
    const keys = key.split(".");
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    return value !== undefined ? value : key;
  };

  const getArray = (key: string): string[] => {
    const value = t(key);
    return Array.isArray(value) ? value : [];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getArray }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
