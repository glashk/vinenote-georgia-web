"use client";

import Link from "next/link";
import Container from "./Container";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto">
      <div className="py-8">
        <Container>
          <div className="vn-glass-hero vn-card vn-card-pad text-center">
            <p className="text-slate-600 mb-2">{t("footer.copyright")}</p>
            <a
              href="mailto:support@vinenote.app"
              className="vn-link transition-colors"
            >
              {t("footer.email")}
            </a>
            <p className="mt-3">
              <Link
                href="/admin/login"
                className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
              >
                Admin
              </Link>
            </p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
