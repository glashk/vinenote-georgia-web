"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAnalyticsLazy } from "@/lib/firebase";

export default function FirebaseAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

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
  }, [pathname]);

  return null;
}
