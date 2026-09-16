/**
 * Mengisi antrean kirim dengan Encounter dari kunjungan yang sudah selesai.
 *
 * Dipicu TOMBOL, bukan penjadwal, karena project ini belum punya penjadwal.
 * Pola yang sama dengan `hanguskan_reservasi_lewat` yang berjalan saat layar
 * Reservasi dibuka. Begitu ada penjadwal, endpoint inilah yang dipanggilnya,
 * dan tidak ada yang perlu ditulis ulang.
 *
 * Yang KURANG tidak diantrekan, dan alasannya dikembalikan ke layar per
 * kunjungan. Mengantrekan payload yang sudah pasti ditolak cuma menumpuk baris
 * yang gagal enam kali lalu ditinggalkan, dan kalimat penjelasannya baru
 * terbaca berhari-hari kemudian dari dalam antrean.
 */

import { NextResponse } from 'next/server'
import { siapkanSatuSehat, gagal } from '@/lib/server/satusehat-konteks'
import { antrekanKunjungan } from '@/lib/satusehat/antre'

export async function POST(req: Request) {
  const siap = await siapkanSatuSehat(req)
  if (siap instanceof NextResponse) return siap

  try {
    const h = await antrekanKunjungan(siap.admin, siap.company, siap.organizationId)
    return NextResponse.json({
      ok: true,
      ...h,
      pesan: h.diantre === 0 && h.sudahAda === 0 && h.dilewati.length === 0
        ? 'Tidak ada yang perlu dikirim. Semua kunjungan sudah lengkap di SatuSehat.'
        : `${h.diantre} masuk antrean` +
          // Disebut per tahap, bukan cuma totalnya. Kunjungan berangkat dalam
          // tiga kiriman, jadi "3 masuk antrean" tanpa keterangan tidak
          // memberi tahu apakah itu tiga kunjungan atau satu kunjungan yang
          // sedang menempuh tahap berikutnya.
          (h.diantre
            ? ` (${h.tahap.encounter} kunjungan baru, ${h.tahap.condition} diagnosis, ${h.tahap.procedure} tindakan, ${h.tahap.resep} obat, ${h.tahap.lab} hasil lab, ${h.tahap.final} penutupan)`
            : '') +
          (h.diulang ? `, ${h.diulang} yang dulu gagal dicoba lagi dengan bentuk yang sudah dibetulkan` : '') +
          (h.sudahAda ? `, ${h.sudahAda} sudah antre sebelumnya` : '') +
          (h.dilewati.length ? `, ${h.dilewati.length} menunggu tahap sebelumnya atau datanya belum lengkap` : '') + '.',
    })
  } catch (e) {
    return gagal((e as Error).message, 'antre', 500)
  }
}
