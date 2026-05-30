"use client";

import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { APP_STORE_URL, GOOGLE_PLAY_URL } from "@/lib/appLinks";

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3.609 1.814 13.792 12 3.61 22.186a1.003 1.003 0 0 1-.61-.92V2.734a1.003 1.003 0 0 1 .609-.92zm10.89 10.893 2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198 2.807 1.626a1.002 1.002 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658 16.8 8.99l-2.303 2.303-8.633-8.635z" />
    </svg>
  );
}

type Variant = "footer" | "primary" | "cta";

interface AppDownloadButtonsProps {
  variant?: Variant;
  className?: string;
  showAppIcon?: boolean;
}

export default function AppDownloadButtons({
  variant = "primary",
  className = "",
  showAppIcon = true,
}: AppDownloadButtonsProps) {
  const { t } = useLanguage();

  const storeLinks = [
    {
      href: APP_STORE_URL,
      label: t("cta.appStoreButton"),
      icon: <AppleIcon className="h-5 w-5" />,
    },
    {
      href: GOOGLE_PLAY_URL,
      label: t("cta.googlePlayButton"),
      icon: <GooglePlayIcon className="h-5 w-5" />,
    },
  ];

  if (variant === "footer") {
    return (
      <div className={`mt-6 flex flex-col sm:flex-row flex-wrap gap-3 ${className}`}>
        {storeLinks.map(({ href, label, icon }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/25 transition-all hover:bg-white/25 hover:ring-white/40"
          >
            {icon}
            {label}
          </a>
        ))}
      </div>
    );
  }

  const btnClass = "vn-btn vn-btn-primary";

  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${className}`}>
      {storeLinks.map(({ href, label, icon }, i) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
        >
          {showAppIcon && i === 0 ? (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-white/20 border border-white/25 overflow-hidden shrink-0">
              <Image
                src="/logo.png"
                alt=""
                width={28}
                height={28}
                className="w-full h-full object-contain"
                aria-hidden
              />
            </span>
          ) : (
            icon
          )}
          {label}
        </a>
      ))}
    </div>
  );
}
