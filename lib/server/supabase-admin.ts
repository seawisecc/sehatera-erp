/**
 * Client Supabase ber-service_role. HANYA untuk sisi server.
 *
 * Ini kunci yang melewati SELURUH RLS aplikasi. Ia ada di sini karena satu
 * fungsi memang menuntutnya: `ambil_kredensial()` dicabut dari `authenticated`
 * di migrasi 0055, dan itu disengaja. Kunci anon ada di dalam peramban tiap
 * pengguna; kalau fungsi itu terbuka untuk `authenticated`, Vault berhenti
 * berarti apa pun.
 *
 * Dua aturan yang tidak boleh dilanggar berkas ini:
 *
 * 1. Namanya TIDAK berawalan `NEXT_PUBLIC_`. Awalan itu menanam nilainya ke
 *    dalam bundel peramban, dan kunci service_role yang sampai ke peramban
 *    sama saja dengan membuka seluruh database ke publik.
 * 2. Berkas ini tidak boleh diimpor komponen. Yang mengimpornya cuma Route
 *    Handler di `app/api/`.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let admin: SupabaseClient | null = null

/**
 * Mengembalikan null kalau kuncinya belum dipasang, bukan melempar saat modul
 * dimuat. Pemasangan yang belum lengkap harus terbaca sebagai satu kalimat di
 * layar orang yang menekan tombolnya, bukan sebagai halaman yang gagal
 * dirender seluruhnya.
 */
export function supabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  if (!admin) {
    admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return admin
}

/**
 * Client yang MEMAKAI sesi pemanggilnya, bukan service_role.
 *
 * Dipakai untuk satu hal saja: membuktikan bahwa yang menekan tombol memang
 * dia, dan memang berhak atas faskes yang disebutnya. Pembuktian itu harus
 * lewat jalur yang tunduk pada RLS, kalau tidak ia cuma mengulang klaim
 * pemanggil dengan kata-kata sendiri.
 */
export function supabaseSebagaiPengguna(accessToken: string): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}
