import dynamic from "next/dynamic";

const VineyardDetailClient = dynamic(() => import("./VineyardDetailClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center">
      <div className="animate-pulse text-slate-500">Loading…</div>
    </div>
  ),
});

export default function VineyardDetailPage() {
  return <VineyardDetailClient />;
}
