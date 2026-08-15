/**
 * Kemampuan yang dibuka paket langganan.
 *
 * SATU tempat untuk membaca `plans.features`. Kalau aturannya disalin ke tiap
 * halaman yang membutuhkannya, salinan itu akan bergeser: cukup satu halaman
 * lupa memakai nilai bawaan yang benar, dan apotek yang sudah membayar
 * kehilangan fitur tanpa ada yang menyadarinya.
 *
 * ATURAN BAWAAN: kunci yang KOSONG dianggap kemampuan PENUH. Paket dibuat
 * tangan lewat Super Admin, jadi penanda yang lupa diisi itu wajar — dan
 * memberi kelebihan jauh lebih murah daripada mengunci apotek yang sudah bayar
 * lalu menunggu mereka mengeluh. Aturan yang sama berlaku untuk kuota di
 * database (lihat migrasi 0003).
 */
export type PlanFeatures = {
  /** basic = omzet, jumlah transaksi, grafik harian, 30 hari
   *  full  = + laba kotor, obat terlaris, metode bayar, 90 hari */
  reports: 'basic' | 'full'
  /** basic = catat barang masuk saja
   *  full  = + pemasok, tempo & hutang, retur, konsinyasi */
  purchasing: 'basic' | 'full'
  /** basic = catat pasien di kasir
   *  full  = + riwayat pengobatan per pasien, pengingat tebus ulang */
  crm: 'basic' | 'full'
  multiOutlet: boolean
  api: boolean
  /** Modul klinik: rekam medis, e-resep, antrian, SatuSehat, BPJS. */
  klinik: boolean
  support: 'email' | 'whatsapp' | 'dedicated'
}

export const FULL_PLAN: PlanFeatures = {
  reports: 'full',
  purchasing: 'full',
  crm: 'full',
  multiOutlet: true,
  api: true,
  klinik: true,
  support: 'dedicated',
}

const tier = (v: unknown): 'basic' | 'full' => (v === 'basic' ? 'basic' : 'full')

export function readPlanFeatures(raw: unknown): PlanFeatures {
  if (!raw || typeof raw !== 'object') return FULL_PLAN
  const f = raw as Record<string, unknown>

  return {
    reports: tier(f.reports),
    purchasing: tier(f.purchasing),
    crm: tier(f.crm),
    multiOutlet: f.multi_outlet !== false,
    api: f.api !== false,
    // Kebalikan dari yang lain: `klinik` HARUS dinyalakan secara sengaja.
    // Aturan "kosong berarti penuh" berlaku untuk kemampuan yang sudah ada di
    // semua paket; modul klinik adalah produk terpisah dengan kewajiban hukum
    // sendiri, dan membukanya karena kolomnya lupa diisi jauh lebih berbahaya
    // daripada menutupnya.
    klinik: f.klinik === true,
    support:
      f.support === 'dedicated' ? 'dedicated' : f.support === 'whatsapp' ? 'whatsapp' : 'email',
  }
}

/**
 * Modul yang dikunci paket ini.
 *
 * SIPNAP sengaja TIDAK ada di daftar mana pun. Pelaporan narkotika dan
 * psikotropika adalah kewajiban hukum apotek, bukan fitur premium — menguncinya
 * di paket berbayar berarti menagih orang supaya bisa patuh aturan. Yang boleh
 * dikunci di paket atas hanya kemudahannya: rekap lintas cabang dan pengiriman
 * terjadwal.
 */
export function lockedModules(f: PlanFeatures): string[] {
  const locked: string[] = []
  if (f.purchasing === 'basic') locked.push('faktur')
  return locked
}

export const RENTANG_LAPORAN_HARI = (f: PlanFeatures) => (f.reports === 'full' ? 90 : 30)
