"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAnalyticsLazy } from "@/lib/firebase";

export default function FirebaseAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Defer analytics until after first paint to improve LCP
    const run = () => {
      getAnalyticsLazy().then((analytics) => {
      if (analytics) {
        import("firebase/analytics").then(({ logEvent }) => {
          const pagePath = pathname || window.location.pathname;
          logEvent(analytics, "page_view", {
            page_path: pagePath,
            page_title: document.title,
          });
        });
      }
    });
    };

    const useIdle =
      typeof requestIdleCallback !== "undefined" &&
      typeof cancelIdleCallback !== "undefined";
    const id = useIdle
      ? requestIdleCallback(run, { timeout: 2000 })
      : setTimeout(run, 1500);
    return () =>
      useIdle ? cancelIdleCallback(id as number) : clearTimeout(id);
  }, [pathname]);

  return null;
}
