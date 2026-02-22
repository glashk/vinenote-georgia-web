"use client";

import Image from "next/image";
import Link from "next/link";
import Container from "@/components/Container";
import AnimatedSection from "@/components/AnimatedSection";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HomeClient() {
  const { t } = useLanguage();
  const APP_STORE_URL =
    "https://apps.apple.com/app/vinenote-georgia/id6758243424";

  const features = [
    {
      title: t("features.vineyardTracking.title"),
      description: t("features.vineyardTracking.description"),
      image: "/Grapevines-scaled-e5b6bd5d-a447-4b5f-9da8-6c8c55461efd.png",
    },
    {
      title: t("features.harvestRecords.title"),
      description: t("features.harvestRecords.description"),
      image:
        "/dan-meyers-0AgtPoAARtE-unsplash-541a468a-f343-4b2a-9896-214be82fd831.png",
    },
    {
      title: t("features.qvevriManagement.title"),
      description: t("features.qvevriManagement.description"),
      image:
        "/Glass-over-Qvevri-1-1024x850-7233ca7d-92db-4916-bb63-677ca05a2ccc.png",
    },
    {
      title: t("features.wineBatchHistory.title"),
      description: t("features.wineBatchHistory.description"),
      image:
        "/Tasting-wine-from-the-Qvevri-2-1024x614-56025752-9243-4bb9-b433-0f34041f0d94.png",
    },
    {
      title: t("features.offlineMode.title"),
      description: t("features.offlineMode.description"),
      image: "/Grapevines-scaled__1_-8ed7f296-bb5c-4202-adaf-aaf65e79b8b6.png",
    },
    {
      title: t("features.simpleIntuitive.title"),
      description: t("features.simpleIntuitive.description"),
      image:
        "/shutterstock_1815556148-scaled-60bf3b53-c91e-4ec7-bef3-7cdb72616bd8.png",
    },
  ];

  const perfectFor = [
    {
      icon: (
        <svg
          className="w-10 h-10 text-vineyard-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      title: t("perfectFor.smallWineries.title"),
      description: t("perfectFor.smallWineries.description"),
      image: "/winery-khareba-7-94693285-0c78-4f04-bcb5-e37e3bc0758e.png",
    },
    {
      icon: (
        <svg
          className="w-10 h-10 text-vineyard-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
      title: t("perfectFor.familyVineyards.title"),
      description: t("perfectFor.familyVineyards.description"),
      image:
        "/Tour-images-photos-1280-_-768px-1024x614-0d8cc219-797c-495b-8637-13b8e6c2f309.png",
    },
    {
      icon: (
        <svg
          className="w-10 h-10 text-vineyard-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: t("perfectFor.qvevriWinemakers.title"),
      description: t("perfectFor.qvevriWinemakers.description"),
      image: "/8V7A8870-Large-b2b2e31a-2493-4c56-948c-ed4ecde276a5.png",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section with Background Image */}
      <section className="relative py-20 sm:py-32 overflow-hidden min-h-[70vh] flex items-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/Grapevines-scaled-e5b6bd5d-a447-4b5f-9da8-6c8c55461efd.png"
            alt="Vineyard"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/10" />
        </div>

        <Container>
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="grid gap-6 lg:gap-8 items-start lg:grid-cols-12">
              <div className="lg:col-span-7">
                <AnimatedSection delay={0}>
                  <div className="vn-glass-hero vn-card vn-card-pad text-center sm:text-left">
                    <div className="relative">
                      <div className="flex items-center justify-center sm:justify-start gap-3 mb-5">
                        <span className="vn-pill">
                          <span className="inline-flex w-2 h-2 rounded-full bg-vineyard-700" />
                          VineNote Georgia
                        </span>
                      </div>

                      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-950 via-slate-900 to-vineyard-900">
                        {t("hero.title")}
                      </h1>

                      <p className="mt-4 text-xl sm:text-2xl text-slate-700 font-medium">
                        {t("hero.tagline")}
                      </p>

                      <p className="mt-4 text-base sm:text-lg text-slate-700 max-w-2xl sm:max-w-none">
                        {t("hero.description")}
                      </p>

                      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center sm:justify-start gap-3">
                        <a
                          href={APP_STORE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="vn-btn vn-btn-primary"
                        >
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-white/20 border border-white/25 overflow-hidden shrink-0">
                            <Image
                              src="/logo.png"
                              alt="VineNote Georgia app icon"
                              width={28}
                              height={28}
                              className="w-full h-full object-contain"
                            />
                          </span>
                          {t("cta.appStoreButton")}
                        </a>

                        <Link href="/" className="vn-btn vn-btn-ghost">
                          {t("nav.market")}
                        </Link>

                        <Link href="/support" className="vn-btn vn-btn-ghost">
                          {t("nav.support")}
                        </Link>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              </div>

              <div className="lg:col-span-5">
                <AnimatedSection delay={120}>
                  <div className="vn-glass-hero vn-card vn-card-pad text-center">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border ">
                        <Image
                          src="/logo.png"
                          alt="VineNote Georgia"
                          width={40}
                          height={40}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-slate-900">
                          {t("features.title")}
                        </div>
                        <div className="text-sm text-slate-600">
                          {t("cta.subtitle")}
                        </div>
                      </div>
                    </div>

                    <ul className="space-y-3 text-left">
                      {features.slice(0, 3).map((f) => (
                        <li key={f.title} className="flex gap-3">
                          <span className="mt-0.5 inline-flex w-6 h-6 items-center justify-center rounded-lg bg-white/45 border border-white/40 shrink-0">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              className="text-vineyard-800"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M20 6L9 17l-5-5"
                              />
                            </svg>
                          </span>
                          <div>
                            <div className="font-medium text-slate-900">
                              {f.title}
                            </div>
                            <div className="text-sm text-slate-600">
                              {f.description}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20">
        <Container>
          <AnimatedSection>
            <div className="vn-section-head">
              <span className="vn-pill">
                <span className="inline-flex w-2 h-2 rounded-full bg-vineyard-700" />
                VineNote
              </span>
              <h2 className="vn-section-title">{t("features.title")}</h2>
              <div className="vn-section-divider" />
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <AnimatedSection key={feature.title} delay={index * 100}>
                <div className="vn-glass vn-card vn-card-hover overflow-hidden group cursor-pointer">
                  <div className="relative h-52 overflow-hidden">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-wine-900/60 to-transparent" />
                  </div>
                  <div className="vn-card-pad">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-700">{feature.description}</p>
                    <div className="mt-5 flex items-center gap-2 text-sm font-medium text-vineyard-900">
                      <span>Learn more</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="opacity-70 group-hover:translate-x-0.5 transition-transform"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 12h14M13 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </Container>
      </section>

      {/* Who It's For Section */}
      <section className="py-16 sm:py-20 bg-vineyard-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/dan-meyers-0AgtPoAARtE-unsplash-541a468a-f343-4b2a-9896-214be82fd831.png"
            alt="Vineyard background"
            fill
            className="object-cover"
            loading="lazy"
            sizes="100vw"
          />
        </div>
        <Container>
          <AnimatedSection>
            <div className="vn-section-head relative z-10">
              <span className="vn-pill">
                <span className="inline-flex w-2 h-2 rounded-full bg-vineyard-700" />
                For wineries
              </span>
              <h2 className="vn-section-title">{t("perfectFor.title")}</h2>
              <div className="vn-section-divider" />
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative z-10">
            {perfectFor.map((item, index) => (
              <AnimatedSection key={item.title} delay={index * 150}>
                <div className="text-center group cursor-pointer vn-glass vn-card vn-card-pad vn-card-hover">
                  <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-wine-900/40 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/70 backdrop-blur-sm rounded-full w-20 h-20 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 border border-white/40">
                        {item.icon}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-700 transition-colors">
                    {item.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </Container>
      </section>

      {/* Call to Action */}
      <section className="py-16 sm:py-20 bg-wine-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/Grapevines-scaled__1_-8ed7f296-bb5c-4202-adaf-aaf65e79b8b6.png"
            alt="Vineyard"
            fill
            className="object-cover opacity-20"
            loading="lazy"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-wine-900/90" />
        </div>
        <div className="absolute inset-0 opacity-10 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
        </div>
        <Container>
          <div className="max-w-3xl mx-auto relative z-10">
            <div className="vn-glass-dark vn-card vn-card-pad text-center">
              <div className="relative">
                <div className="flex justify-center mb-5">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-white/20 bg-white/10 overflow-hidden">
                    <Image
                      src="/logo.png"
                      alt="VineNote Georgia app icon"
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                      priority={false}
                    />
                  </div>
                </div>

                <AnimatedSection delay={0}>
                  <h2 className="text-3xl sm:text-4xl font-semibold mb-3">
                    {t("cta.title")}
                  </h2>
                </AnimatedSection>
                <AnimatedSection delay={120}>
                  <p className="text-base sm:text-lg mb-8 text-white/80">
                    {t("cta.subtitle")}
                  </p>
                </AnimatedSection>

                <AnimatedSection delay={220}>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
                    <a
                      href={APP_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vn-btn vn-btn-primary"
                    >
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-white/20 border border-white/25 overflow-hidden shrink-0">
                        <Image
                          src="/logo.png"
                          alt="VineNote Georgia app icon"
                          width={28}
                          height={28}
                          className="w-full h-full object-contain"
                        />
                      </span>
                      {t("cta.appStoreButton")}
                    </a>

                    <Link
                      href="/"
                      className="vn-btn bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                    >
                      {t("nav.market")}
                    </Link>

                    <div
                      className="vn-btn bg-white/10 border border-white/20 text-white/80 cursor-not-allowed select-none"
                      aria-disabled="true"
                    >
                      {t("cta.googlePlayComingSoon")}
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
