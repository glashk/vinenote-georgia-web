"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const GA_MEASUREMENT_ID = "G-7BGKPELHWJ";

/**
 * Loads gtag.js only after requestIdleCallback or 3s timeout.
 * Does NOT load on initial page load - defers until browser is idle.
 * Only enabled in production.
 */
export default function GoogleAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;

    const load = () => setShouldLoad(true);

    const useIdle =
      typeof requestIdleCallback !== "undefined" &&
      typeof cancelIdleCallback !== "undefined";
    const id = useIdle
      ? requestIdleCallback(load, { timeout: 3000 })
      : setTimeout(load, 3000);

    return () =>
      useIdle ? cancelIdleCallback(id as number) : clearTimeout(id);
  }, []);

  if (!shouldLoad || process.env.NODE_ENV !== "production") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
      <Script id="gtag-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
