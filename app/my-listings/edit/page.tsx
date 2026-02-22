import type { Metadata } from "next";
import { Suspense } from "react";
import EditPageWrapper from "./EditPageWrapper";

export const metadata: Metadata = {
  title: "Edit Listing - VineNote Georgia",
  description: "Edit your marketplace listing.",
};

export default function EditListingPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-vineyard-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <EditPageWrapper />
    </Suspense>
  );
}
