import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/contexts/LanguageContext";
import FirebaseAnalytics from "@/components/FirebaseAnalytics";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://vinenote.ge"),
  title: "VineNote Georgia - Vineyard & Qvevri Management",
  description: "Simple vineyard & qvevri management for Georgian winemakers",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  other: {
    // iOS Smart App Banner (Safari)
    "apple-itunes-app":
      "app-id=6758243424, app-argument=https://apps.apple.com/app/vinenote-georgia/id6758243424",
  },
  openGraph: {
    title: "VineNote Georgia - Vineyard & Qvevri Management",
    description: "Simple vineyard & qvevri management for Georgian winemakers",
    url: "https://vinenote.ge",
    siteName: "VineNote Georgia",
    images: [
      {
        url: "/Grapevines-scaled-e5b6bd5d-a447-4b5f-9da8-6c8c55461efd.png",
        width: 1200,
        height: 630,
        alt: "VineNote Georgia - Vineyard Management",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VineNote Georgia - Vineyard & Qvevri Management",
    description: "Simple vineyard & qvevri management for Georgian winemakers",
    images: ["/Grapevines-scaled-e5b6bd5d-a447-4b5f-9da8-6c8c55461efd.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://www.gstatic.com" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link
          rel="preload"
          href="/Grapevines-scaled-e5b6bd5d-a447-4b5f-9da8-6c8c55461efd.png"
          as="image"
        />
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=typeof localStorage!=='undefined'?localStorage.getItem("language"):null;window.__LOCALE=(s==='ka'||s==='en')?s:'en';})();`,
          }}
        />
        <LanguageProvider>
          <FirebaseAnalytics />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
