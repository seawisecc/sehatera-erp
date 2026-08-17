import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../lib/i18n";
import { ThemeProvider, ThemeScript } from "../lib/theme";

/**
 * Tiga huruf, tiga tugas — sama seperti TokoKu, dan itu disengaja: dua produk
 * dari studio yang sama sebaiknya terbaca sebagai satu keluarga.
 *
 * Sebelumnya seluruh aplikasi memakai satu huruf (Geist, bawaan create-next-app)
 * untuk judul, isi, dan angka sekaligus. Akibatnya tidak ada hierarki: judul
 * halaman dan label kolom terbaca dengan bobot yang sama, dan mata tidak punya
 * pegangan saat memindai layar yang padat.
 */
const sora = Sora({            // judul — geometris, tegas
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({   // isi — dirancang untuk teks Indonesia
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Angka SELALU memakai huruf monospace ini: dosis, stok, harga, nomor batch,
 * nomor resep. Di aplikasi apotek angka bukan hiasan — "1" yang bisa dibaca
 * sebagai "l", atau "0" yang mirip "O", adalah kesalahan dosis yang menunggu
 * terjadi. JetBrains Mono membedakan keduanya secara jelas dan lebarnya tetap,
 * jadi kolom angka berbaris rapi tanpa trik tambahan.
 */
const jetbrains = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
  display: "swap",
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
  // Keempat tema terang, jadi bilah peramban satu warna saja — mengikuti
  // Vital Tide yang jadi bawaan.
  themeColor: "#f4fbfb",
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
      data-theme="vital-tide"
      suppressHydrationWarning
      className={`${sora.variable} ${jakarta.variable} ${jetbrains.variable} h-full antialiased`}
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
