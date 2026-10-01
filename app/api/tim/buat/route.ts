/**
 * Pemilik atau admin membuatkan akun anggota tim: email dan kata sandi awal.
 *
 * Keputusan pemilik (1 Oktober 2026), menggantikan undangan lewat tautan.
 * Kata sandi awal itu diketahui pembuatnya, jadi akunnya lahir dengan penanda
 * `wajib_ganti_sandi`: saat pertama masuk orangnya harus membuat sandinya
 * sendiri sebelum bisa memakai apa pun (`components/WajibGantiSandi.tsx`).
 *
 * Urutan:
 *   1. `tambah_anggota_tim()` dengan SESI pemanggil: hak, peran, kuota, dan
 *      jejak audit semuanya di database.
 *   2. Akun Auth dibuat dengan service_role, email langsung dianggap
 *      terkonfirmasi karena yang menjamin alamatnya adalah pemilik faskes.
 *   3. Kalau langkah 2 gagal, baris langkah 1 dibuang lagi. Baris app_users
 *      tanpa akun tidak membuka apa pun, tapi memakan kuota dan menahan email
 *      itu dari percobaan berikutnya.
 *
 * Email yang SUDAH punya akun Sehatera (misalnya bekerja juga di outlet
 * lain) tidak dibuatkan akun kedua dan sandinya TIDAK ditimpa: menimpa sandi
 * orang yang sudah ada berarti mengambil alih akunnya. Ia cukup masuk dengan
 * sandinya sendiri, dan jawabannya mengatakan itu.
 */

import { NextResponse } from 'next/server'
import { MIN_SANDI, siapkanTim, tolak, tolakDb } from '@/lib/server/tim'

export async function POST(req: Request) {
  const siap = await siapkanTim(req)
  if (siap instanceof NextResponse) return siap
  const { pengguna, admin, badan } = siap

  const email = String(badan.email || '').trim().toLowerCase()
  const sandi = String(badan.sandi || '')
  if (sandi.length < MIN_SANDI) return tolak(`Kata sandi awal minimal ${MIN_SANDI} karakter.`)

  const { data: baris, error: eDb } = await pengguna.rpc('tambah_anggota_tim', {
    p_email: email,
    p_nama: String(badan.nama || ''),
    p_role: String(badan.role || ''),
    p_modules: Array.isArray(badan.modules) ? badan.modules : [],
    p_company: badan.company || null,
  })
  if (eDb) return tolakDb(eDb)

  const { data: ada } = await admin.rpc('id_akun_by_email', { p_email: email })
  if (ada) {
    return NextResponse.json({ ok: true, akunLama: true, email })
  }

  const { error: eAuth } = await admin.auth.admin.createUser({
    email,
    password: sandi,
    email_confirm: true,
    user_metadata: { nama: String(badan.nama || '').trim(), wajib_ganti_sandi: true },
  })
  if (eAuth) {
    await admin.from('app_users').delete().eq('id', (baris as any).id)
    return tolak(/weak|pwned|leaked/i.test(eAuth.message)
      ? 'Kata sandi awal ini terlalu mudah ditebak. Pilih yang lain.'
      : `Akun tidak bisa dibuat: ${eAuth.message}`)
  }

  return NextResponse.json({ ok: true, akunLama: false, email })
}
