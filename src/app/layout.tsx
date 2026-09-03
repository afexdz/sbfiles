import type { Metadata, Viewport } from "next";
import { Saira_Condensed, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const saira = Saira_Condensed({
  variable: "--font-saira",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const ibm = IBM_Plex_Sans({
  variable: "--font-ibm",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sbfiles.com"),
  title: {
    default:  "SBFiles — Fichiers de reprogrammation moteur",
    template: "%s | SBFiles",
  },
  description:
    "Le catalogue algérien de fichiers de reprogrammation moteur. Voiture, camion, moto, agricole, engins de chantier. Gains visibles avant achat, téléchargement immédiat, checksum corrigé.",
  icons: {
    icon:  ["/favicon.ico", "/favicon-32x32.png", "/favicon-192x192.png"],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type:     "website",
    locale:   "fr_FR",
    siteName: "SBFiles",
    images:   ["/og-image.png"],
  },
  twitter: {
    card:   "summary_large_image",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#E1091B",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${saira.variable} ${ibm.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
