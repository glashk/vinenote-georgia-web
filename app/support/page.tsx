import type { Metadata } from "next";
import SupportClient from "./SupportClient";

export const metadata: Metadata = {
  title: "Support - VineNote Georgia",
  description: "Get help with VineNote Georgia app. Contact support or find answers to common questions.",
  openGraph: {
    title: "Support - VineNote Georgia",
    description: "Get help with VineNote Georgia app. Contact support or find answers to common questions.",
    url: "https://vinenote.ge/support",
    images: [
      {
        url: "/winery-khareba-7-94693285-0c78-4f04-bcb5-e37e3bc0758e.png",
        width: 1200,
        height: 630,
        alt: "VineNote Georgia Support",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Support - VineNote Georgia",
    description: "Get help with VineNote Georgia app. Contact support or find answers to common questions.",
    images: ["/winery-khareba-7-94693285-0c78-4f04-bcb5-e37e3bc0758e.png"],
  },
};

export default function Support() {
  return <SupportClient />;
}
