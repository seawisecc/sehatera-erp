/**
 * Uji koneksi SatuSehat: satu tombol yang membuktikan seluruh rantainya.
 *
 * Yang dibuktikannya berurutan, dan tiap langkah bisa gagal dengan kalimatnya
 * sendiri: kredensial terbaca dari Vault, token OAuth2 keluar, lalu satu
 * pencarian pasien betulan ke MPI berhasil.
 *
 * Kenapa harus ada sebelum satu baris payload pun dikirim: kalau pembangun
 * payload dan penyambungan diuji bersamaan, kegagalan pertama tidak bisa
 * dibedakan antara "bentuk kirimannya salah" dan "kami bahkan belum
 * tersambung". Yang kedua jauh lebih sering, dan jauh lebih murah diperiksa.
 *
 * Yang TIDAK dilakukan endpoint ini: mengembalikan kredensialnya. Tidak juga
 * sebagian, tidak juga yang tersamar. Yang bisa dibaca balik akan dibaca balik.
 */

import { NextResponse } from 'next/server'
import { siapkanSatuSehat, gagal } from '@/lib/server/satusehat-konteks'
import { cariPasienByNik } from '@/lib/satusehat/klien'

/**
 * NIK pasien dummy yang DISEDIAKAN SatuSehat untuk sandbox, dari halaman
 * Patient di dokumentasi resmi (Ardianto Putra, IHS P02478375538). Ia hanya
 * hidup di sandbox.
 *
 * Uji di produksi memakai NIK yang dikirim pemanggil: menembak NIK contoh ke
 * MPI produksi berarti menanyakan orang yang bukan pasien klinik itu.
 */
const NIK_UJI_SANDBOX = '9271060312000001'

export async function POST(req: Request) {
  const siap = await siapkanSatuSehat(req)
  if (siap instanceof NextResponse) return siap

  const nik = siap.lingkungan === 'sandbox'
    ? NIK_UJI_SANDBOX
    : String(siap.badan.nik || '')
  if (!nik) {
    return gagal('Untuk lingkungan produksi, sebutkan NIK pasien yang benar-benar terdaftar.', 'nik')
  }

  const hasil = await cariPasienByNik(siap.konteks, nik)
  if (!hasil.ok) return gagal(hasil.pesan, 'panggilan')

  return NextResponse.json({
    ok: true,
    lingkungan: siap.lingkungan,
    organizationId: siap.organizationId,
    // Sengaja tidak mengembalikan nama pasien produksi: yang diuji koneksinya,
    // bukan identitas orangnya, dan jawaban uji sering ikut tersalin ke tiket.
    ditemukan: hasil.data !== null,
    ihs: siap.lingkungan === 'sandbox' ? hasil.data?.ihs ?? null : null,
    pesan: hasil.data
      ? 'Tersambung. Token keluar dan pencarian pasien ke MPI dijawab SatuSehat.'
      : 'Tersambung, tapi NIK itu tidak ada di MPI. Koneksinya sendiri sudah benar.',
  })
}
