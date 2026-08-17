import {
  LayoutDashboard, Pill, ShoppingCart, PackageOpen, BarChart2, Settings, Truck,
  ClipboardList, Receipt, HeartPulse, Building2,
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
  { id: 'dashboard',    href: '/beranda',       label: 'Dashboard',         en: 'Dashboard',        icon: LayoutDashboard },
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
  pemilik:          ['dashboard','produk','transaksi','layanan','pembelian','faktur','supplier','tindaklanjut','laporan','pengaturan'],
  admin:            ['dashboard','produk','transaksi','layanan','pembelian','faktur','supplier','tindaklanjut','laporan','pengaturan'],
  apoteker:         ['dashboard','produk','transaksi','layanan','pembelian','faktur','supplier','tindaklanjut','laporan'],
  asisten_apoteker: ['dashboard','produk','transaksi','layanan','tindaklanjut','laporan'],
  kasir:            ['dashboard','transaksi','layanan'],
}

export const ROLE_LABELS: Record<string, string> = {
  pemilik: 'Pemilik',
  apoteker: 'Apoteker',
  asisten_apoteker: 'Asisten Apoteker',
  kasir: 'Kasir',
  admin: 'Admin',
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

/**
 * Rute yang SUDAH benar-benar pindah dari monolit.
 *
 * Daftar ini ada supaya pemecahan bisa dilakukan sepotong demi sepotong tanpa
 * pernah meninggalkan aplikasi dalam keadaan setengah rusak: menu selalu
 * menunjuk ke tempat yang benar-benar ada. Modul yang belum pindah diarahkan
 * ke `/dashboard?p=<id>`, yang kebetulan sudah memberi satu manfaat routing
 * lebih awal, yaitu alamatnya bisa dibagikan dan disegarkan.
 *
 * Daftar ini MENGECIL seiring pemecahan berjalan. Kalau sudah memuat semua id,
 * hapus fungsi `hrefEfektif` beserta jembatan `?p=` di dashboard.
 */
export const RUTE_SIAP = new Set<string>(['layanan', 'supplier', 'faktur'])

export function hrefEfektif(item: MenuItem): string {
  return RUTE_SIAP.has(item.id) ? item.href : `/dashboard?p=${item.id}`
}

export function menuAktifEfektif(pathname: string, cari: string | null, item: MenuItem): boolean {
  if (RUTE_SIAP.has(item.id)) return menuAktif(pathname, item)
  return pathname === '/dashboard' && cari === item.id
}
