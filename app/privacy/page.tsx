import type { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = {
  title: "Privacy Policy - VineNote Georgia",
  description:
    "Privacy Policy for VineNote Georgia app. Learn how we collect, use, and protect your data.",
  openGraph: {
    title: "Privacy Policy - VineNote Georgia",
    description:
      "Privacy Policy for VineNote Georgia app. Learn how we collect, use, and protect your data.",
    url: "https://vinenote.app/privacy",
    images: [
      {
        url: "/Glass-over-Qvevri-1-1024x850-7233ca7d-92db-4916-bb63-677ca05a2ccc.png",
        width: 1200,
        height: 630,
        alt: "VineNote Georgia Privacy Policy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy - VineNote Georgia",
    description:
      "Privacy Policy for VineNote Georgia app. Learn how we collect, use, and protect your data.",
    images: [
      "/Glass-over-Qvevri-1-1024x850-7233ca7d-92db-4916-bb63-677ca05a2ccc.png",
    ],
  },
};

export default function Privacy() {
  return <PrivacyClient />;
}
