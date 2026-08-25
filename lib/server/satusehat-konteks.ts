/**
 * Pembukaan yang sama untuk tiap endpoint SatuSehat: siapa yang menekan, boleh
 * atau tidak, dan kredensial faskes mana yang dipakai.
 *
 * Ditarik jadi satu tempat sesudah endpoint kedua, bukan sejak awal. Alasannya
 * bukan kerapian: urutan pemeriksaannya ADALAH pengamanannya, dan tiga salinan
 * urutan yang sama adalah tiga tempat yang harus tetap benar saat salah satu
 * diperbaiki. Yang ketinggalan tidak akan gagal, ia cuma berhenti memeriksa.
 */

import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin, supabaseSebagaiPengguna } from './supabase-admin'
import type { Konteks } from '@/lib/satusehat/klien'
import type { Lingkungan } from '@/lib/satusehat/config'

export const gagal = (pesan: string, langkah: string, status = 400) =>
  NextResponse.json({ ok: false, langkah, pesan }, { status })

export type Siap = {
  admin: SupabaseClient
  company: string
  lingkungan: Lingkungan
  konteks: Konteks
  organizationId: string
  /** Badan permintaan yang sudah dibaca. Ia hanya bisa dibaca SEKALI. */
  badan: Record<string, unknown>
}

/**
 * Mengembalikan konteks siap pakai, ATAU sebuah NextResponse berisi
 * penolakannya. Pemanggil memeriksanya dengan `instanceof NextResponse`.
 */
export async function siapkanSatuSehat(req: Request): Promise<Siap | NextResponse> {
  const bearer = req.headers.get('authorization') || ''
  const token = bearer.toLowerCase().startsWith('bearer ') ? bearer.slice(7).trim() : ''
  if (!token) return gagal('Sesi tidak terbaca. Muat ulang halaman lalu coba lagi.', 'sesi', 401)

  let badan: { company?: string; lingkungan?: string; [k: string]: unknown }
  try { badan = await req.json() } catch { return gagal('Permintaan tidak terbaca.', 'permintaan') }

  const lingkungan = (badan.lingkungan === 'produksi' ? 'produksi' : 'sandbox') as Lingkungan

  // Hak diperiksa lewat SESI pemanggil, bukan lewat service_role: yang
  // diperiksa dengan service_role cuma klaim yang ditulis pemanggil sendiri.
  const asPengguna = supabaseSebagaiPengguna(token)
  if (!asPengguna) return gagal('Setelan Supabase belum lengkap di server.', 'setelan', 500)

  const { data: ctx, error: eCtx } = await asPengguna.rpc('my_context')
  if (eCtx || !ctx?.signedIn) return gagal('Sesi sudah berakhir. Masuk lagi lalu coba lagi.', 'sesi', 401)

  const company: string | undefined = ctx.isSuper ? badan.company : ctx.company?.id
  if (!company) return gagal('Fasilitas tidak ditemukan untuk akun ini.', 'faskes')
  if (!ctx.isSuper && !['pemilik', 'admin'].includes(String(ctx.role))) {
    return gagal('Hanya pemilik dan admin yang boleh menjalankan pengiriman sistem nasional.', 'hak', 403)
  }

  const admin = supabaseAdmin()
  if (!admin) {
    return gagal('SUPABASE_SERVICE_ROLE_KEY belum dipasang di server, jadi kredensial tidak bisa dibuka dari Vault.',
      'setelan', 500)
  }

  const { data: kred, error: eKred } = await admin.rpc('ambil_kredensial', {
    p_company: company, p_sistem: 'satusehat', p_lingkungan: lingkungan,
  })
  if (eKred) return gagal(eKred.message, 'kredensial')

  const clientId = kred?.publik?.client_id
  const organizationId = kred?.publik?.organization_id
  const clientSecret = kred?.rahasia?.client_secret
  if (!clientId || !clientSecret) {
    return gagal('Kredensial tersimpan tapi tidak lengkap. Pasang ulang dari portal SatuSehat.', 'kredensial')
  }
  if (!organizationId) {
    // Tanpa ini `Encounter.identifier.system` tidak bisa dijahit dan
    // `serviceProvider` tidak punya tujuan. Lebih baik berhenti di sini
    // daripada mengantrekan payload yang pasti ditolak.
    return gagal('Organization ID belum diisi di kredensial SatuSehat faskes ini.', 'kredensial')
  }

  return {
    admin, company, lingkungan, organizationId, badan,
    konteks: {
      kunci: `${company}:${lingkungan}`,
      lingkungan,
      kredensial: { clientId, clientSecret, organizationId },
    },
  }
}
