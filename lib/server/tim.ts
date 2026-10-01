/**
 * Pembukaan bersama dua endpoint tim (`/api/tim/buat`, `/api/tim/sandi`).
 *
 * Urutannya adalah pengamanannya, alasan yang sama dengan
 * `satusehat-konteks.ts`: hak diperiksa database lewat SESI pemanggil, baru
 * sesudah itu service_role menyentuh Auth. Kalau urutannya dibalik, yang
 * diperiksa cuma klaim yang ditulis pemanggil sendiri di badan permintaannya.
 */

import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin, supabaseSebagaiPengguna } from './supabase-admin'

/** Sama dengan pendaftaran, Ganti Sandi, dan setelan Auth. */
export const MIN_SANDI = 8

export const tolak = (pesan: string, status = 400, kode?: string) =>
  NextResponse.json({ ok: false, pesan, kode }, { status })

export type SiapTim = {
  pengguna: SupabaseClient
  admin: SupabaseClient
  badan: Record<string, any>
}

export async function siapkanTim(req: Request): Promise<SiapTim | NextResponse> {
  const bearer = req.headers.get('authorization') || ''
  const token = bearer.toLowerCase().startsWith('bearer ') ? bearer.slice(7).trim() : ''
  if (!token) return tolak('Sesi tidak terbaca. Muat ulang halaman lalu coba lagi.', 401)

  let badan: Record<string, any>
  try { badan = await req.json() } catch { return tolak('Permintaan tidak terbaca.') }

  const pengguna = supabaseSebagaiPengguna(token)
  const admin = supabaseAdmin()
  if (!pengguna || !admin) {
    return tolak('SUPABASE_SERVICE_ROLE_KEY belum dipasang di server, jadi akun tim tidak bisa dibuat.', 500)
  }
  return { pengguna, admin, badan }
}

/**
 * Galat dari fungsi database diteruskan bersama kodenya, supaya peramban bisa
 * melewatkannya ke `pesanError()` seperti galat RPC biasa. Pesan SH00x sudah
 * ditulis untuk pemilik faskes.
 */
export const tolakDb = (e: { message?: string; code?: string }) =>
  tolak(e.message || 'Gagal.', 400, e.code)
