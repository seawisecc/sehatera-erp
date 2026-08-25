/**
 * Mencari kode KFA lewat kamus farmasi nasional.
 *
 * **Bukan bagian dari API SatuSehat yang berkredensial.** Ini API yang dipakai
 * halaman kfa-browser publik di satusehat.kemkes.go.id, terbuka tanpa
 * autentikasi, dan TIDAK didokumentasikan di mana pun. Konsekuensinya harus
 * diterima sadar: ia bisa berubah bentuk atau hilang tanpa pemberitahuan, dan
 * kalau itu terjadi yang berhenti cuma pencariannya. Kode yang sudah tersimpan
 * di `products.kode_kfa` tetap utuh dan resep tetap bisa dikirim, karena yang
 * dipakai mengirim adalah kolom itu, bukan pencarian ini.
 *
 * Lewat server, bukan langsung dari peramban, karena satusehat.kemkes.go.id
 * tidak mengizinkan permintaan lintas asal dari localhost maupun dari domain
 * klinik.
 *
 * **Hasilnya USULAN, bukan jawaban.** Mencari "paracetamol 500 mg tablet"
 * mengembalikan obat kombinasi lebih dulu, karena peringkatnya longgar. Yang
 * memilih harus manusia: kode KFA yang salah berarti melaporkan pasien
 * menerima obat yang tidak pernah ia terima, dan itu jenis kesalahan yang
 * tidak terlihat sebagai galat di mana pun.
 */

import { NextResponse } from 'next/server'

const DASAR = 'https://satusehat.kemkes.go.id/kfa-browser/farmasi/api/search'

/** Tiga daftar terpisah, dan awalan kodenya berbeda. */
const JALUR: Record<string, string> = {
  varian: 'product-variants',      // 93xxxxxx, merek tertentu dari pabrik tertentu
  template: 'product-templates',   // 92xxxxxx, zat aktif + kekuatan + bentuk sediaan
  zat: 'active-ingredients',       // 91xxxxxx, zat aktifnya saja
}

export async function POST(req: Request) {
  let badan: { cari?: string; jenis?: string }
  try { badan = await req.json() } catch { return NextResponse.json({ ok: false, pesan: 'Permintaan tidak terbaca.' }, { status: 400 }) }

  const cari = String(badan.cari || '').trim()
  const jalur = JALUR[String(badan.jenis || 'varian')] || JALUR.varian
  if (cari.length < 3) {
    return NextResponse.json({ ok: true, hasil: [], pesan: 'Ketik minimal tiga huruf.' })
  }

  try {
    const r = await fetch(`${DASAR}/${jalur}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: 1, size: 10, search: cari, search_by: 'name', farmalkes_type: '' }),
      cache: 'no-store',
    })
    if (!r.ok) {
      return NextResponse.json({ ok: false, pesan: `Kamus KFA menjawab ${r.status}.` }, { status: 502 })
    }
    const j = await r.json()
    return NextResponse.json({
      ok: true,
      hasil: (j?.data || []).map((x: any) => ({
        kode: x.kfaCode,
        nama: x.name,
        merek: x.tradeName || null,
        sediaan: x.dosageFormName || null,
        satuan: x.uomName || null,
        nie: x.nie || null,
      })),
    })
  } catch (e) {
    return NextResponse.json({ ok: false, pesan: `Tidak bisa menghubungi kamus KFA: ${(e as Error).message}` }, { status: 502 })
  }
}
