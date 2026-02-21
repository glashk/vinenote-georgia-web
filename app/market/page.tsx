import { Suspense } from "react";
import MarketClient from "./MarketClient";

export const metadata = {
  title: "Market - VineNote Georgia",
  description: "Browse marketplace listings from VineNote Georgia users",
};

export default function MarketPage() {
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
