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
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });
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
    { href: "/", label: t("nav.market") },
    { href: "/about", label: t("nav.aboutUs") },
  ];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50">
      {/* White bar with green accents */}
      <div className="relative bg-white border-b border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <Container>
          <nav className="relative flex items-center justify-between h-16 md:h-[4.5rem] px-4 sm:px-6">
            {/* Logo & Brand */}
            <Link
              href="/"
              className="flex items-center gap-3 group"
              aria-label="VineNote Georgia Home"
            >
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden ring-1 ring-vineyard-200 group-hover:ring-vineyard-400 transition-all duration-300">
                <Logo size={40} className="relative w-full h-full" animated />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 group-hover:text-vineyard-800 transition-colors">
                  <span className="hidden sm:inline">VineNote Georgia</span>
                  <span className="sm:hidden">VineNote</span>
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 tracking-widest uppercase">
                  Vinery & Market
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1 lg:gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "relative flex items-center gap-2 px-4 py-2.5  rounded-full text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-vineyard-800 bg-vineyard-100"
                        : "text-slate-700 hover:text-vineyard-800 hover:bg-vineyard-50",
                    ].join(" ")}
                  >
                    <svg
                      className="w-4 h-4 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                    {link.label}
                  </Link>
                );
              })}
              <div className="w-px bg-slate-200 mx-1" aria-hidden />
              <Link
                href="/my-listings/add"
                className="flex items-center gap-2 h-10 px-4 rounded-full bg-vineyard-600 text-white font-semibold text-sm hover:bg-vineyard-700 transition-all duration-200"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {t("market.add")}
              </Link>
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    ref={userButtonRef}
                    onClick={handleUserMenuToggle}
                    className="flex items-center gap-2 p-1.5  rounded-full bg-vineyard-50 border border-vineyard-200 text-vineyard-800 hover:bg-vineyard-100 hover:border-vineyard-300 transition-all duration-200"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-7 h-7 rounded-full bg-vineyard-200 flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-vineyard-700"
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
                    </div>
                    <span className="max-w-[100px] truncate text-sm font-medium">
                      {user.displayName ||
                        user.email?.split("@")[0] ||
                        t("nav.profile")}
                    </span>
                    <svg
                      className={`w-4 h-4 shrink-0 text-vineyard-600 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {userMenuOpen &&
                    typeof document !== "undefined" &&
                    createPortal(
                      <div
                        data-user-menu-dropdown
                        className="fixed w-52 py-1.5 rounded-xl shadow-xl animate-fade-in-up z-[100] bg-white backdrop-blur-xl border border-slate-200"
                        style={{
                          top: dropdownPosition.top,
                          right: dropdownPosition.right,
                        }}
                      >
                        <Link
                          href="/my-listings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-vineyard-50 hover:text-vineyard-800 transition-colors"
                        >
                          <svg
                            className="w-4 h-4 text-vineyard-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          {t("nav.myListings")}
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-vineyard-50 hover:text-vineyard-800 transition-colors"
                        >
                          <svg
                            className="w-4 h-4 text-vineyard-600"
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
                          {t("nav.profile")}
                        </Link>
                        <div className="my-1 border-t border-slate-200" />
                        <button
                          onClick={async () => {
                            setUserMenuOpen(false);
                            if (auth) await signOut(auth);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          {t("nav.logOut")}
                        </button>
                      </div>,
                      document.body,
                    )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 h-10 px-4 rounded-full bg-vineyard-600 text-white font-semibold text-sm hover:bg-vineyard-700 transition-all duration-200"
                >
                  <svg
                    className="w-4 h-4"
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
              <div className="w-px h-6 bg-slate-200 mx-1" aria-hidden />
              <LanguageSwitcher />
            </div>

            {/* Mobile: Right actions */}
            <div className="flex md:hidden items-center gap-2">
              <LanguageSwitcher />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-lg text-slate-700 hover:bg-vineyard-50 transition-colors"
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
        </Container>
      </div>

      {/* Mobile Menu - Full overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-white/95 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 top-0 pt-20 pb-8 px-4 bg-white border-b border-slate-200 animate-fade-in-up overflow-y-auto max-h-[85vh]">
            <div className="max-w-sm mx-auto space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={[
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors",
                      isActive
                        ? "bg-vineyard-100 text-vineyard-800"
                        : "text-slate-700 hover:bg-vineyard-50 hover:text-vineyard-800",
                    ].join(" ")}
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
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href="/my-listings/add"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-vineyard-600 text-white font-semibold mt-4"
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
                    strokeWidth={2.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {t("market.add")}
              </Link>
              {user ? (
                <div className="mt-6 pt-4 border-t border-slate-200 space-y-1">
                  <div className="px-4 py-2 text-sm text-slate-500 truncate">
                    {user.displayName ||
                      user.email?.split("@")[0] ||
                      t("nav.profile")}
                  </div>
                  <Link
                    href="/my-listings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-vineyard-50 hover:text-vineyard-800"
                  >
                    <svg
                      className="w-5 h-5 text-vineyard-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    {t("nav.myListings")}
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-vineyard-50 hover:text-vineyard-800"
                  >
                    <svg
                      className="w-5 h-5 text-vineyard-600"
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
                    {t("nav.profile")}
                  </Link>
                  <button
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      if (auth) await signOut(auth);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-red-50 hover:text-red-600"
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
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    {t("nav.logOut")}
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-vineyard-600 text-white font-semibold mt-6"
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
        </div>
      )}
    </header>
  );
}
