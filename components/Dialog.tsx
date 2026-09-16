'use client'

import { useCallback, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import Portal from '@/components/Portal'

/**
 * Jendela dialog: satu bentuk untuk seluruh aplikasi.
 *
 * Sebelum ini ada 25 dialog yang markupnya ditulis ulang satu per satu, dan
 * ketiganya salah dengan cara yang sama persis di telepon:
 *
 * 1. **`max-h-[90vh]` bukan tinggi layar di iPhone.** `vh` di Safari iOS
 *    mengukur layar TANPA bilah alamat, jadi dialog setinggi 90vh sebenarnya
 *    menjulur ke bawah tepi layar selama bilah alamatnya masih terlihat. Yang
 *    tersembunyi di ujung bawah selalu bagian yang sama: tombol simpannya.
 *    Beberapa dialog bahkan menumpuk `pt-[10vh]` di atas `max-h-[85vh]`, jadi
 *    95vh sebelum bilah alamat ikut dihitung.
 *
 * 2. **Papan ketik menutupi separuh layar.** Begitu satu kotak isian
 *    disentuh, tinggi yang terlihat tinggal setengah, dan dialog yang seluruh
 *    isinya satu kolom bergulir berarti tombol simpan terdorong jauh di bawah
 *    papan ketik. Orang mengetik, lalu tidak menemukan jalan menyimpannya.
 *
 * 3. **Dialog tengah layar itu bentuk desktop.** Di telepon yang terjangkau
 *    ibu jari adalah bagian BAWAH layar, dan kartu mengambang di tengah
 *    dengan tepi 16px di kiri-kanan membuang lebar yang justru langka.
 *
 * Jawabannya satu bentuk dengan dua wujud: lembar yang naik dari bawah di
 * telepon, kartu di tengah pada layar lebar. Kepala dan kaki dialog DIAM,
 * hanya badannya yang bergulir, jadi tombol simpan tidak pernah bisa berada
 * di luar jangkauan seberapa pun panjang isinya.
 *
 * Selalu lewat `<Portal>`: `position: fixed` diukur dari kartu terdekat yang
 * memasang `backdrop-filter`, bukan dari layar, dan kartu di aplikasi ini
 * banyak yang memasangnya. Alasan lengkapnya ada di `components/Portal.tsx`.
 */

const LEBAR = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-3xl',
  full: 'sm:max-w-5xl',
} as const

export default function Dialog({
  buka = true,
  judul,
  sub,
  lebar = 'md',
  onTutup,
  aksi,
  children,
  labelTutup = 'Tutup',
}: {
  buka?: boolean
  judul?: React.ReactNode
  sub?: React.ReactNode
  lebar?: keyof typeof LEBAR
  /** Dipanggil oleh Esc, klik latar, dan tombol silang. */
  onTutup: () => void
  /** Baris tombol yang menempel di kaki dialog dan tidak pernah ikut bergulir. */
  aksi?: React.ReactNode
  children: React.ReactNode
  labelTutup?: string
}) {
  const kotakRef = useRef<HTMLDivElement>(null)
  const asalFokus = useRef<HTMLElement | null>(null)

  const tutup = useCallback(() => onTutup(), [onTutup])

  /**
   * Esc menutup dialog, dan halaman di belakangnya berhenti bergulir.
   *
   * Tanpa penguncian itu, menggulung di dalam dialog yang isinya sudah mentok
   * berlanjut menggulung halaman di belakangnya; saat dialognya ditutup orang
   * mendapati dirinya di tempat lain tanpa tahu kenapa. `overscroll-behavior`
   * pada badannya menahan sebagian besar, tapi tidak pada latar dialognya.
   */
  useEffect(() => {
    if (!buka) return

    asalFokus.current = document.activeElement as HTMLElement | null

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); tutup() }
    }
    document.addEventListener('keydown', onKey)

    const gaya = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    /**
     * Fokus masuk ke dalam dialog, kalau tidak papan ketik dan pembaca layar
     * masih berada di halaman yang sudah tertutup di belakangnya.
     *
     * Di layar SENTUH yang difokuskan kotak dialognya, bukan kotak isian
     * pertamanya. Memfokuskan isian di telepon memanggil papan ketik seketika,
     * dan papan ketik menutupi separuh lembar yang baru saja naik: orang
     * melihat dialognya melompat sebelum sempat membaca judulnya. Di tetikus
     * tidak ada papan ketik yang muncul, jadi di sana isian pertama memang
     * yang benar.
     */
    const sentuh = typeof window.matchMedia === 'function'
      && window.matchMedia('(pointer: coarse)').matches

    const id = window.setTimeout(() => {
      const kotak = kotakRef.current
      if (!kotak) return
      if (sentuh) { kotak.focus(); return }
      const bisa = kotak.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([readonly]), select, textarea, button, [href], [tabindex]:not([tabindex="-1"])',
      )
      bisa?.focus()
    }, 40)

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = gaya
      window.clearTimeout(id)
      // Fokus kembali ke tombol yang membukanya. Yang tidak dikembalikan
      // melemparkan pengguna papan ketik ke awal halaman.
      asalFokus.current?.focus?.()
    }
  }, [buka, tutup])

  if (!buka) return null

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute inset-0 bg-black/45 sw-anim-fade" onClick={tutup} aria-hidden="true" />

        <div
          ref={kotakRef}
          tabIndex={-1}
          onClick={e => e.stopPropagation()}
          className={`relative w-full ${LEBAR[lebar]} flex flex-col
            bg-[var(--surface)] shadow-xl
            rounded-t-3xl sm:rounded-2xl
            max-h-[92dvh] sm:max-h-[88dvh]
            sw-sheet sm:animate-none`}
        >
          {/* Pegangan lembar. Hanya di telepon, dan ia bukan hiasan: bentuk
              yang naik dari bawah harus terbaca sebagai sesuatu yang bisa
              ditutup, bukan sebagai halaman baru. */}
          <div className="sm:hidden pt-2.5 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-[var(--line)] mx-auto" />
          </div>

          {(judul || sub) && (
            <div className="shrink-0 flex items-start justify-between gap-3 px-5 sm:px-6 pt-3 sm:pt-5 pb-3 border-b border-[var(--line-soft)]">
              <div className="min-w-0">
                {judul && <h2 className="text-base font-semibold text-[var(--ink)] leading-snug">{judul}</h2>}
                {sub && <p className="text-xs text-[var(--ink-soft)] mt-0.5 leading-relaxed">{sub}</p>}
              </div>
              <button
                type="button"
                onClick={tutup}
                aria-label={labelTutup}
                className="sw-tap shrink-0 -mr-1 w-8 h-8 flex items-center justify-center rounded-lg text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Satu-satunya bagian yang bergulir. */}
          <div className={`sw-gulung flex-1 min-h-0 px-5 sm:px-6 py-4 ${aksi ? '' : 'pb-6 sw-aman-bawah'}`}>
            {children}
          </div>

          {aksi && (
            <div
              className="shrink-0 flex flex-wrap items-center gap-2 px-5 sm:px-6 py-3 border-t border-[var(--line-soft)] bg-[var(--surface)] rounded-b-none sm:rounded-b-2xl"
              style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
            >
              {aksi}
            </div>
          )}
        </div>
      </div>
    </Portal>
  )
}

/**
 * Tombol kaki dialog, dua ukuran saja.
 *
 * Ditaruh di sini, bukan di `lib/ui.ts`, karena ia hanya benar DI DALAM kaki
 * dialog: `flex-1` membuat dua tombol membagi lebar sama rata, dan itu bentuk
 * yang salah di mana pun selain baris tombol yang menempel di tepi bawah.
 */
export const TOMBOL_UTAMA =
  'sw-tap flex-1 min-w-[8rem] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand)] text-[var(--on-brand)] text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed'

export const TOMBOL_KEDUA =
  'sw-tap flex-1 min-w-[8rem] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--line)] text-[var(--ink-soft)] text-sm font-medium hover:bg-[var(--surface-2)] transition disabled:opacity-50'

export const TOMBOL_BAHAYA =
  'sw-tap flex-1 min-w-[8rem] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50'
