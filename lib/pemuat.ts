'use client'

import { useCallback, useRef, useState } from 'react'

/**
 * Keadaan "sedang memuat" yang membedakan MEMUAT PERTAMA dari MENYEGARKAN.
 *
 * Seluruh layar daftar di aplikasi ini berbentuk sama: simpan lewat RPC, lalu
 * panggil `muat()` yang menarik ulang daftarnya. Yang salah bukan penarikan
 * ulangnya, melainkan `setMemuat(true)` di barisnya yang pertama: daftar yang
 * sudah terisi DIKOSONGKAN jadi tulisan "Memuat…" selama sekitar setengah
 * detik, tiap kali satu baris disimpan.
 *
 * Akibatnya terbaca sebagai aplikasi yang kehilangan datanya lalu menemukannya
 * kembali. Di layar pasien yang isinya dua belas baris, satu perubahan nomor
 * telepon membuat seluruh daftar berkedip. Yang lebih buruk: di telepon,
 * halaman yang mendadak kehilangan isinya MENGKERUT, jadi posisi gulungan
 * orangnya hilang dan ia kembali ke atas tanpa meminta.
 *
 * Dua keadaan itu memang berbeda, dan layarnya harus membedakannya:
 *
 * - **Belum ada apa-apa di layar** -> katakan sedang memuat. Layar kosong
 *   tanpa penjelasan tidak bisa dibedakan dari layar yang datanya memang nol.
 * - **Sudah ada isinya** -> biarkan yang lama terbaca sampai yang baru datang.
 *   Yang lama benar sampai sepersekian detik yang lalu, dan perubahannya
 *   sendiri sudah diumumkan lewat `kabar()` dan tombol yang menjadi "sibuk".
 *
 * ## `kunci` bukan penghias
 *
 * Saat super admin berpindah faskes, isi daftarnya berganti SELURUHNYA jadi
 * milik klinik lain. Menahan yang lama di layar selama itu berarti nama pasien
 * klinik A terbaca di bawah judul klinik B, dan itu jenis kesalahan yang paling
 * mahal di rekam medis. Kalau `kunci` berubah, pemuatnya kembali dianggap
 * belum pernah memuat, jadi layarnya memang dikosongkan lebih dulu.
 *
 * Pemakaiannya:
 *
 * ```ts
 * const { memuat, mulai, selesai } = usePemuat(app.superViewCompany)
 * const muat = useCallback(async () => {
 *   mulai()
 *   const { data } = await app.scope(...)
 *   setDaftar(data || [])
 *   selesai()
 * }, [...])
 * ```
 */
export function usePemuat(kunci?: string) {
  const [memuat, setMemuat] = useState(true)
  const pernah = useRef(false)
  const kunciTerakhir = useRef(kunci)

  const mulai = useCallback(() => {
    if (kunciTerakhir.current !== kunci) {
      // Faskes yang dilihat berganti: yang lama bukan cuma basi, ia milik
      // orang lain.
      kunciTerakhir.current = kunci
      pernah.current = false
    }
    if (!pernah.current) setMemuat(true)
  }, [kunci])

  const selesai = useCallback(() => {
    pernah.current = true
    setMemuat(false)
  }, [])

  return { memuat, mulai, selesai }
}
