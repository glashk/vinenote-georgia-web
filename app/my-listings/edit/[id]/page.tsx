import type { Metadata } from "next";
import EditListingClient from "./EditListingClient";

export const metadata: Metadata = {
  title: "Edit Listing - VineNote Georgia",
  description: "Edit your marketplace listing.",
};

type Props = { params: Promise<{ id: string }> };

export default async function EditListingPage({ params }: Props) {
  const { id } = await params;
  return <EditListingClient listingId={id} />;
}
