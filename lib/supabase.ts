import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/* Nama event yang dikirim saat sebuah BACAAN gagal. Didengar UmpanProvider.
   Ditulis di sini supaya pengirim dan pendengarnya memakai satu nama. */
export const GALAT_BACA = 'sehatera:galat-baca'

/**
 * Pembungkus fetch yang MENGUMUMKAN bacaan yang gagal.
 *
 * Audit 28 September 2026 menemukan 51 kueri baca yang membuang galatnya:
 * `const { data } = await ...`. Kalau salah satunya gagal, karena nama kolom
 * yang salah, jaringan putus, atau `permission denied`, layarnya cuma tampil
 * kosong seperti "belum ada data". Itu persis yang terjadi pada layar Kasir di
 * migrasi 0035, dan baru ketahuan dari pemilik.
 *
 * Menambal 51 tempat satu per satu akan ketinggalan di tempat ke-52. Jadi
 * penjaganya di sini: setiap GET ke REST yang dijawab bukan 2xx mengirim
 * event, dan layar mana pun yang sedang terbuka menampilkan pesannya. Tulisan
 * (POST/PATCH/DELETE) dan RPC tidak ikut: jalur itu sudah membaca galatnya
 * sendiri lewat `pesanError()`, dan dua pesan untuk satu kejadian cuma bising.
 */
const fetchBerjaga: typeof fetch = async (input, init) => {
  const res = await fetch(input, init)
  try {
    const metode = (init?.method || 'GET').toUpperCase()
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (!res.ok && (metode === 'GET' || metode === 'HEAD') && url.includes('/rest/v1/')
        && typeof window !== 'undefined') {
      const tabel = url.split('/rest/v1/')[1]?.split('?')[0] || ''
      window.dispatchEvent(new CustomEvent(GALAT_BACA, { detail: { status: res.status, tabel } }))
    }
  } catch { /* pengumuman tidak boleh menggagalkan permintaannya sendiri */ }
  return res
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchBerjaga },
})

// Client sementara TANPA menyimpan sesi, dipakai admin untuk membuat akun
// pengguna baru (auth.signUp) tanpa ikut mengganti sesi login admin yang sedang aktif.
export function createSignupClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}