import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tidak ada koneksi',
  robots: { index: false, follow: false },
}

/**
 * Halaman yang muncul saat aplikasi terpasang dibuka tanpa koneksi.
 *
 * Ia disimpan service worker (`public/sw.js`) supaya ada saat dibutuhkan, dan
 * karena itu ia ditulis TANPA bergantung pada JavaScript apa pun: tombolnya
 * tautan biasa, gambarnya berkas yang ikut disimpan. Halaman luring yang baru
 * berguna sesudah bundel JavaScript-nya berhasil diunduh adalah halaman yang
 * tidak pernah muncul.
 *
 * Nadanya sengaja menyebutkan apa yang harus dilakukan, bukan cuma melapor
 * gagal: yang membacanya sedang berdiri di depan pasien yang menunggu.
 */
export default function Luring() {
  return (
    <div className="sw-ambient min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-192.png" alt="" width={72} height={72} className="rounded-2xl" />

      <div className="space-y-2 max-w-md">
        <h1 className="text-xl font-semibold text-[var(--ink)]">Tidak ada koneksi</h1>
        <p className="text-sm text-[var(--ink-soft)]">
          Sehatera menyimpan seluruh datanya di server, jadi kasir, rekam medis, dan stok
          menuntut koneksi internet. Periksa jaringan klinik, lalu coba lagi.
        </p>
      </div>

      <a
        href="/beranda"
        className="px-5 py-2.5 rounded-xl bg-[var(--brand)] text-[var(--on-brand)] text-sm font-semibold"
      >
        Coba lagi
      </a>
    </div>
  )
}
