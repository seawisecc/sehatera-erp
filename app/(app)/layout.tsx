'use client'

import { Suspense } from 'react'
import { AppProvider, useApp } from '@/lib/app-context'
import { AppShell } from '@/components/layout/AppShell'
import { Mark } from '@/components/Logo'
import { UmpanProvider } from '@/components/Umpan'

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
    <Suspense fallback={<Memuat />}>
      <AppProvider>
        <UmpanProvider>
          <Gerbang>{children}</Gerbang>
        </UmpanProvider>
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

/**
 * Layar tunggu sebelum sesi terbaca.
 *
 * Memakai lambang Sehatera, bukan cuma lingkaran berputar. Ini layar pertama
 * yang dilihat orang tiap kali membuka aplikasi, dan sampai sekarang ia satu-
 * satunya tempat yang masih terasa milik aplikasi lain. Cincin berputarnya
 * mengelilingi lambang, jadi tetap jelas bahwa sesuatu sedang berjalan.
 */
function Memuat() {
  return (
    <div className="sw-ambient min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <span
          className="absolute inset-0 rounded-full border-2 border-[var(--line)] border-t-[var(--brand)] animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
        <Mark size={30} />
      </div>
      <p className="text-sm font-medium text-[var(--ink-soft)]">Sehatera</p>
      <span className="sr-only" role="status">Memuat</span>
    </div>
  )
}
