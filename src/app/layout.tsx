import type { Metadata } from "next";
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
  title: "SBFiles — Fichiers de reprogrammation moteur",
  description:
    "Fichiers ECU pour voiture, camion, moto, agricole. Gains visibles avant achat, téléchargement immédiat.",
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
