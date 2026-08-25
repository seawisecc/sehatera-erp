/**
 * Alamat SatuSehat, dan dari mana angka-angka ini berasal.
 *
 * SELURUH isi berkas ini dibaca langsung dari dokumentasi resmi
 * `satusehat.kemkes.go.id/platform/docs` pada 25 Agustus 2026, halaman
 * Katalog ReST API > Autentikasi > Akses Token dan halaman Interoperabilitas.
 * Sebelum itu catatan project memuat tebakan dari pustaka pihak ketiga, dan
 * satu di antaranya SALAH: sandbox tertulis `api-satusehat-dev`, padahal yang
 * benar `api-satusehat-stg`. Kesalahan itu berbentuk kegagalan DNS, bukan 401,
 * jadi orang yang menemuinya akan menyalahkan kredensialnya.
 *
 * Jangan menyunting nilai di sini dari ingatan. Kalau berubah, buka dokumennya.
 */

export type Lingkungan = 'sandbox' | 'produksi'

/**
 * Base host per lingkungan.
 *
 * `sandbox` diverifikasi dari contoh cURL di halaman Akses Token dan dari
 * daftar endpoint di halaman Interoperabilitas, dua tempat yang sama isinya.
 *
 * `produksi` untuk FHIR diverifikasi di halaman Interoperabilitas. Alamat
 * TOKEN produksi TIDAK disebut terpisah di sana; ia diturunkan dari host yang
 * sama dengan jalur token yang sama. Itu turunan, bukan kutipan, dan harus
 * dibuktikan sekali dengan kredensial produksi sungguhan sebelum dipercaya.
 */
const HOST: Record<Lingkungan, string> = {
  sandbox: 'https://api-satusehat-stg.dto.kemkes.go.id',
  produksi: 'https://api-satusehat.kemkes.go.id',
}

export const urlToken = (l: Lingkungan) =>
  `${HOST[l]}/oauth2/v1/accesstoken?grant_type=client_credentials`

export const urlFhir = (l: Lingkungan, resource: string) =>
  `${HOST[l]}/fhir-r4/v1/${resource}`

/**
 * System identifier milik Kemenkes. Ini bukan URL yang dipanggil, melainkan
 * penanda namespace di dalam payload FHIR, jadi ia tidak boleh ikut diubah
 * saat berpindah lingkungan. Sandbox dan produksi memakai yang sama persis.
 */
export const SYS = {
  nik: 'https://fhir.kemkes.go.id/id/nik',
  nikIbu: 'https://fhir.kemkes.go.id/id/nik-ibu',
  ihsPasien: 'https://fhir.kemkes.go.id/id/ihs-number',
  icd10: 'http://hl7.org/fhir/sid/icd-10',
  icd9cm: 'http://hl7.org/fhir/sid/icd-9-cm',
} as const

/**
 * Rate limit yang dinyatakan dokumen Akses Token: sesudah satu percobaan yang
 * GAGAL, satu client_id cuma boleh mencoba lagi 1 kali per menit.
 *
 * Ini sudah dipenuhi mundur berlipat di `tandai_gagal()` (migrasi 0056), yang
 * menjadwalkan ulang pada `now() + 1 menit * 2^percobaan` dengan `percobaan`
 * yang sudah dinaikkan saat diambil, jadi jeda terpendeknya dua menit. Angka
 * di bawah ini ada supaya pengirim yang ditulis nanti tidak menganggap dirinya
 * boleh mencoba lebih cepat dari itu.
 */
export const JEDA_MINIMAL_GAGAL_DETIK = 60
