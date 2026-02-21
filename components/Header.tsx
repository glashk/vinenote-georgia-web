"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "./Container";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";

export default function Header() {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const inMenu = userMenuRef.current?.contains(target);
      const inDropdown = target.closest?.("[data-user-menu-dropdown]");
      if (!inMenu && !inDropdown) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateDropdownPosition = () => {
    if (userButtonRef.current) {
      const rect = userButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  };

  const handleUserMenuToggle = () => {
    if (!userMenuOpen) {
      updateDropdownPosition();
    }
    setUserMenuOpen(!userMenuOpen);
  };

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleScrollOrResize = () => updateDropdownPosition();
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [userMenuOpen]);

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
                  <div className="flex items-center gap-4 lg:gap-6 text-sm lg:text-base">
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
                  <Link
                    href="/my-listings/add"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vineyard-800 text-white hover:bg-vineyard-900 transition-colors text-sm font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t("market.add")}
                  </Link>
                  {user ? (
                    <div className="relative" ref={userMenuRef}>
                      <button
                        ref={userButtonRef}
                        onClick={handleUserMenuToggle}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vineyard-800 text-white hover:bg-vineyard-900 transition-colors text-sm font-medium"
                        aria-expanded={userMenuOpen}
                        aria-haspopup="true"
                      >
                        <svg
                          className="w-5 h-5 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span className="max-w-[120px] truncate">
                          {user.displayName || user.email?.split("@")[0] || t("nav.profile")}
                        </span>
                        <svg
                          className={`w-4 h-4 shrink-0 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {userMenuOpen &&
                      typeof document !== "undefined" &&
                      createPortal(
                        <div
                          data-user-menu-dropdown
                          className="fixed w-48 py-1 vn-glass vn-card rounded-xl shadow-lg animate-fade-in-up z-[100] bg-white/90 backdrop-blur-xl"
                          style={{
                            top: dropdownPosition.top,
                            right: dropdownPosition.right,
                          }}
                        >
                          <Link
                            href="/my-listings"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-white/40 hover:text-slate-950"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            {t("nav.myListings")}
                          </Link>
                          <Link
                            href="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-white/40 hover:text-slate-950"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {t("nav.profile")}
                          </Link>
                          <button
                            onClick={async () => {
                              setUserMenuOpen(false);
                              if (auth) await signOut(auth);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-white/40 hover:text-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            {t("nav.logOut")}
                          </button>
                        </div>,
                        document.body
                      )}
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vineyard-800 text-white hover:bg-vineyard-900 transition-colors text-sm font-medium"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      {t("nav.signIn")}
                    </Link>
                  )}
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
                    <Link
                      href="/my-listings/add"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vineyard-800 text-white hover:bg-vineyard-900 transition-colors font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {t("market.add")}
                    </Link>
                    {user ? (
                      <div className="mt-2 space-y-1 border-t border-white/30 pt-2">
                        <div className="px-4 py-2 text-sm text-slate-600 truncate">
                          {user.displayName || user.email?.split("@")[0] || t("nav.profile")}
                        </div>
                        <Link
                          href="/my-listings"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-white/30 font-medium"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {t("nav.myListings")}
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-white/30 font-medium"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {t("nav.profile")}
                        </Link>
                        <button
                          onClick={async () => {
                            setMobileMenuOpen(false);
                            if (auth) await signOut(auth);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 rounded-lg text-slate-700 hover:text-red-600 hover:bg-white/30 font-medium"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          {t("nav.logOut")}
                        </button>
                      </div>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vineyard-800 text-white hover:bg-vineyard-900 transition-colors font-medium mt-2"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {t("nav.signIn")}
                      </Link>
                    )}
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
