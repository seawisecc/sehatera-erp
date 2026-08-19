'use client'

import { useCallback, useEffect, useState } from 'react'
import { Building2, Check, X } from 'lucide-react'
import Portal from '@/components/Portal'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'
import { pesanError } from '@/lib/session'
import { useUmpan } from '@/components/Umpan'

/**
 * Outlet mana saja yang boleh dibuka satu pengguna, dan dengan peran apa.
 *
 * **Perannya boleh berbeda tiap outlet.** Orang yang sama bisa apoteker di
 * cabang utama dan kasir di cabang kedua. Memaksanya satu peran akan membuat
 * pemilik memberi peran yang lebih tinggi daripada yang dibutuhkan supaya bisa
 * dua-duanya, dan hak akses yang dinaikkan demi kenyamanan tidak pernah
 * diturunkan lagi.
 *
 * Disimpan SATU outlet per klik, bukan sekali simpan untuk seluruh daftar.
 * Panggilan yang membawa seluruh daftar akan menghapus akses yang tidak
 * disebut, dan layar yang daftarnya sedikit tertinggal akan mencabut akses
 * orang tanpa ada yang menyuruhnya.
 */

type Baris = {
  company_id: string
  nama: string
  kota: string | null
  sektor: string
  peran: string | null
  status: string | null
  bisa_masuk: boolean
}

const PERAN = [
  ['pemilik', 'Pemilik'], ['admin', 'Admin'], ['apoteker', 'Apoteker'],
  ['asisten_apoteker', 'Asisten Apoteker'], ['kasir', 'Kasir'],
  ['dokter', 'Dokter'], ['perawat', 'Perawat'], ['pendaftaran', 'Pendaftaran'],
  ['analis', 'Analis Lab & Radiologi'],
] as const

export default function AksesOutletPengguna({
  email, nama, onTutup,
}: {
  email: string
  nama?: string | null
  onTutup: () => void
}) {
  const { t } = useLang()
  const { kabar } = useUmpan()

  const [daftar, setDaftar] = useState<Baris[]>([])
  const [memuat, setMemuat] = useState(true)
  const [sibuk, setSibuk] = useState('')

  const muat = useCallback(async () => {
    setMemuat(true)
    const { data, error } = await supabase.rpc('outlet_pengguna', { p_email: email })
    if (error) kabar(pesanError(error), 'galat')
    setDaftar(((data as Baris[]) || []))
    setMemuat(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  useEffect(() => { muat() }, [muat])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onTutup() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onTutup])

  const atur = async (b: Baris, beri: boolean, peran?: string) => {
    setSibuk(b.company_id)
    const { error } = await supabase.rpc('atur_outlet_pengguna', {
      p_email: email, p_company: b.company_id, p_beri: beri,
      p_peran: peran || b.peran || 'kasir',
    })
    setSibuk('')
    if (error) { kabar(pesanError(error), 'galat'); return }
    muat()
  }

  const I = 'border border-[var(--line)] rounded-lg px-2 py-1 text-xs bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
        <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="text-lg font-bold text-[var(--brand)] flex items-center gap-2">
              <Building2 size={18} /> {t('Akses Outlet', 'Outlet Access')}
            </h3>
            <button onClick={onTutup} className="text-[var(--ink-faint)] hover:text-[var(--ink)]" aria-label={t('Tutup', 'Close')}>
              <X size={18} />
            </button>
          </div>
          <p className="text-xs text-[var(--ink-soft)] mb-4 leading-relaxed">
            {nama || email}
            {nama && <span className="text-[var(--ink-faint)]"> · {email}</span>}
            <br />
            {t('Perannya boleh berbeda di tiap outlet. Berpindah outlet dilakukan orangnya sendiri lewat pemilih di kanan atas.',
               'The role may differ per outlet. Switching outlets is done by the person themselves with the picker at the top right.')}
          </p>

          {memuat ? (
            <p className="text-sm text-[var(--ink-faint)] py-6 text-center">{t('Memuat…', 'Loading…')}</p>
          ) : daftar.length <= 1 ? (
            <p className="text-sm text-[var(--ink-soft)] py-6 text-center leading-relaxed">
              {t('Baru ada satu outlet. Tambahkan outlet lain di Pengaturan > Outlet & Cabang, lalu atur siapa boleh membukanya dari sini.',
                 'Only one outlet so far. Add another under Settings > Outlets & Branches, then decide here who may open it.')}
            </p>
          ) : (
            <div className="space-y-2">
              {daftar.map(b => (
                <div key={b.company_id}
                  className={`flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-xl border ${
                    b.bisa_masuk ? 'border-[var(--brand)] bg-[var(--surface-2)]' : 'border-[var(--line)]'
                  }`}>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-[var(--ink)] truncate">{b.nama}</span>
                    <span className="block text-[11px] text-[var(--ink-faint)]">
                      {[b.kota, b.sektor].filter(Boolean).join(' · ')}
                    </span>
                  </span>

                  {b.bisa_masuk && (
                    <select value={b.peran || 'kasir'} disabled={sibuk === b.company_id}
                      onChange={e => atur(b, true, e.target.value)}
                      className={I}>
                      {PERAN.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  )}

                  <button onClick={() => atur(b, !b.bisa_masuk)} disabled={sibuk === b.company_id}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
                      b.bisa_masuk
                        ? 'border border-red-300 text-red-700 hover:bg-red-50'
                        : 'bg-[var(--brand)] text-[var(--on-brand)] hover:bg-[var(--brand-hover)]'
                    }`}>
                    {b.bisa_masuk ? t('Cabut', 'Revoke') : <><Check size={13} /> {t('Beri akses', 'Grant')}</>}
                  </button>
                </div>
              ))}
            </div>
          )}

          <button onClick={onTutup}
            className="mt-5 w-full border border-[var(--line)] text-[var(--ink-soft)] py-2.5 rounded-lg text-sm hover:bg-[var(--surface-2)] transition">
            {t('Tutup', 'Close')}
          </button>
        </div>
      </div>
    </Portal>
  )
}
