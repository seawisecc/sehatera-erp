import type { MetadataRoute } from 'next'

/**
 * Manifest PWA: yang membuat Sehatera bisa dipasang sebagai aplikasi.
 *
 * Bukan sekadar ikon di layar. Yang berubah untuk orang yang memasangnya:
 * aplikasinya punya jendelanya sendiri tanpa bilah alamat, jadi kasir tidak
 * bisa tidak sengaja menutup tab atau mengetik alamat lain di tengah
 * transaksi, dan ia terbuka dari peluncur seperti aplikasi lain yang dipakai
 * di klinik.
 *
 * `start_url` sengaja `/beranda`, bukan `/`. Keduanya benar untuk yang belum
 * masuk (beranda melempar balik ke halaman masuk kalau sesinya tidak ada),
 * tapi hanya `/beranda` yang benar untuk yang SUDAH masuk: `/` adalah
 * formulir masuk, dan aplikasi terpasang yang tiap dibuka menampilkan
 * formulir masuk terbaca seperti aplikasi yang selalu mengeluarkan orangnya.
 *
 * `id` dikunci ke `/` supaya identitas aplikasinya TIDAK ikut berubah kalau
 * `start_url` suatu saat digeser. Tanpa `id`, Chrome memakai `start_url`
 * sebagai identitas, dan menggesernya melahirkan aplikasi KEDUA di peluncur
 * orang yang sudah memasang yang lama.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Sehatera',
    short_name: 'Sehatera',
    description:
      'Sistem manajemen apotek, klinik, dan rumah sakit: kasir, resep, stok berbatch, rekam medis, sampai laporan.',
    start_url: '/beranda',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    lang: 'id',
    dir: 'ltr',
    categories: ['medical', 'business', 'productivity'],
    // Sama dengan `viewport.themeColor` di layout. Keempat tema aplikasi ini
    // terang, jadi satu warna cukup dan tidak ada yang perlu digelapkan.
    background_color: '#f5fbfc',
    theme_color: '#f5fbfc',
    icons: [
      // `any` dipakai apa adanya, `maskable` dipotong sendiri oleh sistem
      // operasi jadi bulat atau kotak membulat. Keduanya harus ada: yang cuma
      // `any` akan dipotong sudutnya di Android, yang cuma `maskable` tampil
      // dengan latar penuh di tempat yang tidak memotong apa pun.
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    /**
     * Pintasan yang muncul saat ikon aplikasinya diklik kanan di taskbar.
     *
     * Sengaja cuma dua, dan keduanya modul yang ADA DI SEMUA SEKTOR (lihat
     * `MODUL_SEKTOR` di `lib/faskes.ts`): klinik dan rumah sakit mendapat
     * seluruh modul apotek, jadi Kasir dan Produk selalu ada. Pintasan ke
     * modul yang cuma dimiliki sebagian sektor akan mendarat di halaman yang
     * tidak boleh dibuka orangnya, dan manifest ini satu untuk semua faskes.
     */
    shortcuts: [
      { name: 'Kasir', short_name: 'Kasir', url: '/kasir', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
      { name: 'Produk & Stok', short_name: 'Produk', url: '/produk', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
    ],
  }
}
