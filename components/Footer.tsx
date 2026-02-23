"use client";

import Link from "next/link";
import Container from "./Container";
import Logo from "./Logo";
import { useLanguage } from "@/contexts/LanguageContext";

const APP_STORE_URL =
  "https://apps.apple.com/app/vinenote-georgia/id6758243424";

const SOCIAL_LINKS = [
  {
    href: "https://www.facebook.com/vinenotegeorgia",
    label: "Facebook",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    href: "https://www.instagram.com/vinenotegeorgia",
    label: "Instagram",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const { t } = useLanguage();

  const navLinks = [
    { href: "/", label: t("nav.market") },
    { href: "/about", label: t("nav.aboutUs") },
    { href: "/support", label: t("nav.support") },
    { href: "/privacy", label: t("nav.privacy") },
  ];

  return (
    <footer className="mt-auto">
      {/* Main footer */}
      <div className="relative overflow-hidden bg-gradient-to-b from-emerald-600  to-emerald-800">
        {/* Subtle pattern overlay - pointer-events-none so it doesn't block clicks */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" />
        <Container>
          <div className="relative pt-8 md:pt-12">
            <div className="flex flex-col items-center text-center lg:flex-row lg:items-start lg:justify-between lg:text-left">
              {/* Brand */}
              <div className="max-w-sm">
                <Link
                  href="/"
                  className="inline-flex items-center gap-3 group transition-opacity hover:opacity-90"
                >
                  <div className="rounded-xl bg-white/10 p-2 ring-1 ring-white/10">
                    <Logo size={36} className="shrink-0" animated={false} />
                  </div>
                  <span className="text-lg font-semibold text-emerald-50">
                    VineNote Georgia
                  </span>
                </Link>
                <p className="mt-4 text-sm leading-relaxed text-slate-200">
                  {t("footer.tagline")}
                </p>
                {/* App Store */}
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center justify-center gap-2.5 rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/25 transition-all hover:bg-white/25 hover:ring-white/40"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  {t("cta.appStoreButton")}
                </a>
              </div>

              {/* Links & Contact */}
              <div className="mt-12 flex flex-col gap-10 sm:flex-row sm:gap-16 lg:mt-0">
                <div>
                  <h3 className="text-[14px] font-semibold uppercase tracking-widest text-emerald-100">
                    {t("footer.links")}
                  </h3>
                  <ul className="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-2 lg:justify-start">
                    {navLinks.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm text-emerald-100 transition-colors hover:text-white"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-emerald-300/70">
                    {t("support.contact.title")}
                  </h3>
                  <a
                    href="mailto:support@vinenote.app"
                    className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-100 transition-colors hover:text-white"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    {t("footer.email")}
                  </a>
                  <div className="mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-emerald-300/70">
                      {t("footer.followUs")}
                    </h3>
                    <div className="mt-3 flex gap-3">
                      {SOCIAL_LINKS.map(({ href, label, icon }) => (
                        <a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-white/10 p-2.5 text-emerald-100 ring-1 ring-white/10 transition-all hover:bg-white/20 hover:text-white hover:ring-white/20"
                          aria-label={label}
                        >
                          {icon}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
        {/* Bottom bar */}
        <Container className="relative z-10 gap-4 py-5 sm:flex-row">
          <p className="text-sm text-center text-emerald-200/70">
            {t("footer.copyright")} - {new Date().getFullYear()}
          </p>
          <Link
            href="/admin/login"
            className="text-xs text-emerald-200/60 transition-colors hover:text-emerald-100"
          >
            {t("footer.admin")}
          </Link>
        </Container>
      </div>
    </footer>
  );
}
