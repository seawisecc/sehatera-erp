/**
 * Penjadwal pengiriman SatuSehat.
 *
 * Ini penjadwal PERTAMA di project ini. Sampai sekarang semua yang berkala
 * dipicu oleh seseorang yang membuka layar: `hanguskan_reservasi_lewat`
 * berjalan saat layar Reservasi dibuka, dan pengiriman SatuSehat dipicu dua
 * tombol. Untuk reservasi itu masih bisa hidup, karena yang perlu tahu memang
 * membuka layarnya tiap pagi. Untuk pengiriman ke sistem nasional tidak:
 * kunjungan yang ditutup Jumat sore tidak boleh menunggu sampai ada yang
 * kebetulan menekan tombol hari Senin.
 *
 *
 * ## Tiga hal yang membedakannya dari kedua tombol itu
 *
 * 1. **Tidak ada sesi.** `siapkanSatuSehat()` memeriksa hak lewat sesi
 *    pemanggil, dan itu memang benar untuk tombol. Penjadwal tidak punya
 *    pemanggil, jadi ia memakai pintu sendiri: satu rahasia bersama yang
 *    dikirim Vercel Cron di header. Yang TIDAK dilakukan adalah melonggarkan
 *    endpoint yang sudah ada supaya bisa dipanggil tanpa sesi; itu akan
 *    membuka pintu yang sekarang dijaga sesi untuk semua orang.
 *
 * 2. **Banyak faskes, bukan satu.** Tombol tahu faskesnya dari sesi;
 *    penjadwal harus bertanya. Daftarnya lewat `faskes_kirim_terjadwal()`,
 *    yang mengembalikan `company_id` saja (migrasi 0080).
 *
 * 3. **Anggarannya waktu, bukan jumlah.** Satu permintaan punya batas waktu,
 *    dan jumlah faskes akan bertambah tanpa ada yang mengubah angka di sini.
 *    Jadi yang dibatasi DETIK, bukan berapa faskes: yang belum kebagian ikut
 *    putaran berikutnya lima belas menit lagi, dan tidak ada yang hilang
 *    karena antreannya memang antrean.
 *
 *
 * ## Yang sengaja TIDAK dilakukan
 *
 * **Sandbox tidak ikut dijadwalkan** (lihat migrasi 0080). Sandbox tempat
 * orang mencoba, dan yang mencoba perlu melihat jawabannya sendiri.
 *
 * **Kegagalan satu faskes tidak menghentikan yang lain.** Tiap faskes dibungkus
 * `try`-nya sendiri. Tanpa itu, satu klinik yang kredensialnya kedaluwarsa
 * menghentikan pengiriman SELURUH klien, dan kegagalan yang sebabnya ada di
 * tenant lain adalah yang paling sulit dilacak.
 */

import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { supabaseAdmin } from '@/lib/server/supabase-admin'
import { antrekanKunjungan } from '@/lib/satusehat/antre'
import { kirimBatch, type BarisAntrean } from '@/lib/satusehat/pengirim'
import type { Konteks } from '@/lib/satusehat/klien'

/** Lebih longgar daripada bawaan, tapi jauh di bawah batas Vercel. */
export const maxDuration = 120

/**
 * Anggaran waktu satu putaran. Disisakan jeda dari `maxDuration` supaya
 * jawabannya sempat ditulis: putaran yang mati persis di batas waktu tidak
 * meninggalkan catatan apa pun tentang apa yang sudah dikerjakannya.
 */
const ANGGARAN_MS = 90_000

/** Kecil, karena ini berulang tiap lima belas menit dan bukan sekali tekan. */
const BATAS_KIRIM = 10

/**
 * Membandingkan rahasia tanpa membocorkan panjangnya lewat waktu.
 *
 * `a === b` berhenti di karakter pertama yang berbeda, dan selisih waktunya
 * bisa diukur dari luar untuk menebak rahasianya huruf demi huruf. Untuk satu
 * endpoint cron ini berlebihan, dan justru karena itu ia ditulis: yang
 * dikerjakan seadanya di tempat kecil akan disalin ke tempat besar.
 */
function samaAman(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

export async function GET(req: Request) {
  const rahasia = process.env.CRON_SECRET
  if (!rahasia) {
    // Menolak, bukan membuka. Endpoint cron yang berjalan tanpa rahasia adalah
    // endpoint yang bisa dipicu siapa pun yang tahu alamatnya, dan yang
    // dipicunya menyentuh sistem nasional atas nama klinik orang.
    return NextResponse.json(
      { ok: false, pesan: 'CRON_SECRET belum dipasang di server.' }, { status: 500 })
  }

  const bearer = req.headers.get('authorization') || ''
  const token = bearer.toLowerCase().startsWith('bearer ') ? bearer.slice(7).trim() : ''
  if (!token || !samaAman(token, rahasia)) {
    return NextResponse.json({ ok: false, pesan: 'Tidak berhak.' }, { status: 401 })
  }

  const admin = supabaseAdmin()
  if (!admin) {
    return NextResponse.json(
      { ok: false, pesan: 'SUPABASE_SERVICE_ROLE_KEY belum dipasang di server.' }, { status: 500 })
  }

  /**
   * Lingkungan boleh ditukar ke sandbox lewat `?lingkungan=sandbox`, dan itu
   * BUKAN kelonggaran: yang memanggil sudah membuktikan memegang CRON_SECRET,
   * yaitu rahasia server yang tidak dipegang pengguna mana pun.
   *
   * Ia ada karena satu hal yang lebih berbahaya daripada tidak ada: tanpa
   * jalan ini, kali PERTAMA penjadwal ini pernah berjalan sungguhan adalah
   * saat ia berjalan atas data produksi klinik orang. Penjadwal yang belum
   * pernah dicoba adalah penjadwal yang salah asumsinya belum ketahuan.
   *
   * Vercel Cron tetap memanggil tanpa parameter, jadi yang terjadwal selalu
   * `produksi`. Sandbox hanya bisa dipicu tangan oleh yang memegang rahasianya.
   */
  const lingkungan = new URL(req.url).searchParams.get('lingkungan') === 'sandbox'
    ? 'sandbox' : 'produksi'

  const { data: faskes, error: eFaskes } = await admin.rpc('faskes_kirim_terjadwal', {
    p_sistem: 'satusehat', p_lingkungan: lingkungan,
  })
  // Galat kueri TIDAK ditelan. Daftar kosong karena kolomnya salah nama
  // terbaca persis sama dengan "tidak ada yang perlu dikirim", dan yang kedua
  // terlihat seperti pekerjaan yang sudah selesai.
  if (eFaskes) {
    return NextResponse.json(
      { ok: false, langkah: 'daftar-faskes', pesan: eFaskes.message }, { status: 500 })
  }

  const mulai = Date.now()
  const sisaWaktu = () => ANGGARAN_MS - (Date.now() - mulai)

  const ringkas = {
    lingkungan,
    faskes: (faskes || []).length,
    diproses: 0,
    diantre: 0,
    terkirim: 0,
    gagal: 0,
    kehabisanWaktu: false,
    galat: [] as { company: string; pesan: string }[],
  }

  for (const row of (faskes || []) as { company_id: string }[]) {
    if (sisaWaktu() < 15_000) { ringkas.kehabisanWaktu = true; break }

    const company = row.company_id
    try {
      const { data: kred, error: eKred } = await admin.rpc('ambil_kredensial', {
        p_company: company, p_sistem: 'satusehat', p_lingkungan: lingkungan,
      })
      if (eKred) throw new Error(eKred.message)

      const clientId = kred?.publik?.client_id
      const clientSecret = kred?.rahasia?.client_secret
      const organizationId = kred?.publik?.organization_id
      if (!clientId || !clientSecret || !organizationId) {
        throw new Error(`Kredensial ${lingkungan} belum lengkap.`)
      }

      const konteks: Konteks = {
        kunci: `${company}:${lingkungan}`,
        lingkungan,
        kredensial: { clientId, clientSecret, organizationId },
      }

      // Mengisi antrean dulu, baru menguras. Urutannya penting: yang baru
      // ditutup sejak putaran terakhir ikut berangkat pada putaran ini juga,
      // bukan menunggu lima belas menit lagi.
      const h = await antrekanKunjungan(admin, company, organizationId)
      ringkas.diantre += h.diantre

      const { data: antrean, error: eAntre } = await admin.rpc('ambil_antrean_kirim', {
        p_sistem: 'satusehat', p_batas: BATAS_KIRIM, p_company: company,
      })
      if (eAntre) throw new Error(eAntre.message)

      const baris = (antrean || []) as BarisAntrean[]
      if (baris.length) {
        const k = await kirimBatch(admin, konteks, baris)
        ringkas.terkirim += k.terkirim
        ringkas.gagal += k.gagal
      }

      ringkas.diproses += 1
    } catch (e) {
      // Satu faskes gagal, sisanya jalan terus.
      ringkas.galat.push({ company, pesan: (e as Error).message })
    }
  }

  return NextResponse.json({ ok: true, ...ringkas, detikBerjalan: Math.round((Date.now() - mulai) / 1000) })
}
