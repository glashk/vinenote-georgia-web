"use client";

import Link from "next/link";
import Container from "./Container";
import Logo from "./Logo";
import { useLanguage } from "@/contexts/LanguageContext";

const APP_STORE_URL =
  "https://apps.apple.com/app/vinenote-georgia/id6758243424";

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
      <div className="relative overflow-hidden bg-gradient-to-b from-emerald-700 via-emerald-600 to-emerald-700">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" />
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
                  <span className="text-lg font-semibold text-white">
                    VineNote Georgia
                  </span>
                </Link>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">
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
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-emerald-300/70">
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
                </div>
              </div>
            </div>
          </div>
        </Container>
        {/* Bottom bar */}

        <Container className="py-2">
          <p className="text-sm text-emerald-200/70 text-center">
            {t("footer.copyright")} - {new Date().getFullYear()}
          </p>
        </Container>
        <Link
          href="/admin/login"
          className="text-xs text-emerald-200/60 transition-colors hover:text-emerald-100"
        >
          {t("footer.admin")}
        </Link>
      </div>
    </footer>
  );
}
