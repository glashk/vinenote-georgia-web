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
  const [isClosing, setIsClosing] = useState(false);
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
    if (typeof window === "undefined" || !auth) return;
    let unsub: (() => void) | undefined;
    let cancelled = false;
    const run = () => {
      if (cancelled || !auth) return;
      unsub = onAuthStateChanged(auth, setUser);
    };
    const useIdle =
      typeof requestIdleCallback !== "undefined" &&
      typeof cancelIdleCallback !== "undefined";
    const id = useIdle
      ? requestIdleCallback(run, { timeout: 1500 })
      : setTimeout(run, 500);
    return () => {
      cancelled = true;
      useIdle ? cancelIdleCallback(id as number) : clearTimeout(id);
      unsub?.();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const inMenu = userMenuRef.current?.contains(target);
      const inDropdown = target.closest?.("[data-user-menu-dropdown]");
      if (!inMenu && !inDropdown) setUserMenuOpen(false);
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
    if (!userMenuOpen) updateDropdownPosition();
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

  const APP_STORE_URL =
    "https://apps.apple.com/app/vinenote-georgia/id6758243424";

  const navLinks = [
    { href: "/", label: t("nav.market"), icon: "market" },
    { href: APP_STORE_URL, label: t("nav.app"), icon: "app", external: true },
    { href: "/about", label: t("nav.aboutUs"), icon: "about" },
    { href: "/support", label: t("nav.support"), icon: "support" },
    { href: "/privacy", label: t("nav.privacy"), icon: "privacy" },
  ];

  const NavIcon = ({
    icon,
    className,
  }: {
    icon: string;
    className?: string;
  }) => {
    const c = className ?? "w-4 h-4 shrink-0";
    if (icon === "market")
      return (
        <svg
          className={c}
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
      );
    if (icon === "about")
      return (
        <svg
          className={c}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    if (icon === "support")
      return (
        <svg
          className={c}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    if (icon === "privacy")
      return (
        <svg
          className={c}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      );
    if (icon === "app")
      return (
        <svg className={c} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      );
    return null;
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    setIsClosing(false);
  }, [pathname]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setMobileMenuOpen(false);
      setIsClosing(false);
    }, 300);
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Mobile header - light green theme */}
      <div className="md:hidden relative bg-gradient-to-b from-white via-vineyard-50 to-vineyard-100 text-slate-800 shadow-lg ring-1 ring-vineyard-100">
        <div className="flex items-center justify-between h-14 px-3 gap-2">
          <Link
            href="/"
            className="flex items-center gap-3 min-w-0 shrink"
            aria-label={t("nav.homeAria")}
          >
            <div className="relative w-8 h-8 rounded-lg overflow-hidden ring-1 ring-vineyard-200 shrink-0">
              <Logo size={32} className="relative w-full h-full" animated />
            </div>
            <span className="font-semibold text-sm truncate text-vineyard-700">
              VineNote
            </span>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/my-listings/add"
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/25 hover:bg-emerald-800 active:scale-[0.98] transition-all"
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
              <span>{t("market.add")}</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-700 hover:bg-vineyard-50 active:bg-vineyard-100 transition-colors"
              aria-label={t("nav.toggleMenu")}
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
        </div>
      </div>

      {/* Desktop: White bar with vineyard accents */}
      <div className="hidden md:block relative bg-gradient-to-b from-white to-vineyard-100 border-b border-vineyard-200 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <Container>
          <nav className="relative flex items-center justify-between h-[4.5rem] px-4 sm:px-6">
            {/* Logo & Brand */}
            <Link
              href="/"
              className="flex items-center gap-3 group"
              aria-label={t("nav.homeAria")}
            >
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden ring-1 ring-vineyard-100 group-hover:ring-vineyard-300 transition-all duration-300">
                <Logo size={40} className="relative w-full h-full" animated />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 group-hover:text-vineyard-700 transition-colors">
                  VineNote Georgia
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 tracking-widest uppercase">
                  {t("nav.tagline")}
                </span>
              </div>
            </Link>

            {/* Desktop Nav - Add listings, Download app, Profile dropdown | divider | Language switcher */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium text-slate-700 hover:text-vineyard-600 hover:bg-vineyard-50 transition-all duration-200"
              >
                <NavIcon icon="app" />
                {t("nav.app")}
              </Link>
              <Link
                href="/my-listings/add"
                className="flex items-center gap-3 h-10 px-4 rounded-full bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/25 hover:bg-emerald-800 transition-all duration-200"
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
                    className="flex items-center gap-3 p-1.5 rounded-full bg-vineyard-50 border border-vineyard-200 text-vineyard-800 hover:bg-vineyard-100 hover:border-vineyard-300 transition-all duration-200"
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
                  className="flex items-center gap-3 h-10 px-4 rounded-full bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/25 hover:bg-emerald-800 transition-all duration-200"
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
          </nav>
        </Container>
      </div>

      {/* Mobile Menu - Slide-in drawer from right */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className={`absolute inset-0 backdrop-blur-sm bg-slate-700/30 ${isClosing ? "opacity-0 transition-opacity duration-300" : "animate-fade-in opacity-100"}`}
            onClick={closeMobileMenu}
            aria-hidden
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-[min(320px,85vw)] bg-gradient-to-b from-white via-emerald-50 to-emerald-100 shadow-2xl overflow-y-auto ring-1 ring-emerald-100"
            data-closing={isClosing ? "true" : undefined}
            style={{
              animation: isClosing
                ? "slideOutRight 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards"
                : "slideInRight 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards",
            }}
          >
            <div className="flex flex-col h-full pt-6 pb-8 px-4">
              <div className="flex items-center justify-between mb-6 px-2">
                <span className="text-slate-600 text-sm font-medium uppercase tracking-wider">
                  {t("nav.menu")}
                </span>
                <div className="flex items-center gap-2">
                  <LanguageSwitcher variant="light" />
                  <button
                    onClick={closeMobileMenu}
                    className="p-2 rounded-lg text-slate-700 hover:bg-emerald-50 transition-colors"
                    aria-label={t("nav.closeMenu")}
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <nav className="flex-1 space-y-1">
                {navLinks.map((link) => {
                  const isActive = !link.external && pathname === link.href;
                  const linkProps = link.external
                    ? {
                        target: "_blank" as const,
                        rel: "noopener noreferrer" as const,
                      }
                    : {};
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                      {...linkProps}
                      className={[
                        "flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-colors",
                        isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "text-slate-800 hover:bg-emerald-50 hover:text-emerald-600",
                      ].join(" ")}
                    >
                      <NavIcon
                        icon={link.icon}
                        className="w-5 h-5 shrink-0 text-emerald-600"
                      />
                      {link.label}
                    </Link>
                  );
                })}
                <Link
                  href="/my-listings/add"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-emerald-700 text-white font-semibold mt-4 shadow-md shadow-emerald-600/25 hover:bg-emerald-800 transition-colors"
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
              </nav>
              <div className="pt-4 mt-4 border-t border-emerald-100 space-y-1">
                {user ? (
                  <>
                    <div className="px-4 py-2 text-sm text-slate-600 truncate">
                      {user.displayName ||
                        user.email?.split("@")[0] ||
                        t("nav.profile")}
                    </div>
                    <Link
                      href="/my-listings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-800 hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      <svg
                        className="w-5 h-5 text-emerald-600"
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
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-800 hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      <svg
                        className="w-5 h-5 text-emerald-600"
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
                      className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-800 hover:bg-red-50 hover:text-red-600"
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
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/25 hover:bg-emerald-800 transition-colors"
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
        </div>
      )}
    </header>
  );
}
