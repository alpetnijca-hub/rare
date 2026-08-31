import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { siteConfig } from "@/config/site";
import "./globals.css";

/**
 * Wurzel-Layout: lädt Schriften und Grundstile.
 * Die sichtbare Rahmenstruktur unterscheidet sich je Bereich:
 *   src/app/(shop)/layout.tsx  – Kopf- und Fussbereich des Shops
 *   src/app/admin/layout.tsx   – Adminbereich ohne Shop-Navigation
 */

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Das Bild, das erscheint, wenn jemand einen Link auf diese Seite teilt.
 *
 * Ohne dieses Bild zeigen WhatsApp, Instagram und Co. nur einen nackten Link
 * – für einen Shop, dessen Besucher fast alle über eine Nachricht oder eine
 * Story kommen, ist das die verschenkteste Fläche überhaupt.
 *
 * Bewusst als Eintrag in den Metadaten und nicht als Datei `opengraph-image`
 * neben dieser: Die Dateiform hat Vorrang vor allem, was `generateMetadata`
 * setzt, und hätte damit auf **jeder** Produktseite den Duft durch dieses
 * allgemeine Bild ersetzt. So gilt es überall – ausser dort, wo ein
 * passenderes Bild bereitsteht.
 */
const socialPreviewImage = {
  url: "/vorschaubild.jpg",
  width: 1200,
  height: 630,
  alt: `${siteConfig.name} – ${siteConfig.tagline}`,
} as const;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} – ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "Parfüm",
    "Duftalternative",
    "Abfüllungen",
    "Duftproben",
    "Nischendüfte",
  ],
  authors: [{ name: siteConfig.name }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "de_CH",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} – ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [socialPreviewImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} – ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [socialPreviewImage.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-dvh bg-ink text-cream">{children}</body>
    </html>
  );
}
