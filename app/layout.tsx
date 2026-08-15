import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../lib/i18n";
import { ThemeProvider, ThemeScript } from "../lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://sehatera.vercel.app";
const TITLE = "Sehatera — sistem apotek, klinik, dan faskes";
const DESCRIPTION =
  "Sistem manajemen apotek: kasir & resep, stok dengan batch dan kadaluarsa, order terpandu, pembayaran faktur, hingga laporan SIPNAP, dalam satu aplikasi.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Sehatera",
  },
  description: DESCRIPTION,
  applicationName: "Sehatera",
  keywords: [
    "aplikasi apotek", "software apotek", "ERP apotek", "sistem manajemen apotek",
    "POS apotek", "laporan SIPNAP", "stok obat", "kadaluarsa obat",
    "sistem klinik", "rekam medis elektronik", "pharmacy management system",
  ],
  authors: [{ name: "Seawise Creative" }],
  creator: "Seawise Creative",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: "Sehatera",
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
  // Warna bilah browser mengikuti tema aktif, bukan satu hex tetap yang akan
  // salah separuh waktu begitu ada tema kedua.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf7f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0714" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      // Tema bawaan ditulis di server juga, bukan hanya oleh ThemeScript.
      // Kalau hanya skrip yang mengisinya, halaman pertama sempat terlukis
      // tanpa satu pun token warna.
      data-theme="sunrise-sorbet"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
