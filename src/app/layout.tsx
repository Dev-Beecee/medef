import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Header from "@/components/Header";
import FooterSection from "@/components/FooterSection";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trophées des Entreprises et Administrations Inclusives 2025 – Martinique",
  description: "Valorisez votre engagement pour l'inclusion en Martinique ! Participez aux Trophées des Entreprises et Administrations Inclusives avant le 2 novembre.",
  openGraph: {
    title: "Trophées des Entreprises et Administrations Inclusives 2025 – Martinique",
    description: "Valorisez votre engagement pour l'inclusion en Martinique ! Participez aux Trophées des Entreprises et Administrations Inclusives avant le 2 novembre.",
    url: "https://seeph-medef-martinique.fr",
    siteName: "SEEPH MEDEF Martinique",
    images: [
      {
        url: "/seeph-partage.jpg",
        width: 1200,
        height: 630,
        alt: "Trophées des Entreprises et Administrations Inclusives 2025 – Martinique",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trophées des Entreprises et Administrations Inclusives 2025 – Martinique",
    description: "Valorisez votre engagement pour l'inclusion en Martinique ! Participez aux Trophées des Entreprises et Administrations Inclusives avant le 2 novembre.",
    images: ["/seeph-partage.jpg"],
  },
  metadataBase: new URL("https://seeph-medef-martinique.fr"),
  alternates: {
    canonical: "https://seeph-medef-martinique.fr",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        {children}
        <FooterSection />
        <Toaster 
          position="top-right"
          expand={true}
          richColors={true}
          closeButton={true}
        />
      </body>
    </html>
  );
}
