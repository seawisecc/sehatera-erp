import {
  LayoutDashboard, Pill, ShoppingCart, PackageOpen, BarChart2, Settings, Truck,
  ClipboardList, Receipt, HeartPulse,
} from 'lucide-react'

/**
 * Menu dan hak akses per peran.
 *
 * Dipisah dari halaman supaya bisa dibaca tanpa menggulir 5.000 baris, dan
 * supaya modul klinik nanti ditambahkan DI SINI — satu tempat — bukan di
 * tengah komponen dashboard.
 *
 * Perhatikan urutan penyaringan yang berlaku di dashboard: daftar ini disaring
 * dulu oleh hak akses per pengguna, BARU oleh paket langganan
 * (`lockedModules()` di lib/plan.ts). Urutan itu penting — pemilik boleh
 * memberi kasir akses ke Pembayaran Faktur, tapi paket Starter tetap tidak
 * membukanya untuk siapa pun di apotek itu.
 */
export type MenuItem = {
  id: string
  label: string
  en: string
  icon: typeof LayoutDashboard
}

export const menuItems: MenuItem[] = [
  { id: 'dashboard',    label: 'Dashboard',           en: 'Dashboard',        icon: LayoutDashboard },
  { id: 'produk',       label: 'Produk & Stok',       en: 'Products & Stock', icon: Pill },
  { id: 'transaksi',    label: 'Transaksi',           en: 'Sales',            icon: ShoppingCart },
  { id: 'layanan',      label: 'Layanan Jasa',        en: 'Services',         icon: HeartPulse },
  { id: 'pembelian',    label: 'Pembelian',           en: 'Purchasing',       icon: PackageOpen },
  { id: 'faktur',       label: 'Pembayaran Faktur',   en: 'Invoice Payments', icon: Receipt },
  { id: 'supplier',     label: 'Supplier',            en: 'Suppliers',        icon: Truck },
  { id: 'tindaklanjut', label: 'Tindak Lanjut',       en: 'Follow-up',        icon: ClipboardList },
  { id: 'laporan',      label: 'Laporan',             en: 'Reports',          icon: BarChart2 },
  { id: 'pengaturan',   label: 'Pengaturan',          en: 'Settings',         icon: Settings },
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
