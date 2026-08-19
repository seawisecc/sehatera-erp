/**
 * Kemampuan per peran, sisi layar.
 *
 * SALINAN dari matriks di `public.boleh()`, migrasi 0039. Yang MENAHAN tetap
 * database: berkas ini cuma menyembunyikan tombol yang sudah pasti ditolak,
 * supaya orang tidak menekan sesuatu lalu ditolak tanpa tahu kenapa.
 *
 * Jangan pernah membalik urutan itu. Kalau berkas ini yang jadi penjaga,
 * siapa pun yang tahu alamat fungsinya tetap bisa membaca rekam medis lewat
 * kunci anon yang memang ada di dalam peramban, dan untuk rekam medis itu
 * bukan kelalaian kecil.
 *
 * Kalau matriks di migrasi diubah, ubah juga di sini. Yang terjadi kalau
 * lupa: tombol muncul lalu ditolak (masih aman, cuma memalukan), atau tombol
 * hilang padahal boleh (menyusahkan, tapi tetap aman). Dua-duanya tidak
 * membuka data, dan itu memang urutan yang diinginkan.
 */

export type Kapabilitas =
  | 'rekam_medis.baca'
  | 'rekam_medis.tulis'
  | 'diagnosis.tulis'
  | 'resep.baca'
  | 'resep.tulis'
  | 'resep.layani'
  | 'reservasi.baca'
  | 'reservasi.tulis'
  | 'penunjang.minta'
  | 'penunjang.hasil'
  | 'penunjang.baca'
  | 'kunjungan.siap_tagih'

const MATRIKS: Record<Kapabilitas, string[]> = {
  'rekam_medis.baca':  ['pemilik', 'admin', 'dokter', 'perawat'],
  'rekam_medis.tulis': ['pemilik', 'admin', 'dokter', 'perawat'],
  'diagnosis.tulis':   ['pemilik', 'admin', 'dokter'],
  'resep.baca':        ['pemilik', 'admin', 'dokter', 'perawat', 'apoteker', 'asisten_apoteker'],
  'resep.tulis':       ['pemilik', 'admin', 'dokter'],
  'resep.layani':      ['pemilik', 'admin', 'apoteker', 'asisten_apoteker'],
  'reservasi.baca':    ['pemilik', 'admin', 'pendaftaran', 'dokter', 'perawat', 'kasir'],
  'reservasi.tulis':   ['pemilik', 'admin', 'pendaftaran'],
  'penunjang.minta':   ['pemilik', 'admin', 'dokter'],
  'penunjang.hasil':   ['pemilik', 'admin', 'analis'],
  'penunjang.baca':    ['pemilik', 'admin', 'dokter', 'perawat', 'analis'],
  // Kasir sengaja TIDAK di sini. Kasir yang bisa menyatakan sendiri bahwa
  // tagihannya lengkap sedang menandatangani pekerjaan orang lain.
  'kunjungan.siap_tagih': ['pemilik', 'admin', 'dokter', 'perawat'],
}

/**
 * Super admin yang sedang melihat sebuah klien dilewatkan, sama seperti
 * `boleh_admin_platform()` di database. Kalau tidak, ia tidak bisa menolong
 * klien yang sedang melapor ada yang rusak.
 */
export function boleh(peran: string | null, kap: Kapabilitas, isSuper = false): boolean {
  if (isSuper) return true
  if (!peran) return false
  return MATRIKS[kap].includes(peran)
}
