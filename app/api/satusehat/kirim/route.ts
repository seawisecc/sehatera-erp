/**
 * Menguras antrean kirim SatuSehat untuk satu faskes.
 *
 * Batch, bukan satu per satu, dan bukan pula seluruh antrean sekaligus: satu
 * permintaan HTTP punya batas waktu, dan antrean seribu baris yang dikirim
 * dalam satu panggilan akan mati di tengah dengan separuhnya bertanda
 * `percobaan` naik tanpa pernah diketuk. Batas bawaannya kecil dan tombolnya
 * boleh ditekan berkali-kali.
 *
 * Penyaring faskes ada di `ambil_antrean_kirim` sejak migrasi 0072. Tanpa itu,
 * menekan tombol di satu klinik menaikkan `percobaan` baris klinik lain yang
 * ikut terambil tapi tidak diproses, dan sesudah beberapa kali kiriman mereka
 * ditinggalkan tanpa pernah dicoba.
 */

import { NextResponse } from 'next/server'
import { siapkanSatuSehat, gagal } from '@/lib/server/satusehat-konteks'
import { kirimBatch, type BarisAntrean } from '@/lib/satusehat/pengirim'

const BATAS_BAWAAN = 10
const BATAS_MAKS = 50

export async function POST(req: Request) {
  const siap = await siapkanSatuSehat(req)
  if (siap instanceof NextResponse) return siap

  const { data: antrean, error } = await siap.admin.rpc('ambil_antrean_kirim', {
    p_sistem: 'satusehat',
    p_batas: Math.min(BATAS_BAWAAN, BATAS_MAKS),
    p_company: siap.company,
  })
  if (error) return gagal(error.message, 'antrean')

  const baris = (antrean || []) as BarisAntrean[]
  if (!baris.length) {
    return NextResponse.json({
      ok: true, terkirim: 0, gagal: 0, dilewatiSudahAda: 0, galat: [],
      pesan: 'Antreannya kosong, atau yang tersisa sedang menunggu jeda percobaan berikutnya.',
    })
  }

  try {
    const h = await kirimBatch(siap.admin, siap.konteks, baris)
    return NextResponse.json({
      ok: true,
      ...h,
      pesan: `${h.terkirim} terkirim` +
        (h.dilewatiSudahAda ? `, ${h.dilewatiSudahAda} sudah ada di SatuSehat` : '') +
        (h.gagal ? `, ${h.gagal} gagal dan dijadwalkan ulang` : '') + '.',
    })
  } catch (e) {
    return gagal((e as Error).message, 'kirim', 500)
  }
}
