import {
  LayoutDashboard, Pill, ShoppingCart, PackageOpen, BarChart2, Settings, Truck,
  ClipboardList, Receipt, HeartPulse, Building2, Stethoscope, UsersRound, FlaskConical,
} from 'lucide-react'

/**
 * Menu, alamat rute, dan hak akses per peran.
 *
 * Alamatnya dibagi PER FUNGSI, bukan per produk: `/kasir`, `/produk`,
 * `/laporan`. Satu faskes bisa apotek sekaligus klinik, jadi memecah alamat
 * jadi `/apotek/...` dan `/klinik/...` akan memaksa orang yang sama berpindah
 * dua cabang alamat untuk pekerjaan yang sebenarnya satu. Modul klinik nanti
 * menambah rute di daftar yang sama (`/pasien`, `/antrian`, `/rekam-medis`),
 * disaring `lockedModules()` seperti modul lain.
 *
 * Perhatikan urutan penyaringan: daftar ini disaring dulu oleh hak akses per
 * pengguna, BARU oleh paket langganan (lib/plan.ts). Urutan itu penting:
 * pemilik boleh memberi kasir akses ke Pembayaran Faktur, tapi paket Starter
 * tetap tidak membukanya untuk siapa pun di apotek itu.
 */
export type MenuItem = {
  id: string
  href: string
  label: string
  en: string
  icon: typeof LayoutDashboard
  /**
   * Awalan alamat yang ikut menyalakan menu ini.
   *
   * Dibutuhkan menu yang punya anak: `/pengaturan/migrasi` harus tetap
   * menyalakan Pengaturan. Tanpa ini, orang kehilangan jejak sedang berada di
   * bagian mana begitu ia membuka sub-halaman.
   */
  section?: string
}

export const menuItems: MenuItem[] = [
  { id: 'dashboard',    href: '/beranda',       label: 'Beranda',           en: 'Home',             icon: LayoutDashboard },
  // Dua menu klinik. Untuk apotek keduanya disaring habis oleh MODUL_SEKTOR,
  // jadi urutannya di sini tidak membebani siapa pun yang tidak memakainya.
  { id: 'kunjungan',    href: '/kunjungan',     label: 'Kunjungan',         en: 'Visits',           icon: Stethoscope },
  { id: 'pasien',       href: '/pasien',        label: 'Pasien',            en: 'Patients',         icon: UsersRound },
  // Ikonnya sengaja BEDA dari Produk & Stok, walau keduanya soal obat.
  // Farmasi itu pekerjaan menyiapkan dan menyerahkan; Produk & Stok itu
  // barang yang ada di rak. Dua menu berturut-turut dengan ikon sama membuat
  // orang mengklik yang salah dan menyalahkan dirinya sendiri.
  { id: 'farmasi',      href: '/farmasi',       label: 'Farmasi',           en: 'Pharmacy',         icon: FlaskConical },
  { id: 'produk',       href: '/produk',        label: 'Produk & Stok',     en: 'Products & Stock', icon: Pill },
  { id: 'transaksi',    href: '/kasir',         label: 'Transaksi',         en: 'Sales',            icon: ShoppingCart },
  { id: 'layanan',      href: '/layanan',       label: 'Layanan Jasa',      en: 'Services',         icon: HeartPulse },
  { id: 'pembelian',    href: '/pembelian',     label: 'Pembelian',         en: 'Purchasing',       icon: PackageOpen },
  { id: 'faktur',       href: '/faktur',        label: 'Pembayaran Faktur', en: 'Invoice Payments', icon: Receipt },
  { id: 'supplier',     href: '/supplier',      label: 'Supplier',          en: 'Suppliers',        icon: Truck },
  { id: 'tindaklanjut', href: '/tindak-lanjut', label: 'Tindak Lanjut',     en: 'Follow-up',        icon: ClipboardList },
  { id: 'laporan',      href: '/laporan',       label: 'Laporan',           en: 'Reports',          icon: BarChart2 },
  { id: 'pengaturan',   href: '/pengaturan',    label: 'Pengaturan',        en: 'Settings',         icon: Settings, section: '/pengaturan' },
]

/** Menu khusus penyedia layanan, di luar daftar apotek. */
export const menuSuper: MenuItem[] = [
  { id: 'klien', href: '/klien', label: 'Klien', en: 'Clients', icon: Building2 },
]

/** Halaman yang boleh dibuka tiap peran, kalau pemilik tidak mengatur sendiri. */
export const ROLE_PAGES: Record<string, string[]> = {
  pemilik:          ['dashboard','kunjungan','pasien','farmasi','produk','transaksi','layanan','pembelian','faktur','supplier','tindaklanjut','laporan','pengaturan'],
  admin:            ['dashboard','kunjungan','pasien','farmasi','produk','transaksi','layanan','pembelian','faktur','supplier','tindaklanjut','laporan','pengaturan'],
  apoteker:         ['dashboard','kunjungan','farmasi','produk','transaksi','layanan','pembelian','faktur','supplier','tindaklanjut','laporan'],
  asisten_apoteker: ['dashboard','farmasi','produk','transaksi','layanan','tindaklanjut','laporan'],
  // Kasir melihat antrean farmasi supaya tahu obat sudah siap sebelum
  // memanggil pasien ke loket. Ia tidak menyerahkan obatnya.
  kasir:            ['dashboard','farmasi','transaksi','layanan'],

  // Peran klinik. Pembagiannya mengikuti siapa memegang apa, bukan siapa lebih
  // senior: pendaftaran memegang identitas dan antrean tapi TIDAK boleh
  // membuka rekam medis, dokter memegang pemeriksaan tapi tidak perlu kasir.
  dokter:           ['dashboard','kunjungan','pasien','laporan'],
  perawat:          ['dashboard','kunjungan','pasien'],
  pendaftaran:      ['dashboard','kunjungan','pasien','transaksi'],
}

export const ROLE_LABELS: Record<string, string> = {
  pemilik: 'Pemilik',
  apoteker: 'Apoteker',
  asisten_apoteker: 'Asisten Apoteker',
  kasir: 'Kasir',
  admin: 'Admin',
  dokter: 'Dokter',
  perawat: 'Perawat',
  pendaftaran: 'Pendaftaran',
  superadmin: 'Super Admin',
}

/** Menu yang benar-benar tampil, sesudah hak akses dan paket disaring. */
export function menuTampil(allowedPages: string[], isSuper: boolean): MenuItem[] {
  return [
    ...menuItems.filter(m => allowedPages.includes(m.id)),
    ...(isSuper ? menuSuper : []),
  ]
}

/**
 * Apakah menu ini sedang aktif.
 *
 * Dipakai sidebar DAN navigasi bawah, supaya keduanya tidak mungkin berbeda
 * pendapat tentang halaman mana yang sedang dibuka.
 */
export function menuAktif(pathname: string, item: MenuItem): boolean {
  if (item.section && (pathname === item.section || pathname.startsWith(item.section + '/'))) return true
  if (pathname === item.href) return true
  return pathname.startsWith(item.href + '/')
}

/** Halaman yang butuh layar lebar dan perhatian penuh; sidebar menyempit sendiri. */
export const RUTE_FOKUS = ['/kasir']
