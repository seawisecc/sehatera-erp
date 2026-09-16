import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../lib/i18n";
import { ThemeProvider, ThemeScript } from "../lib/theme";
import { PWA } from "../components/PWA";

/**
 * Tiga huruf, tiga tugas, sama seperti TokoKu. Itu disengaja: dua produk dari
 * studio yang sama sebaiknya terbaca sebagai satu keluarga.
 *
 * Sebelumnya seluruh aplikasi memakai satu huruf (Geist, bawaan create-next-app)
 * untuk judul, isi, dan angka sekaligus. Akibatnya tidak ada hierarki: judul
 * halaman dan label kolom terbaca dengan bobot yang sama, dan mata tidak punya
 * pegangan saat memindai layar yang padat.
 */
const sora = Sora({            // judul: geometris, tegas
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({   // isi: dirancang untuk teks Indonesia
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Angka SELALU memakai huruf monospace ini: dosis, stok, harga, nomor batch,
 * nomor resep. Di aplikasi apotek angka bukan hiasan. "1" yang bisa dibaca
 * sebagai "l", atau "0" yang mirip "O", adalah kesalahan dosis yang menunggu
 * terjadi. JetBrains Mono membedakan keduanya secara jelas dan lebarnya tetap,
 * jadi kolom angka berbaris rapi tanpa trik tambahan.
 */
const jetbrains = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Alamat resmi Sehatera, dan ia dipakai untuk hal yang tidak terlihat di layar
 * mana pun: `metadataBase` menjadikan alamat gambar Open Graph mutlak. Nilai
 * yang tertinggal di alamat lama tidak menggagalkan apa pun di aplikasi, tapi
 * pratinjau tautan di WhatsApp dan Facebook menunjuk ke deploy lama, dan yang
 * dilihat calon klien saat tautannya dibagikan adalah halaman versi kapan pun
 * alamat itu terakhir dibangun.
 */
const SITE_URL = "https://sehatera.seawise.id";
const TITLE = "Sehatera | Sistem Apotek, Klinik, dan Rumah Sakit";
/**
 * Kalimat ini yang muncul di bawah judul saat tautannya dibagikan di WhatsApp,
 * dan sering ia satu-satunya yang benar-benar dibaca orang.
 *
 * Versi sebelumnya menyebut apotek saja: "kasir & resep, stok dengan batch dan
 * kadaluarsa, order terpandu, pembayaran faktur, laporan SIPNAP". Seluruhnya
 * masih benar, tapi tidak satu pun menyebut rekam medis, antrean poli, klaim
 * penjamin, atau SatuSehat, padahal itu yang dibangun sepanjang tahap 7 dan 8
 * dan itu pula yang ada di paket paling mahal. Pemilik klinik yang membaca
 * kalimat lama menyimpulkan produk ini bukan untuk dia, dan ia tidak akan
 * menekan tautannya untuk memastikan.
 *
 * Urutannya sengaja dimulai dari yang membedakan (rekam medis, e-resep,
 * antrean) lalu turun ke yang sudah lama ada (kasir, SIPNAP): 160 karakter
 * pertama yang dipotong pratinjau harus memuat alasan orang berhenti menggulung.
 */
const DESCRIPTION =
  "Rekam medis elektronik, e-resep, antrean per poli, reservasi, kasir dengan batch & kadaluarsa, klaim BPJS & asuransi, laporan SIPNAP, dan pengiriman ke SatuSehat. Untuk apotek, klinik, dan rumah sakit.";

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
    "aplikasi klinik", "software klinik", "sistem informasi klinik",
    "rekam medis elektronik", "RME", "e-resep", "antrean pasien klinik",
    "SatuSehat", "klaim BPJS", "SIMRS", "pharmacy management system",
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
  /**
   * Alamat sah tunggal. Tanpa ini, pratinjau yang dibagikan dari alamat
   * `*.vercel.app` bawaan Vercel dihitung sebagai halaman terpisah oleh mesin
   * pencari, dan tautan yang sudah beredar menunjuk ke deploy lama.
   */
  alternates: { canonical: SITE_URL },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
  /**
   * Yang membuat aplikasi terpasang di iPhone dan iPad membuka jendelanya
   * sendiri tanpa bilah alamat Safari. Manifestnya (`app/manifest.ts`) tidak
   * cukup di sana: Safari sampai sekarang membaca tanda ini, bukan
   * `display: standalone`.
   */
  appleWebApp: {
    capable: true,
    title: "Sehatera",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /**
   * `viewportFit: 'cover'` adalah syarat `env(safe-area-inset-*)` berisi angka.
   *
   * Tanpanya keempat inset itu SELALU nol, dan tidak ada yang gagal: navigasi
   * bawah tetap tergambar, cuma barisnya duduk persis di bawah garis geser
   * iPhone. Yang terjadi bukan tombol yang hilang melainkan tombol yang
   * ditekan menggeser aplikasi ke belakang, dan di tangan kasir yang sedang
   * dikejar antrean itu terbaca sebagai aplikasi yang menutup dirinya sendiri.
   * AppShell sudah membaca insetnya sejak lama; yang kurang cuma izin ini.
   */
  viewportFit: "cover",
  // Keempat tema terang, jadi bilah peramban satu warna saja, mengikuti Vital
  // Tide yang jadi bawaan.
  themeColor: "#f5fbfc",
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
        <PWA />
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
