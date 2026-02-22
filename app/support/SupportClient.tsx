"use client";

import Link from "next/link";
import Image from "next/image";
import Container from "@/components/Container";
import AnimatedSection from "@/components/AnimatedSection";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SupportClient() {
  const { t } = useLanguage();

  const faqs = [
    {
      question: t("support.faq.getStarted.question"),
      answer: t("support.faq.getStarted.answer"),
    },
    {
      question: t("support.faq.offline.question"),
      answer: t("support.faq.offline.answer"),
    },
    {
      question: t("support.faq.export.question"),
      answer: t("support.faq.export.answer"),
    },
    {
      question: t("support.faq.security.question"),
      answer: t("support.faq.security.answer"),
      link: "/privacy",
      linkText: t("nav.privacy"),
    },
    {
      question: t("support.faq.devices.question"),
      answer: t("support.faq.devices.answer"),
    },
    {
      question: t("support.faq.deleteAccount.question"),
      answer: t("support.faq.deleteAccount.answer"),
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Top hero */}
      <section className="relative overflow-hidden py-14 sm:py-20">
        <div className="absolute inset-0">
          <Image
            src="/dan-meyers-0AgtPoAARtE-unsplash-541a468a-f343-4b2a-9896-214be82fd831.png"
            alt="Vineyard"
            fill
            className="object-cover"
            loading="lazy"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-transparent" />
        </div>
        <Container>
          <div className="relative z-10 max-w-3xl mx-auto">
            <AnimatedSection>
              <div className="vn-glass-hero vn-card vn-card-pad text-center sm:text-left">
                <div className="relative">
                  <div className="flex items-center justify-center sm:justify-start gap-3 mb-5">
                    <span className="vn-pill">
                      <span className="inline-flex w-2 h-2 rounded-full bg-vineyard-700" />
                      VineNote Georgia
                    </span>
                  </div>

                  <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-950 via-slate-900 to-vineyard-900">
                    {t("support.title")}
                  </h1>
                  <p className="mt-3 text-base sm:text-lg text-slate-700">
                    {t("support.about.title")}
                  </p>

                  <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center sm:justify-start gap-3">
                    <a
                      href="mailto:support@vinenote.app"
                      className="vn-btn vn-btn-primary"
                    >
                      {t("footer.email")}
                    </a>
                    <Link href="/privacy" className="vn-btn vn-btn-ghost">
                      {t("nav.privacy")}
                    </Link>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </Container>
      </section>

      <section className="py-10 sm:py-14">
        <Container>
          <div className="max-w-3xl mx-auto">
            <AnimatedSection delay={100}>
              <div className="vn-glass vn-card vn-card-pad mb-10">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                  {t("support.about.title")}
                </h2>
                <p className="text-slate-700 mb-4">
                  {t("support.about.description1")}
                </p>
                <p className="text-slate-700">{t("support.about.description2")}</p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="vn-glass vn-card vn-card-pad mb-10">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                  {t("support.contact.title")}
                </h2>
                <p className="text-slate-700 mb-5">
                  {t("support.contact.description")}
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <a
                    href="mailto:support@vinenote.app"
                    className="vn-btn vn-btn-primary"
                  >
                    {t("footer.email")}
                  </a>
                  <Link href="/privacy" className="vn-btn vn-btn-ghost">
                    {t("nav.privacy")}
                  </Link>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={300}>
              <div className="mb-12">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                  {t("support.faq.title")}
                </h2>

                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <AnimatedSection key={faq.question} delay={400 + index * 50}>
                      <div className="vn-glass vn-card vn-card-pad transition-all duration-300 hover:-translate-y-0.5">
                        <div className="flex gap-4">
                          <div className="w-1.5 rounded-full bg-vineyard-700/70 shrink-0" />
                          <div className="min-w-0">
                            <h3 className="text-xl font-semibold text-slate-900 mb-2">
                              {faq.question}
                            </h3>
                            <p className="text-slate-700">
                              {faq.answer}
                              {faq.link && (
                                <>
                                  {" "}
                                  <Link
                                    href={faq.link}
                                    className="vn-link transition-colors"
                                  >
                                    {faq.linkText}
                                  </Link>
                                  .
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </Container>
      </section>
    </div>
  );
}
