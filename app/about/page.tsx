import type { Metadata } from "next";
import HomeClient from "@/app/HomeClient";

export const metadata: Metadata = {
  title: "About Us - VineNote Georgia",
  description:
    "Simple vineyard & qvevri management for Georgian winemakers. Track vineyards, harvest records, qvevri & tank management, and wine batch history.",
  openGraph: {
    title: "About Us - VineNote Georgia",
    description:
      "Simple vineyard & qvevri management for Georgian winemakers. Track vineyards, harvest records, qvevri & tank management, and wine batch history.",
    url: "https://vinenote.ge/about",
    images: [
      {
        url: "/Grapevines-scaled-e5b6bd5d-a447-4b5f-9da8-6c8c55461efd.png",
        width: 1200,
        height: 630,
        alt: "VineNote Georgia - Vineyard Management App",
      },
    ],
  },
};

export default function AboutPage() {
  return <HomeClient />;
}
