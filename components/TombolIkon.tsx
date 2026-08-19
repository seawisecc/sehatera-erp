'use client'

import type { ReactNode } from 'react'

/**
 * Tombol aksi berbentuk ikon, dengan keterangan yang muncul saat disentuh
 * tetikus.
 *
 * Ikon saja menghemat lebar, dan itu yang membuat baris tabel tetap terbaca
 * saat aksinya empat. Tapi ikon saja juga berarti orang menebak, dan yang
 * menebak di daftar pasien bisa menekan "daftarkan kunjungan" padahal cuma
 * ingin melihat nomor telepon.
 *
 * Keterangannya dua lapis, dan keduanya perlu:
 *
 * - `title` bawaan peramban, supaya tetap terbaca oleh pembaca layar dan
 *   pengguna papan ketik, dan tetap muncul walau CSS-nya gagal dimuat.
 * - Gelembung sendiri, karena `title` bawaan baru muncul sesudah satu detik
 *   lebih dan di layar sesibuk daftar pasien itu terlalu lama untuk menolong
 *   siapa pun.
 *
 * `aria-label` diisi teks yang sama: tombol yang isinya cuma ikon tidak punya
 * nama apa pun bagi pembaca layar.
 */
export default function TombolIkon({
  label, onClick, disabled, warna = 'netral', children,
}: {
  label: string
  onClick: (e: React.MouseEvent) => void
  disabled?: boolean
  warna?: 'netral' | 'brand' | 'bahaya'
  children: ReactNode
}) {
  const gaya =
    warna === 'brand'  ? 'text-[var(--brand)] hover:bg-[var(--surface-2)] hover:border-[var(--brand)]'
    : warna === 'bahaya' ? 'text-red-600 hover:bg-red-50 hover:border-red-300'
    : 'text-[var(--ink-soft)] hover:bg-[var(--surface-2)] hover:text-[var(--brand)] hover:border-[var(--brand)]'

  return (
    <span className="relative inline-flex group">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={label}
        aria-label={label}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--line)] transition disabled:opacity-40 disabled:cursor-not-allowed ${gaya}`}>
        {children}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-md bg-[var(--ink)] px-2 py-1 text-[11px] font-medium text-[var(--surface)] opacity-0 shadow-md transition-opacity duration-100 group-hover:opacity-100 z-20">
        {label}
      </span>
    </span>
  )
}
