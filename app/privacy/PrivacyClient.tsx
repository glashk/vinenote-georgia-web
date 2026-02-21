"use client";

import Container from "@/components/Container";
import AnimatedSection from "@/components/AnimatedSection";
import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";

export default function PrivacyClient() {
  const { t, getArray } = useLanguage();

  const sections = [
    {
      title: t("privacy.sections.introduction.title"),
      content: <p>{t("privacy.sections.introduction.content")}</p>,
    },
    {
      title: t("privacy.sections.informationWeCollect.title"),
      content: (
        <>
          <p className="mb-3">{t("privacy.sections.informationWeCollect.intro")}</p>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">
            {t("privacy.sections.informationWeCollect.youProvide.title")}
          </h3>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>
              {(() => {
                const emailText = t("privacy.sections.informationWeCollect.youProvide.email");
                const parts = emailText.split(":");
                return parts.length > 1 ? (
                  <>
                    <strong>{parts[0]}:</strong> {parts.slice(1).join(":").trim()}
                  </>
                ) : (
                  emailText
                );
              })()}
            </li>
            <li>
              {(() => {
                const userContentText = t("privacy.sections.informationWeCollect.youProvide.userContent");
                const parts = userContentText.split(":");
                return parts.length > 1 ? (
                  <>
                    <strong>{parts[0]}:</strong> {parts.slice(1).join(":").trim()}
                    <ul className="list-circle pl-6 mt-2 space-y-1">
                      {getArray("privacy.sections.informationWeCollect.youProvide.userContentItems").map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <>
                    {userContentText}
                    <ul className="list-circle pl-6 mt-2 space-y-1">
                      {getArray("privacy.sections.informationWeCollect.youProvide.userContentItems").map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </>
                );
              })()}
            </li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">
            {t("privacy.sections.informationWeCollect.automaticallyCollected.title")}
          </h3>
          <p>{t("privacy.sections.informationWeCollect.automaticallyCollected.content")}</p>
        </>
      ),
    },
    {
      title: t("privacy.sections.howWeUse.title"),
      content: (
        <>
          <p className="mb-3">{t("privacy.sections.howWeUse.intro")}</p>
          <ul className="list-disc pl-6 space-y-2">
            {getArray("privacy.sections.howWeUse.items").map((item: string, idx: number) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </>
      ),
    },
    {
      title: t("privacy.sections.offlineUsage.title"),
      content: <p>{t("privacy.sections.offlineUsage.content")}</p>,
    },
    {
      title: t("privacy.sections.dataSharing.title"),
      content: (
        <>
          <p className="mb-3">{t("privacy.sections.dataSharing.intro")}</p>
          <ul className="list-disc pl-6 space-y-2">
            {[
              "privacy.sections.dataSharing.serviceProviders",
              "privacy.sections.dataSharing.legalRequirements",
              "privacy.sections.dataSharing.businessTransfers",
            ].map((key, idx) => {
              const text = t(key);
              const parts = text.split(":");
              return (
                <li key={idx}>
                  {parts.length > 1 ? (
                    <>
                      <strong>{parts[0]}:</strong> {parts.slice(1).join(":").trim()}
                    </>
                  ) : (
                    text
                  )}
                </li>
              );
            })}
          </ul>
        </>
      ),
    },
    {
      title: t("privacy.sections.dataSecurity.title"),
      content: <p>{t("privacy.sections.dataSecurity.content")}</p>,
    },
    {
      title: t("privacy.sections.dataRetention.title"),
      content: <p>{t("privacy.sections.dataRetention.content")}</p>,
    },
    {
      title: t("privacy.sections.yourRights.title"),
      content: (
        <>
          <p className="mb-3">{t("privacy.sections.yourRights.intro")}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              {(() => {
                const text = t("privacy.sections.yourRights.access");
                const parts = text.split(":");
                return parts.length > 1 ? (
                  <>
                    <strong>{parts[0]}:</strong> {parts.slice(1).join(":").trim()}
                  </>
                ) : (
                  text
                );
              })()}
            </li>
            <li>
              {(() => {
                const text = t("privacy.sections.yourRights.correction");
                const parts = text.split(":");
                return parts.length > 1 ? (
                  <>
                    <strong>{parts[0]}:</strong> {parts.slice(1).join(":").trim()}
                  </>
                ) : (
                  text
                );
              })()}
            </li>
            <li>
              {(() => {
                const text = t("privacy.sections.yourRights.deletion");
                const parts = text.split(":");
                return (
                  <>
                    {parts.length > 1 ? (
                      <>
                        <strong>{parts[0]}:</strong> {parts.slice(1).join(":").trim()}{" "}
                      </>
                    ) : (
                      <>
                        {text}{" "}
                      </>
                    )}
                    <a
                      href="mailto:support@vinenote.app"
                      className="vn-link transition-colors"
                    >
                      support@vinenote.app
                    </a>
                    . {t("privacy.sections.yourRights.deletionNote")}
                  </>
                );
              })()}
            </li>
            <li>
              {(() => {
                const text = t("privacy.sections.yourRights.dataExport");
                const parts = text.split(":");
                return parts.length > 1 ? (
                  <>
                    <strong>{parts[0]}:</strong> {parts.slice(1).join(":").trim()}
                  </>
                ) : (
                  text
                );
              })()}
            </li>
            <li>
              {(() => {
                const text = t("privacy.sections.yourRights.accountDeactivation");
                const parts = text.split(":");
                return parts.length > 1 ? (
                  <>
                    <strong>{parts[0]}:</strong> {parts.slice(1).join(":").trim()}
                  </>
                ) : (
                  text
                );
              })()}
            </li>
          </ul>
        </>
      ),
    },
    {
      title: t("privacy.sections.childrensPrivacy.title"),
      content: <p>{t("privacy.sections.childrensPrivacy.content")}</p>,
    },
    {
      title: t("privacy.sections.internationalTransfers.title"),
      content: <p>{t("privacy.sections.internationalTransfers.content")}</p>,
    },
    {
      title: t("privacy.sections.changesToPolicy.title"),
      content: <p>{t("privacy.sections.changesToPolicy.content")}</p>,
    },
    {
      title: t("privacy.sections.contactUs.title"),
      content: (
        <>
          <p>{t("privacy.sections.contactUs.content")}</p>
          <p className="mt-4">
            <strong>{t("privacy.sections.contactUs.email")}</strong>{" "}
            <a
              href="mailto:support@vinenote.app"
              className="vn-link transition-colors"
            >
              support@vinenote.app
            </a>
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Top hero */}
      <section className="relative overflow-hidden py-14 sm:py-20">
        <div className="absolute inset-0">
          <Image
            src="/Grapevines-scaled__1_-8ed7f296-bb5c-4202-adaf-aaf65e79b8b6.png"
            alt="Grapevines"
            fill
            className="object-cover"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-transparent" />
        </div>
        <Container>
          <div className="relative z-10 max-w-4xl mx-auto">
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
                    {t("privacy.title")}
                  </h1>
                  <p className="mt-3 text-sm text-slate-600">
                    {t("privacy.lastUpdated")}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </Container>
      </section>

      <section className="py-10 sm:py-14">
        <Container>
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-6 lg:gap-8 lg:grid-cols-12 items-start">
              {/* TOC (desktop) */}
              <aside className="hidden lg:block lg:col-span-4">
                <div className="vn-glass vn-card vn-card-pad sticky top-24">
                  <div className="text-sm font-semibold text-slate-900 mb-3">
                    {t("privacy.title")}
                  </div>
                  <nav className="space-y-2">
                    {sections.map((s, idx) => (
                      <a
                        key={s.title}
                        href={`#privacy-section-${idx}`}
                        className="block text-sm text-slate-700 hover:text-slate-950 transition-colors"
                      >
                        <span className="inline-flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-vineyard-700/70" />
                          <span className="line-clamp-2">{s.title}</span>
                        </span>
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Content */}
              <div className="lg:col-span-8">
                <div className="space-y-6">
                  {sections.map((section, index) => (
                    <AnimatedSection
                      key={section.title}
                      delay={150 + index * 40}
                    >
                      <section
                        id={`privacy-section-${index}`}
                        className="vn-glass vn-card vn-card-pad scroll-mt-28"
                      >
                        <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                          {section.title}
                        </h2>
                        <div className="prose prose-slate max-w-none text-slate-700">
                          {section.content}
                        </div>
                      </section>
                    </AnimatedSection>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
