"use client";

import Link from "next/link";
import Container from "./Container";
import Logo from "./Logo";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  const navLinks = [
    { href: "/", label: t("nav.aboutUs") },
    { href: "/market", label: t("nav.market") },
    { href: "/support", label: t("nav.support") },
    { href: "/privacy", label: t("nav.privacy") },
  ];

  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-slate-50/80 backdrop-blur-sm">
      <Container>
        <div className="py-10 md:py-12">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2.5 group transition-opacity hover:opacity-90"
              >
                <Logo size={40} className="shrink-0" animated={false} />
                <span className="text-base font-semibold text-slate-900">
                  VineNote Georgia
                </span>
              </Link>
              <p className="mt-4 max-w-sm text-sm text-slate-600 leading-relaxed">
                {t("footer.tagline")}
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                {t("footer.links")}
              </h3>
              <ul className="space-y-3">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-slate-700 hover:text-vineyard-700 hover:underline underline-offset-4 transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                {t("support.contact.title")}
              </h3>
              <a
                href="mailto:support@vinenote.app"
                className="text-slate-700 hover:text-vineyard-700 hover:underline underline-offset-4 transition-colors text-sm"
              >
                {t("footer.email")}
              </a>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/60">
            <p className="text-sm text-slate-500">{t("footer.copyright")}</p>
            <Link
              href="/admin/login"
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
