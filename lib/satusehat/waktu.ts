/**
 * Waktu untuk SatuSehat SELALU UTC+00, dan ini jenis kesalahan yang tidak
 * pernah muncul sebagai galat.
 *
 * Panduan Interoperabilitas menyatakannya sebagai aturan, bukan anjuran: WIB
 * dikurangi 7, WITA dikurangi 8, WIT dikurangi 9. Contoh resminya pukul 17.35
 * WIB pada 23 Agustus 2023 berangkat sebagai `2023-08-23T10:35:00+00:00`.
 *
 * Kalau jam dinding klinik ikut terkirim apa adanya, SatuSehat menerimanya
 * dengan senang hati dan menyimpan kunjungan sore sebagai kunjungan malam.
 * Tidak ada yang gagal, tidak ada yang menegur, dan selisihnya baru terlihat
 * kalau ada yang membandingkan dua sistem baris per baris.
 *
 * Klinik contoh project ini di Denpasar, yaitu WITA, jadi selisihnya delapan
 * jam dan cukup besar untuk memindahkan tanggal.
 *
 * `toISOString()` sudah menghasilkan UTC, tapi berakhiran "Z". Contoh resmi
 * menulis "+00:00". Keduanya sah menurut FHIR; yang dipakai di sini bentuk
 * yang dicontohkan dokumennya, supaya yang membandingkan dengan Postman
 * Kemenkes tidak menemukan perbedaan yang harus dipikirkan lebih dulu.
 */
export function waktuUtc(nilai: string | Date | null | undefined): string | null {
  if (!nilai) return null
  const d = nilai instanceof Date ? nilai : new Date(nilai)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().replace(/\.\d{3}Z$/, '+00:00')
}

/**
 * Batas bawah yang dinyatakan dokumennya: tanggal kiriman tidak boleh lebih
 * awal dari 3 Juni 2014. Baris lama yang tanggalnya di bawah itu akan ditolak,
 * dan lebih baik ketahuan saat payload dibangun daripada sesudah antre.
 */
export const TANGGAL_PALING_AWAL = '2014-06-03'

export const terlaluTua = (iso: string | null): boolean =>
  !!iso && iso.slice(0, 10) < TANGGAL_PALING_AWAL
