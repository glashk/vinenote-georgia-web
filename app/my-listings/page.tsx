import type { Metadata } from "next";
import MyListingsClient from "./MyListingsClient";

export const metadata: Metadata = {
  title: "My Listings - VineNote Georgia",
  description: "Manage your marketplace listings.",
};

export default function MyListingsPage() {
  return <MyListingsClient />;
}
