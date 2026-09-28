/* Mengambil SELURUH baris sebuah kueri, halaman demi halaman.

   PostgREST memotong tiap jawaban di 1.000 baris (max_rows project ini,
   dibuktikan 28 September 2026: `content-range: 0-999/18543` pada icd10), dan
   potongannya TIDAK muncul sebagai galat: `data` berisi 1.000 baris, `error`
   null, dan layarnya menjumlahkan yang ada. Apotek yang katalognya 1.500 item
   tidak menemukan produk ke-1.001 di kasir, dan apotek yang ramai kehilangan
   transaksi sesudah hari ke-25 dari laporan bulanannya.

   Dipakai untuk daftar yang MEMANG bisa melewati 1.000: produk, batch,
   transaksi, item transaksi, pasien, dan ekspor. Kotak pencarian yang sudah
   memasang `.limit(8)` tidak perlu ini.

   `buat` harus membangun kueri BARU tiap dipanggil: builder Supabase yang
   sudah di-await tidak bisa dipakai ulang. Urutan `id` ditambahkan sebagai
   pemutus seri, karena tanpa urutan yang unik dua halaman boleh saling
   beririsan atau melompati baris yang nilai urutannya kembar. */

export const HALAMAN = 1000

export async function semua<T = any>(
  buat: () => any,
  pemutusSeri: string | null = 'id',
): Promise<{ data: T[]; error: any }> {
  const hasil: T[] = []
  for (let dari = 0; ; dari += HALAMAN) {
    let q = buat()
    if (pemutusSeri) q = q.order(pemutusSeri, { ascending: true })
    const { data, error } = await q.range(dari, dari + HALAMAN - 1)
    // Galat di halaman mana pun dikembalikan, bukan ditelan: separuh daftar
    // yang tampil tanpa keterangan lebih menyesatkan daripada pesan galat.
    if (error) return { data: hasil, error }
    const baris = (data as T[]) || []
    hasil.push(...baris)
    // Halaman yang tidak penuh berarti ujungnya sudah tercapai. Ini bersandar
    // pada HALAMAN sama dengan max_rows server; kalau max_rows diturunkan,
    // angka di atas ikut diturunkan.
    if (baris.length < HALAMAN) return { data: hasil, error: null }
  }
}
