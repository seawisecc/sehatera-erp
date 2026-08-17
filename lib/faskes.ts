/**
 * Jenis fasilitas kesehatan, dan istilah yang mengikutinya.
 *
 * SATU tempat untuk semua kata yang berubah menurut jenis fasilitas. Kalau
 * istilahnya disebar ke tiap halaman, aplikasi akan memanggil tempat yang sama
 * "apotek" di satu layar dan "klinik" di layar sebelahnya, dan orang yang
 * memakainya berhenti percaya bahwa keduanya bicara tentang hal yang sama.
 *
 * Jenis fasilitas menentukan menu mana yang ADA. Paket menentukan menu mana
 * yang DIBUKA. Keduanya sengaja terpisah: apotek berpaket Enterprise tetap
 * tidak melihat Antrian Pasien, karena ia memang tidak punya antrian pasien,
 * bukan karena paketnya kurang.
 */

export type Sektor = 'apotek' | 'klinik' | 'rumah_sakit'

export const SEKTOR_SAH: Sektor[] = ['apotek', 'klinik', 'rumah_sakit']

export const isSektor = (v: unknown): v is Sektor =>
  typeof v === 'string' && (SEKTOR_SAH as string[]).includes(v)

/** Kosong atau tidak dikenali dibaca sebagai apotek: itu bentuk yang sudah ada. */
export const bacaSektor = (v: unknown): Sektor => (isSektor(v) ? v : 'apotek')

type Istilah = {
  /** Nama jenis fasilitasnya. */
  faskes: [string, string]
  /** Kata untuk orang yang dilayani. Apotek melayani pembeli, klinik melayani pasien. */
  pelanggan: [string, string]
  /** Penanggung jawab yang tanda tangannya muncul di dokumen resmi. */
  penanggungJawab: [string, string]
  /** Nomor izin utama yang dicetak di kop dokumen. */
  izin: [string, string]
}

export const ISTILAH: Record<Sektor, Istilah> = {
  apotek: {
    faskes: ['Apotek', 'Pharmacy'],
    pelanggan: ['Pembeli', 'Customer'],
    penanggungJawab: ['Apoteker Penanggung Jawab', 'Pharmacist in Charge'],
    izin: ['SIA', 'SIA'],
  },
  klinik: {
    faskes: ['Klinik', 'Clinic'],
    pelanggan: ['Pasien', 'Patient'],
    penanggungJawab: ['Dokter Penanggung Jawab', 'Doctor in Charge'],
    izin: ['Izin Operasional Klinik', 'Clinic Operating Licence'],
  },
  rumah_sakit: {
    faskes: ['Rumah Sakit', 'Hospital'],
    pelanggan: ['Pasien', 'Patient'],
    penanggungJawab: ['Direktur Medis', 'Medical Director'],
    izin: ['Izin Operasional RS', 'Hospital Operating Licence'],
  },
}

/** Satu kata istilah, mengikuti bahasa yang sedang dipakai. */
export function istilah(sektor: Sektor, kunci: keyof Istilah, en: boolean): string {
  return ISTILAH[sektor][kunci][en ? 1 : 0]
}

const FARMASI = [
  'produk', 'transaksi', 'layanan', 'pembelian',
  'faktur', 'supplier', 'tindaklanjut',
] as const

/**
 * Modul yang MASUK AKAL untuk tiap jenis fasilitas.
 *
 * Tiap jenis memuat semua yang di bawahnya: klinik tetap punya seluruh modul
 * apotek karena klinik menyerahkan obat, dan rumah sakit punya keduanya. Itu
 * juga alasan modul obat, batch, FEFO, dan SIPNAP dipakai ULANG apa adanya,
 * bukan ditulis dua kali. Yang ditulis dua kali akan menyimpang, dan yang
 * menanggung selisihnya laporan SIPNAP.
 *
 * Rumah sakit untuk sekarang sama persis dengan klinik. Rawat inap, kamar,
 * laboratorium, dan radiologi adalah produk tersendiri; menuliskan menunya di
 * sini lebih dulu cuma menghasilkan menu yang mengantar ke halaman kosong.
 */
export const MODUL_SEKTOR: Record<Sektor, string[]> = {
  apotek: ['dashboard', ...FARMASI, 'laporan', 'pengaturan'],
  klinik: ['dashboard', 'kunjungan', 'pasien', ...FARMASI, 'laporan', 'pengaturan'],
  rumah_sakit: ['dashboard', 'kunjungan', 'pasien', ...FARMASI, 'laporan', 'pengaturan'],
}
