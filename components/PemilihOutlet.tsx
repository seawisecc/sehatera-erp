'use client'

import { useCallback, useEffect, useState } from 'react'
import { Building2, Check, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'
import { pesanError } from '@/lib/session'
import { useUmpan } from '@/components/Umpan'

/**
 * Berpindah antar outlet milik satu pemilik.
 *
 * **Tidak muncul sama sekali kalau outletnya cuma satu**, dan itu bukan
 * penghematan tempat: pemilik apotek tunggal tidak perlu tahu bahwa konsep
 * "outlet" ada di aplikasi ini, dan pemilih yang isinya satu baris cuma
 * membuat orang mengira ada sesuatu yang belum diatur.
 *
 * Yang dipindah adalah PENUNJUK DI DATABASE, bukan penyaringan di layar.
 * Ratusan fungsi memanggil `auth_company_id()`, jadi begitu penunjuknya
 * berpindah, seluruh aplikasi ikut berpindah. Karena itu halamannya dimuat
 * ulang sesudah berpindah: data yang sudah terlanjur diambil untuk outlet lama
 * masih tergeletak di layar, dan bercampurnya stok dua outlet di satu layar
 * adalah kesalahan yang tidak akan disadari sampai stok opname.
 */

type Outlet = {
  id: string
  nama: string
  kota: string | null
  sektor: string
  kelompok: string | null
  pemilik: boolean
  aktif: boolean
}

export default function PemilihOutlet() {
  const { t } = useLang()
  const { kabar } = useUmpan()
  const [daftar, setDaftar] = useState<Outlet[]>([])
  const [buka, setBuka] = useState(false)
  const [sibuk, setSibuk] = useState(false)

  const muat = useCallback(async () => {
    const { data } = await supabase.rpc('outlet_saya')
    setDaftar(((data as Outlet[]) || []))
  }, [])

  useEffect(() => { muat() }, [muat])

  useEffect(() => {
    if (!buka) return
    const tutup = () => setBuka(false)
    window.addEventListener('click', tutup)
    return () => window.removeEventListener('click', tutup)
  }, [buka])

  if (daftar.length < 2) return null

  const aktif = daftar.find(o => o.aktif) || daftar[0]

  const pindah = async (o: Outlet) => {
    if (o.aktif) { setBuka(false); return }
    setSibuk(true)
    const { error } = await supabase.rpc('pilih_outlet', { p_company: o.id })
    if (error) { setSibuk(false); kabar(pesanError(error), 'galat'); return }
    window.location.reload()
  }

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setBuka(v => !v)} disabled={sibuk}
        aria-haspopup="menu" aria-expanded={buka}
        className="flex items-center gap-1.5 max-w-[200px] px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition disabled:opacity-50">
        <Building2 size={13} className="shrink-0 text-[var(--brand)]" />
        <span className="text-xs font-medium text-[var(--ink)] truncate">{aktif?.nama}</span>
        <ChevronDown size={13} className="shrink-0 text-[var(--ink-faint)]" />
      </button>

      {buka && (
        <div role="menu"
          className="absolute right-0 mt-1.5 w-64 rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-lg overflow-hidden z-40">
          <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
            {aktif?.kelompok || t('Outlet Anda', 'Your outlets')}
          </p>
          {daftar.map(o => (
            <button key={o.id} onClick={() => pindah(o)} disabled={sibuk}
              className={`w-full text-left px-3 py-2 hover:bg-[var(--surface-2)] transition disabled:opacity-50 ${
                o.aktif ? 'bg-[var(--surface-2)]' : ''
              }`}>
              <span className="flex items-center gap-2">
                <span className="text-sm text-[var(--ink)] truncate flex-1">{o.nama}</span>
                {o.aktif && <Check size={13} className="shrink-0 text-emerald-600" />}
              </span>
              <span className="text-[11px] text-[var(--ink-faint)]">
                {[o.kota, o.sektor === 'apotek' ? t('Apotek', 'Pharmacy') : o.sektor === 'klinik' ? t('Klinik', 'Clinic') : t('Rumah Sakit', 'Hospital')]
                  .filter(Boolean).join(' · ')}
              </span>
            </button>
          ))}
          <p className="px-3 py-2 text-[10px] text-[var(--ink-faint)] leading-relaxed border-t border-[var(--line-soft)]">
            {t('Stok, pasien, dan laporan tiap outlet berdiri sendiri. Berpindah memuat ulang halaman.',
               'Stock, patients, and reports are separate per outlet. Switching reloads the page.')}
          </p>
        </div>
      )}
    </div>
  )
}
