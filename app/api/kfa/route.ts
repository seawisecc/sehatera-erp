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

type Hasil = {
  kode: string; nama: string; merek: string | null
  sediaan: string | null; satuan: string | null; nie: string | null; zat: number
}
type Skor = { h: Hasil; n: number }

/**
 * Berapa zat aktif di dalam satu nama produk KFA.
 *
 * Kamusnya memisahkan zat dengan garis miring: "Telmisartan 40 mg / Amlodipine
 * 10 mg Tablet" adalah dua zat. Yang tunggal tidak punya garis miring sama
 * sekali.
 */
const jumlahZat = (nama: string): number =>
  String(nama || '').split('/').filter(x => x.trim()).length

/**
 * Membuang kekuatan dan satuan dari yang diketik, menyisakan nama zatnya.
 *
 * **Bertanya lebih spesifik ke kamus KFA justru menghilangkan jawaban yang
 * benar.** Dibuktikan 17 September 2026:
 *
 * - `Paracetamol 500 mg` -> 60 hasil, **nol** di antaranya zat tunggal.
 * - `Paracetamol` -> 60 hasil, tujuh zat tunggal, termasuk
 *   **92001267 Paracetamol 500 mg Tablet** yang persis dicari.
 *
 * Jadi obatnya ADA di kamus; pencariannya yang menyembunyikannya begitu
 * kekuatan ikut diketik. Ini jenis kegagalan yang paling menyesatkan: yang
 * mencari dengan benar mendapat hasil paling buruk, lalu menyimpulkan obatnya
 * memang tidak terdaftar dan menekan hasil teratas yang kebetulan salah.
 *
 * Kekuatannya tidak dibuang begitu saja: ia tetap dipakai `nilai()` untuk
 * menaikkan yang kekuatannya cocok. Yang berubah cuma tempat penyaringannya,
 * dari kamus ke sini.
 */
/**
 * Nama zat yang di Indonesia ditulis berbeda dari yang dipakai kamus KFA.
 *
 * Masalah yang sama persis dengan pencarian ICD-10, dan sudah dua kali di
 * project ini: **ejaan bisa diselesaikan mesin, KOSAKATA tidak.** "Asam
 * mefenamat" bukan salah eja dari "Mefenamic Acid".
 *
 * Dibuktikan 17 September 2026 dengan menembak kamusnya:
 *
 * | Diketik | Hasil zat tunggal |
 * | --- | --- |
 * | Asam Mefenamat | **0** |
 * | Mefenamic | 4, teratas persis Mefenamic Acid 500 mg Tablet |
 *
 * Daftarnya pendek dan akan tumbuh. **Ini tempat pertama yang dilihat kalau
 * ada keluhan "obatnya tidak ketemu"**, persis seperti `icd_kata`: satu baris
 * di sini memperbaiki pencarian untuk banyak produk sekaligus.
 *
 * Yang sengaja TIDAK dilakukan: menerjemahkan nama obat dengan mesin. Alasan
 * yang sama dengan kenapa 18.543 nama ICD tidak diterjemahkan, dan kenapa
 * pemeriksaan interaksi obat tidak dibuat.
 */
const NAMA_ZAT: Record<string, string> = {
  'asam mefenamat': 'mefenamic',
  'asam askorbat': 'ascorbic acid',
  'asam traneksamat': 'tranexamic',
  'asam salisilat': 'salicylic acid',
  'parasetamol': 'paracetamol',
  'kalsium': 'calcium',
  'kodein': 'codeine',
  'deksametason': 'dexamethasone',
  'difenhidramin': 'diphenhydramine',
  'klorfeniramin': 'chlorphenamine',
  'ctm': 'chlorphenamine',
  'salbutamol sulfat': 'salbutamol',
  'seng': 'zinc',
  'natrium diklofenak': 'diclofenac sodium',
  'kalium diklofenak': 'diclofenac potassium',
  'amoksisilin': 'amoxicillin',
  'siprofloksasin': 'ciprofloxacin',
  'metformin hcl': 'metformin',
  'vitamin c': 'ascorbic acid',
}

function kataKunci(cari: string): string {
  const bersih = cari
    .replace(/\d+([.,]\d+)?\s*(mg|mcg|g|ml|iu|%)\b/gi, ' ')
    .replace(/\b(tablet|kaplet|kapsul|sirup|salep|krim|tetes|injeksi|supositoria|sachet)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  // Kalau yang tersisa terlalu pendek, yang diketik memang bukan "zat +
  // kekuatan" (misalnya nama merek berangka). Dikirim apa adanya.
  const inti = bersih.length >= 3 ? bersih : cari

  // Padanan dicari pada seluruh frasa lebih dulu, baru per kata: "asam
  // mefenamat" harus jadi satu padanan, bukan "asam" ditukar sendiri.
  const k = inti.toLowerCase()
  if (NAMA_ZAT[k]) return NAMA_ZAT[k]
  for (const [id, en] of Object.entries(NAMA_ZAT)) {
    if (k.includes(id)) return k.replace(id, en).trim()
  }
  return inti
}

/**
 * Menilai ulang hasil kamus KFA, karena peringkat bawaannya tidak bisa dipakai.
 *
 * Ini bukan penyempurna. Dicoba pada 17 September 2026, tiga pencarian yang
 * paling wajar di klinik mana pun mengembalikan hal yang sama sekali salah di
 * SELURUH sepuluh besarnya:
 *
 * | Dicari | Peringkat 1 bawaan kamus |
 * | --- | --- |
 * | Paracetamol 500 mg | tablet batuk-pilek berisi ENAM zat |
 * | Amlodipine 10 mg | Telmisartan 40 mg + Amlodipine 10 mg |
 * | Zinc 20 mg | multivitamin berisi TIGA BELAS zat |
 *
 * Paracetamol tunggal tidak muncul sama sekali. Kalau ada yang menekan hasil
 * teratas, yang tercatat di sistem nasional adalah pasien menerima obat yang
 * tidak pernah ia terima, dan itu tidak pernah muncul sebagai galat: payload-
 * nya sah, kirimannya diterima, dan yang salah cuma isinya.
 *
 * Yang dinilai tinggi: nama yang DIMULAI dengan yang dicari, dan yang zatnya
 * SEDIKIT. Obat tunggal yang dicari orang hampir selalu obat tunggal.
 *
 * **Penilaian ini tetap tidak memilih.** Ia cuma menaikkan yang masuk akal ke
 * atas; yang menekan tetap manusia, dan layarnya tetap mengatakan itu.
 */
function nilai(nama: string, cari: string): number {
  const n = nama.toLowerCase()
  const q = cari.toLowerCase().trim()
  let skor = 0

  // Kombinasi dihukum berat, dan hukumannya bertambah tiap zat. Angkanya
  // sengaja LEBIH BESAR daripada bonus `startsWith` di bawah: "Amlodipine
  // 10 mg / Indapamide" diawali persis oleh yang diketik, jadi tanpa ini ia
  // mengalahkan "Amlodipine Besilate 10 mg" yang justru obatnya.
  skor -= (jumlahZat(nama) - 1) * 70

  if (n.startsWith(q)) skor += 60
  else if (n.includes(q)) skor += 25

  // Tiap kata yang dicari dan ketemu menambah sedikit, jadi "amlodipine 10 mg"
  // tetap mengalahkan "amlodipine 5 mg" tanpa perlu mencocokkan angka sendiri.
  for (const kata of q.split(/\s+/).filter(Boolean)) {
    if (n.includes(kata)) skor += 8
  }

  // Yang pendek lebih mungkin obat tunggal yang dicari, yang panjang hampir
  // selalu daftar zat multivitamin.
  skor -= Math.floor(nama.length / 25)
  return skor
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
    // Yang DIKIRIM ke kamus cuma nama zatnya, tanpa kekuatan. Kekuatannya
    // dipakai menilai di sini. Lihat `kataKunci()`: bertanya lebih spesifik
    // ke kamus ini justru MENGHILANGKAN jawaban yang benar.
    //
    // Diambil jauh lebih banyak daripada yang ditampilkan, karena peringkat
    // bawaan kamusnya tidak bisa dipakai. Lihat `nilai()`.
    const r = await fetch(`${DASAR}/${jalur}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: 1, size: 60, search: kataKunci(cari), search_by: 'name', farmalkes_type: '' }),
      cache: 'no-store',
    })
    if (!r.ok) {
      return NextResponse.json({ ok: false, pesan: `Kamus KFA menjawab ${r.status}.` }, { status: 502 })
    }
    const j = await r.json()

    const mentah = (j?.data || []).map((x: any) => ({
      kode: x.kfaCode,
      nama: x.name as string,
      merek: x.tradeName || null,
      sediaan: x.dosageFormName || null,
      satuan: x.uomName || null,
      nie: x.nie || null,
      // Berapa zat aktif di dalamnya. Ditampilkan supaya obat kombinasi
      // terlihat sebagai kombinasi tanpa harus membaca seluruh namanya.
      zat: jumlahZat(x.name),
    }))

    const hasil = mentah
      .map((h: Hasil) => ({ h, n: nilai(h.nama, cari) }))
      .sort((a: Skor, b: Skor) => b.n - a.n)
      .slice(0, 12)
      .map((x: Skor) => x.h)

    return NextResponse.json({ ok: true, hasil })
  } catch (e) {
    return NextResponse.json({ ok: false, pesan: `Tidak bisa menghubungi kamus KFA: ${(e as Error).message}` }, { status: 502 })
  }
}
