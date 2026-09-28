'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Dialog, { TOMBOL_KEDUA, TOMBOL_UTAMA } from '@/components/Dialog'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'

/**
 * Keluar sendiri sesudah lama tidak ada aktivitas.
 *
 * Komputer di pendaftaran, poli, dan kasir dipakai bergantian dan hampir tidak
 * pernah dikunci. Sesi dokter yang tertinggal terbuka membuka rekam medis
 * seluruh klinik untuk siapa pun yang duduk berikutnya. Supabase menyediakan
 * batas sesi tidak aktif hanya di paket Pro (diperiksa 28 September 2026),
 * jadi penjaganya di aplikasi.
 *
 * - **Satu jam untuk semua tab.** Waktu aktivitas terakhir disimpan di
 *   localStorage, jadi kasir yang bekerja di tab Kasir tidak dikeluarkan
 *   karena tab Beranda-nya diam. Tanpa ini, tab yang terlupa di belakang
 *   akan mengeluarkan orang di tengah transaksi.
 * - **Diperingatkan dulu, satu menit.** Keluar tanpa aba-aba di depan pasien
 *   terasa seperti aplikasi yang rusak.
 * - **localStorage yang tidak bisa dipakai** (jendela privat, situs diblokir)
 *   jatuh ke jam di memori tab itu sendiri. Salah keluar lebih buruk daripada
 *   tidak keluar sama sekali.
 */

export const BATAS_DIAM_MS = 2 * 60 * 60 * 1000 // 2 jam
const PERINGATAN_MS = 60 * 1000
const KUNCI = 'sw_aktif_terakhir'
const KEJADIAN = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const

export default function KeluarDiam() {
  const { t } = useLang()
  const cadangan = useRef(Date.now())
  const [sisa, setSisa] = useState<number | null>(null)

  const baca = useCallback((): number => {
    try {
      const v = Number(localStorage.getItem(KUNCI))
      return v > 0 ? Math.max(v, cadangan.current) : cadangan.current
    } catch { return cadangan.current }
  }, [])

  const tandai = useCallback(() => {
    const kini = Date.now()
    cadangan.current = kini
    try { localStorage.setItem(KUNCI, String(kini)) } catch { /* jam memori tetap jalan */ }
  }, [])

  const keluar = useCallback(async () => {
    try { localStorage.removeItem(KUNCI) } catch { /* abaikan */ }
    await supabase.auth.signOut()
    window.location.href = '/?keluar=diam'
  }, [])

  useEffect(() => {
    tandai()
    // Aktivitas ditandai paling sering sekali per 15 detik: menulis
    // localStorage di tiap gerakan roda gulir tidak ada gunanya.
    let terakhirTulis = 0
    const aktif = () => {
      const kini = Date.now()
      if (kini - terakhirTulis < 15000) { cadangan.current = kini; return }
      terakhirTulis = kini
      tandai()
    }
    KEJADIAN.forEach(k => window.addEventListener(k, aktif, { passive: true }))

    const periksa = window.setInterval(() => {
      const diam = Date.now() - baca()
      if (diam >= BATAS_DIAM_MS) { keluar(); return }
      const tersisa = BATAS_DIAM_MS - diam
      setSisa(tersisa <= PERINGATAN_MS ? Math.ceil(tersisa / 1000) : null)
    }, 1000)

    return () => {
      KEJADIAN.forEach(k => window.removeEventListener(k, aktif))
      window.clearInterval(periksa)
    }
  }, [baca, tandai, keluar])

  if (sisa === null) return null

  return (
    <Dialog
      judul={t('Masih di sana?', 'Still there?')}
      lebar="sm"
      onTutup={tandai}
      labelTutup={t('Tetap masuk', 'Stay signed in')}
      aksi={<>
        <button type="button" onClick={keluar} className={TOMBOL_KEDUA}>{t('Keluar sekarang', 'Sign out now')}</button>
        <button type="button" onClick={tandai} className={TOMBOL_UTAMA}>{t('Tetap masuk', 'Stay signed in')}</button>
      </>}
    >
      <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
        {t('Tidak ada aktivitas selama hampir 2 jam. Supaya data pasien tidak terbuka untuk orang berikutnya di komputer ini, Anda akan dikeluarkan dalam',
           'There has been no activity for almost 2 hours. So patient data is not left open for the next person at this computer, you will be signed out in')}
        {' '}<strong className="num text-[var(--ink)]">{sisa}</strong> {t('detik.', 'seconds.')}
      </p>
    </Dialog>
  )
}
