"use client";

import { useSearchParams } from "next/navigation";
import EditListingClient from "./EditListingClient";

export default function EditPageWrapper() {
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-600">
        <p>No listing selected.</p>
      </div>
    );
  }
  return <EditListingClient listingId={id} />;
}
