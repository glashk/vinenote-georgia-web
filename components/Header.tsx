"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "./Container";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Header() {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/market", label: t("nav.market") },
    { href: "/support", label: t("nav.support") },
    { href: "/privacy", label: t("nav.privacy") },
  ];

  useEffect(() => {
    // Close mobile menu on navigation
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50">
      {/* Full-width glass bar so it always sits flush at top-0 */}
      <div className="vn-glass border-b border-white/25 shadow-none">
        <Container>
          <div className="py-3">
            <div className="vn-glass-hero vn-card">
              <nav className="flex items-center justify-between h-16 px-4 sm:px-5">
                {/* Logo and Brand */}
                <Link
                  href="/"
                  className="flex items-center gap-2 sm:gap-3 group transition-transform duration-300 hover:scale-105"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10">
                    <Logo size={40} className="w-full h-full" animated />
                  </div>
                  <span className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 group-hover:text-slate-950 transition-colors">
                    <span className="hidden sm:inline">VineNote Georgia</span>
                    <span className="sm:hidden">VineNote</span>
                  </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-4">
                  <div className="flex gap-4 lg:gap-6 text-sm lg:text-base">
                    {navLinks.map((link) => {
                      const isActive = pathname === link.href;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          aria-current={isActive ? "page" : undefined}
                          className={[
                            "relative group transition-all duration-200",
                            isActive
                              ? "text-slate-950"
                              : "text-slate-700 hover:text-slate-950",
                          ].join(" ")}
                        >
                          {link.label}
                          <span
                            className={[
                              "absolute -bottom-1 left-0 h-0.5 bg-vineyard-800 transition-all duration-200",
                              isActive ? "w-full" : "w-0 group-hover:w-full",
                            ].join(" ")}
                          />
                        </Link>
                      );
                    })}
                  </div>
                  <LanguageSwitcher />
                </div>

                {/* Mobile: Language Switcher and Menu Button */}
                <div className="flex md:hidden items-center gap-2">
                  <LanguageSwitcher />
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 text-slate-700 hover:text-slate-950 hover:bg-white/30 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                    aria-expanded={mobileMenuOpen}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {mobileMenuOpen ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h16"
                        />
                      )}
                    </svg>
                  </button>
                </div>
              </nav>

              {/* Mobile Menu */}
              {mobileMenuOpen && (
                <div className="md:hidden border-t border-white/30 pb-4 animate-fade-in-up px-2 sm:px-3">
                  <div className="flex flex-col gap-1 pt-3">
                    {navLinks.map((link) => {
                      const isActive = pathname === link.href;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          aria-current={isActive ? "page" : undefined}
                          className={[
                            "px-4 py-2 rounded-lg transition-colors font-medium",
                            isActive
                              ? "bg-white/35 text-slate-950"
                              : "text-slate-700 hover:text-slate-950 hover:bg-white/30",
                          ].join(" ")}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </div>
    </header>
  );
}
