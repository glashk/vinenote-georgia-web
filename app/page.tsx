import dynamic from "next/dynamic";
import type { Metadata } from "next";
import ListingCardSkeleton from "@/components/ListingCardSkeleton";

const MarketClient = dynamic(() => import("@/app/market/MarketClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen py-4 sm:py-8 px-4 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 sm:mb-8 bg-white rounded-2xl border border-slate-200/80 overflow-visible animate-pulse">
          <div className="p-4 space-y-4">
            <div className="h-12 rounded-2xl bg-slate-200 w-full max-w-md" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 rounded-xl bg-slate-200 w-20" />
              ))}
            </div>
          </div>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "VineNote Georgia - Market",
  description:
    "Browse and buy grapes, wine, and vineyard products from Georgian winemakers. VineNote Georgia marketplace.",
  openGraph: {
    title: "VineNote Georgia - Market",
    description:
      "Browse and buy grapes, wine, and vineyard products from Georgian winemakers.",
    url: "https://vinenote.app",
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
  return <MarketClient />;
}
