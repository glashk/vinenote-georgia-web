import dynamic from "next/dynamic";
import type { Metadata } from "next";

const VineyardsClient = dynamic(() => import("./VineyardsClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center">
      <div className="animate-pulse text-slate-500">Loading…</div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "My Vineyards | VineNote Georgia",
  description: "Manage your vineyard blocks",
};

export default function VineyardsPage() {
  return <VineyardsClient />;
}
