import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://apotek-erp.vercel.app";
const TITLE = "Pharmacy Store | Seawise Studio";
const DESCRIPTION =
  "Sistem manajemen apotek: dashboard analitik real-time, kasir & resep, stok & kadaluarsa, order terpandu, pembayaran faktur, hingga laporan SIPNAP, dalam satu aplikasi.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Pharmacy Store",
  },
  description: DESCRIPTION,
  applicationName: "Pharmacy Store",
  keywords: [
    "aplikasi apotek", "software apotek", "ERP apotek", "sistem manajemen apotek",
    "POS apotek", "laporan SIPNAP", "stok obat", "kadaluarsa obat", "pharmacy management system",
  ],
  authors: [{ name: "Seawise Creative" }],
  creator: "Seawise Creative",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: "Pharmacy Store",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e3a2c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  );
}
