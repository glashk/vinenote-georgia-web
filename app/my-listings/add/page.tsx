import type { Metadata } from "next";
import AddListingClient from "./AddListingClient";

export const metadata: Metadata = {
  title: "Add Listing - Memarne",
  description: "Add a new marketplace listing.",
};

export default function AddListingPage() {
  return <AddListingClient />;
}
