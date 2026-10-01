/**
 * Pemilik atau admin mengatur ulang kata sandi anggota timnya.
 *
 * Pasangan wajib dari akun yang dibuatkan langsung: tanpa ini, kasir yang
 * lupa sandinya harus lewat email, padahal alasan alur ini dipilih justru
 * supaya tim tidak bergantung pada email.
 *
 * Syaratnya diputuskan `izinkan_atur_sandi()` dengan SESI pemanggil (bukan
 * pemilik, bukan diri sendiri, dan SETIAP faskes tempat orang itu terdaftar
 * dikelola pemanggil). Sandi baru ditandai `wajib_ganti_sandi` lagi, alasan
 * yang sama dengan akun baru: sandi yang diketik orang lain bukan sandi
 * pemiliknya.
 */

import { NextResponse } from 'next/server'
import { MIN_SANDI, siapkanTim, tolak, tolakDb } from '@/lib/server/tim'

export async function POST(req: Request) {
  const siap = await siapkanTim(req)
  if (siap instanceof NextResponse) return siap
  const { pengguna, admin, badan } = siap

  const email = String(badan.email || '').trim().toLowerCase()
  const sandi = String(badan.sandi || '')
  if (sandi.length < MIN_SANDI) return tolak(`Kata sandi baru minimal ${MIN_SANDI} karakter.`)

  const { error: eIzin } = await pengguna.rpc('izinkan_atur_sandi', {
    p_email: email, p_company: badan.company || null,
  })
  if (eIzin) return tolakDb(eIzin)

  const { data: id } = await admin.rpc('id_akun_by_email', { p_email: email })
  if (!id) {
    return tolak('Orang ini belum punya akun Sehatera. Hapus dari daftar tim lalu tambahkan lagi.')
  }

  const { data: akun } = await admin.auth.admin.getUserById(String(id))
  const { error } = await admin.auth.admin.updateUserById(String(id), {
    password: sandi,
    user_metadata: { ...(akun?.user?.user_metadata || {}), wajib_ganti_sandi: true },
  })
  if (error) {
    return tolak(/weak|pwned|leaked/i.test(error.message)
      ? 'Kata sandi ini terlalu mudah ditebak. Pilih yang lain.'
      : `Kata sandi tidak bisa diganti: ${error.message}`)
  }
  return NextResponse.json({ ok: true })
}
