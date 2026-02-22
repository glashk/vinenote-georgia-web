import { Suspense } from "react";
import type { Metadata } from "next";
import MarketClient from "@/app/market/MarketClient";

export const metadata: Metadata = {
  title: "VineNote Georgia - Market",
  description:
    "Browse and buy grapes, wine, and vineyard products from Georgian winemakers. VineNote Georgia marketplace.",
  openGraph: {
    title: "VineNote Georgia - Market",
    description:
      "Browse and buy grapes, wine, and vineyard products from Georgian winemakers.",
    url: "https://vinenote.ge",
    images: [
      {
        url: "/Grapevines-scaled-e5b6bd5d-a447-4b5f-9da8-6c8c55461efd.png",
        width: 1200,
        height: 630,
        alt: "VineNote Georgia - Market",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VineNote Georgia - Market",
    description:
      "Browse and buy grapes, wine, and vineyard products from Georgian winemakers.",
    images: ["/Grapevines-scaled-e5b6bd5d-a447-4b5f-9da8-6c8c55461efd.png"],
  },
};

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex justify-center items-center">
          <div className="w-10 h-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MarketClient />
    </Suspense>
  );
}
