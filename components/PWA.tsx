'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { Download } from 'lucide-react'

/**
 * Pemasangan Sehatera sebagai aplikasi.
 *
 * Dua hal yang tidak berhubungan tapi tinggal berdekatan karena keduanya
 * urusan yang sama bagi penggunanya: mendaftarkan service worker, dan
 * menyimpan tawaran pasang dari Chrome supaya bisa ditekan dari tombol
 * aplikasi ini sendiri.
 *
 * Tombol sendiri itu perlu. Chrome memang memasang ikonnya di bilah alamat,
 * tapi ikon itu kecil, tidak bernama, dan berada di bagian layar yang
 * dianggap milik peramban, bukan milik aplikasi. Yang tidak pernah dilihat
 * sama saja dengan tidak ada.
 */

type TawaranPasang = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Tawarannya ditangkap di RUANG MODUL, bukan di dalam `useEffect`.
 *
 * `beforeinstallprompt` dikirim sekali saja dan tidak bisa diminta ulang.
 * Kalau pendengarnya baru dipasang sesudah komponen selesai dirender, ia
 * bisa terlambat, dan yang terjadi bukan galat melainkan tombol yang tidak
 * pernah muncul di sebagian komputer: kegagalan yang paling sulit dipercaya
 * karena di komputer yang menguji ia selalu muncul.
 */
let tawaran: TawaranPasang | null = null
const pendengar = new Set<() => void>()

function umumkan() { pendengar.forEach((f) => f()) }
function berlangganan(f: () => void) { pendengar.add(f); return () => { pendengar.delete(f) } }
function bacaTawaran() { return tawaran }

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    tawaran = e as TawaranPasang
    umumkan()
  })
  // Sesudah terpasang tawarannya tidak berlaku lagi, dan tombol "Instal" di
  // dalam aplikasi yang SUDAH terpasang cuma membingungkan.
  window.addEventListener('appinstalled', () => { tawaran = null; umumkan() })
}

export function PWA() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    /**
     * Di mode pengembangan service worker-nya justru DICABUT, bukan dipasang.
     *
     * `sw.js` mengambil `/_next/static/` dari cache lebih dulu karena di hasil
     * build nama berkasnya membawa hash isinya. Di `npm run dev` alamat yang
     * sama berisi kode yang berubah tiap kali berkas disimpan, jadi service
     * worker yang sama akan menyajikan kode kemarin dan setiap perbaikan
     * terlihat tidak berpengaruh. Mencabutnya di sini juga membersihkan
     * pemasangan yang tertinggal dari sesi produksi di localhost.
     */
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations()
        .then((rs) => rs.forEach((r) => r.unregister()))
        .catch(() => {})
      return
    }

    // `updateViaCache: 'none'` supaya berkas service worker-nya sendiri tidak
    // pernah diambil dari cache peramban: yang menyimpan pembaruan tidak boleh
    // ikut tersimpan, kalau tidak versi lamanya bertahan berhari-hari.
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch(() => {
        // Gagal mendaftar bukan alasan mengganggu orang yang sedang bekerja:
        // tanpa service worker aplikasinya tetap berjalan penuh.
      })
  }, [])

  return null
}

/**
 * Tombol pasang. Menyembunyikan dirinya sendiri kalau Chrome belum menawarkan
 * pemasangan: sudah terpasang, sedang dibuka dari aplikasi yang terpasang,
 * atau peramban yang tidak mendukungnya sama sekali (Safari iOS memasang
 * lewat menu Bagikan, dan tidak ada API untuk memicunya).
 */
export function TombolInstal({ className = '' }: { className?: string }) {
  const siap = useSyncExternalStore(berlangganan, bacaTawaran, () => null)
  if (!siap) return null

  const pasang = async () => {
    // Tawarannya sekali pakai. Dibuang apa pun jawabannya, kalau tidak
    // tombolnya tetap ada tapi tekanan keduanya tidak melakukan apa-apa.
    const e = siap
    tawaran = null
    umumkan()
    try { await e.prompt() } catch {}
  }

  return (
    <button
      type="button"
      onClick={pasang}
      title="Pasang Sehatera sebagai aplikasi"
      className={`inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 transition hover:border-[var(--brand-soft)] ${className}`}
    >
      <Download size={14} className="text-[var(--brand)] shrink-0" />
      <span className="text-xs font-medium text-[var(--ink-soft)] whitespace-nowrap">Instal</span>
    </button>
  )
}
