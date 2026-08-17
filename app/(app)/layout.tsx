'use client'

import { Suspense } from 'react'
import { AppProvider, useApp } from '@/lib/app-context'
import { AppShell } from '@/components/layout/AppShell'
import { useLang } from '@/lib/i18n'

/**
 * Layout untuk seluruh halaman di dalam aplikasi.
 *
 * Nama grupnya `(app)` dengan tanda kurung, jadi ia TIDAK ikut ke alamat:
 * `app/(app)/layanan/page.tsx` tetap dilayani di `/layanan`. Yang didapat
 * adalah satu tempat memasang sesi, state bersama, dan kerangka, tanpa memaksa
 * setiap alamat memakai awalan yang tidak berarti apa-apa bagi penggunanya.
 *
 * Kerangkanya tetap terpasang saat isi halaman berganti, jadi sidebar dan
 * topbar tidak dirender ulang tiap pindah menu.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // useSearchParams di dalam AppShell (jembatan `?p=` selama pemecahan)
    // mewajibkan batas Suspense; tanpa ini seluruh grup dipaksa render dinamis
    // dan build memberi peringatan.
    <Suspense fallback={<Memuat />}>
      <AppProvider>
        <Gerbang>{children}</Gerbang>
      </AppProvider>
    </Suspense>
  )
}

/**
 * Menahan render sampai sesi selesai dibaca.
 *
 * Tanpa ini menu sempat terlukis dengan hak akses kosong lalu berubah begitu
 * peran diketahui: menu berkedip muncul-hilang tiap kali halaman dibuka, dan
 * yang paling terlihat adalah menu yang seharusnya TIDAK boleh dilihat orang
 * itu sempat tampil sekejap.
 */
function Gerbang({ children }: { children: React.ReactNode }) {
  const { siap } = useApp()
  if (!siap) return <Memuat />
  return <AppShell>{children}</AppShell>
}

function Memuat() {
  return (
    <div className="sw-ambient min-h-screen flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-[var(--line)] border-t-[var(--brand)] animate-spin" />
      <p className="text-sm text-[var(--ink-faint)]">Memuat…</p>
    </div>
  )
}
