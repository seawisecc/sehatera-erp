'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLang } from '@/lib/i18n'
import { angka } from '@/lib/format'

/**
 * Menggambar daftar panjang SEDIKIT DEMI SEDIKIT.
 *
 * Sejak daftar berhenti terpotong di 1.000 baris (lib/semua.ts), layar Produk
 * bisa menerima 8.000 baris dan layar Pasien ribuan. Menggambar semuanya
 * sekaligus berarti ribuan baris, masing-masing dengan tombol dan ikonnya,
 * dibangun ulang tiap kali satu huruf diketik di kotak cari. Di komputer kasir
 * kelas bawah itu jeda beberapa detik, persis saat antrean paling panjang.
 *
 * Yang dibatasi hanya yang DIGAMBAR, bukan yang dicari: saringan tetap
 * berjalan atas seluruh daftar, jadi obat ke-7.000 tetap ketemu begitu
 * namanya diketik. Batasnya kembali ke awal tiap kali saringannya berubah.
 */
export function useBertahap<T>(daftar: T[], langkah = 100) {
  const [batas, setBatas] = useState(langkah)
  // Daftar hasil saringan yang baru selalu mulai dari halaman pertama.
  useEffect(() => { setBatas(langkah) }, [daftar, langkah])
  const tampil = useMemo(() => daftar.slice(0, batas), [daftar, batas])
  return {
    tampil,
    sisa: Math.max(0, daftar.length - batas),
    tambah: () => setBatas(b => b + langkah),
    langkah,
  }
}

/** Tombol "Tampilkan lagi" yang menyebut berapa yang belum tampil. */
export function TombolLagi({ sisa, langkah, tambah }: { sisa: number; langkah: number; tambah: () => void }) {
  const { t } = useLang()
  if (sisa <= 0) return null
  const n = Math.min(sisa, langkah)
  return (
    <div className="flex items-center justify-center gap-3 py-4 text-sm">
      <span className="text-[var(--ink-faint)] num">
        {t(`${angka(sisa)} lagi belum ditampilkan`, `${angka(sisa)} more not shown`)}
      </span>
      <button type="button" onClick={tambah}
        className="px-4 py-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] font-medium text-[var(--ink)] hover:bg-[var(--surface-2)] transition">
        {t(`Tampilkan ${angka(n)} lagi`, `Show ${angka(n)} more`)}
      </button>
    </div>
  )
}
