'use client'

import { useCallback, useEffect, useState } from 'react'
import { Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { useUmpan } from '@/components/Umpan'
import { pesanError } from '@/lib/session'
import { rupiah, jam } from '@/lib/format'
import { boleh } from '@/lib/hak'
import Dialog, { TOMBOL_KEDUA, TOMBOL_UTAMA } from '@/components/Dialog'

/**
 * Sesi kasir di atas layar Kasir: buka dengan kas awal, tutup dengan uang yang
 * dihitung. Hitungan "seharusnya" selalu dari database (hitung_sesi_kasir,
 * migrasi 0091), fungsi yang SAMA dengan yang membekukannya saat tutup, jadi
 * angka yang dilihat kasir sebelum menekan Tutup adalah angka yang tersimpan.
 *
 * Tidak memblokir penjualan. Kasir yang lupa membuka sesi tetap melayani;
 * stripnya cuma mengingatkan.
 */

type Sesi = { id: string; dibuka_pada: string; kas_awal: number; kasir_email: string }
type Hitung = { tunai: number; non_tunai: number; jumlah: number; kas_awal: number; kas_seharusnya: number; per_metode: Record<string, number> }

const INPUT = 'w-full border border-[var(--line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
const angkaSaja = (v: string) => Number(v.replace(/[^\d]/g, '') || 0)

export default function SesiKasir({ segarkan }: { segarkan: number }) {
  const app = useApp()
  const { t } = useLang()
  const { kabar } = useUmpan()
  const [sesi, setSesi] = useState<Sesi | null | undefined>(undefined)
  const [hitung, setHitung] = useState<Hitung | null>(null)
  const [bukaBuka, setBukaBuka] = useState(false)
  const [bukaTutup, setBukaTutup] = useState(false)
  const [kasAwal, setKasAwal] = useState('')
  const [dihitung, setDihitung] = useState('')
  const [catatan, setCatatan] = useState('')
  const [sibuk, setSibuk] = useState(false)

  const email = app.session?.email?.toLowerCase() || ''
  const bolehSesi = boleh(app.currentRole, 'kasir.sesi', app.isSuper)

  const muat = useCallback(async () => {
    if (!email) { setSesi(null); return }
    const { data } = await app.scope(supabase.from('sesi_kasir')
      .select('id,dibuka_pada,kas_awal,kasir_email')
      .eq('status', 'buka').ilike('kasir_email', email).limit(1))
    const s = (data as Sesi[] | null)?.[0] || null
    setSesi(s)
    if (s) {
      const { data: h } = await supabase.rpc('hitung_sesi_kasir', { p_sesi: s.id })
      setHitung(h as Hitung)
    } else setHitung(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, app.superViewCompany])

  // Dimuat ulang sesudah tiap transaksi (segarkan berubah) dan tiap menit.
  useEffect(() => { muat() }, [muat, segarkan])
  useEffect(() => {
    const id = window.setInterval(muat, 60000)
    return () => window.clearInterval(id)
  }, [muat])

  if (!bolehSesi || app.isSuper || sesi === undefined) return null

  const buka = async () => {
    setSibuk(true)
    const { error } = await supabase.rpc('buka_kasir', { p_kas_awal: angkaSaja(kasAwal) })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    setBukaBuka(false); setKasAwal('')
    kabar(t('Kasir dibuka.', 'Register opened.'), 'ok')
    muat()
  }

  const tutup = async () => {
    if (!sesi) return
    setSibuk(true)
    const { data, error } = await supabase.rpc('tutup_kasir', {
      p_sesi: sesi.id, p_kas_dihitung: angkaSaja(dihitung), p_catatan: catatan || null,
    })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    setBukaTutup(false); setDihitung(''); setCatatan('')
    const sel = Number(data.selisih || 0)
    kabar(sel === 0
      ? t('Kasir ditutup. Laci cocok.', 'Register closed. Drawer balances.')
      : t(`Kasir ditutup dengan selisih ${rupiah(sel)}. Catatannya tersimpan untuk pemilik.`,
          `Register closed with a difference of ${rupiah(sel)}. The note is saved for the owner.`), sel === 0 ? 'ok' : 'info')
    muat()
  }

  const selisihSementara = hitung && dihitung.trim() !== '' ? angkaSaja(dihitung) - hitung.kas_seharusnya : null

  return (
    <>
      {sesi ? (
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-sm">
          <span className="inline-flex items-center gap-2 font-medium text-[var(--ink)]">
            <Wallet size={16} className="text-[var(--brand)]" /> {t('Kasir dibuka', 'Register open')} <span className="num">{jam(sesi.dibuka_pada)}</span>
          </span>
          <span className="text-[var(--ink-soft)]">{t('Kas awal', 'Opening cash')} <span className="num text-[var(--ink)]">{rupiah(sesi.kas_awal)}</span></span>
          {hitung && <span className="text-[var(--ink-soft)]">{t('Tunai masuk', 'Cash in')} <span className="num text-[var(--ink)]">{rupiah(hitung.tunai)}</span></span>}
          {hitung && <span className="text-[var(--ink-soft)]">{t('Seharusnya di laci', 'Expected in drawer')} <span className="num font-semibold text-[var(--ink)]">{rupiah(hitung.kas_seharusnya)}</span></span>}
          <button onClick={() => { muat(); setBukaTutup(true) }}
            className="ml-auto px-3.5 py-1.5 rounded-lg border border-[var(--brand)] text-[var(--brand)] font-semibold hover:bg-[var(--surface-2)]">
            {t('Tutup kasir', 'Close register')}
          </button>
        </div>
      ) : (
        <div className="mb-5 flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-[var(--surface-2)] border border-dashed border-[var(--line)] text-sm">
          <Wallet size={16} className="text-[var(--ink-faint)]" />
          <span className="text-[var(--ink-soft)]">
            {t('Kasir belum dibuka. Buka dengan uang kembalian yang ada di laci, supaya saat tutup ketahuan laci cocok atau tidak.',
               'The register is not open. Open it with the change in the drawer, so closing shows whether the drawer balances.')}
          </span>
          <button onClick={() => setBukaBuka(true)}
            className="ml-auto px-3.5 py-1.5 rounded-lg bg-[var(--brand)] text-[var(--on-brand)] font-semibold hover:bg-[var(--brand-hover)]">
            {t('Buka kasir', 'Open register')}
          </button>
        </div>
      )}

      {bukaBuka && (
        <Dialog judul={t('Buka kasir', 'Open register')} lebar="sm" onTutup={() => setBukaBuka(false)}
          aksi={<>
            <button type="button" onClick={() => setBukaBuka(false)} className={TOMBOL_KEDUA}>{t('Batal', 'Cancel')}</button>
            <button type="button" onClick={buka} disabled={sibuk} className={TOMBOL_UTAMA}>{t('Buka', 'Open')}</button>
          </>}>
          <label htmlFor="kas-awal" className="block text-[13px] font-medium text-[var(--ink-mid)] mb-1.5">
            {t('Kas awal di laci (Rp)', 'Opening cash in drawer (Rp)')}
          </label>
          <input id="kas-awal" inputMode="numeric" value={kasAwal} onChange={e => setKasAwal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buka()} placeholder="200000" className={INPUT + ' num'} />
          <p className="text-xs text-[var(--ink-soft)] mt-2 leading-relaxed">
            {t('Hitung uang kembalian yang ada di laci sekarang. Kalau laci kosong, isi 0.',
               'Count the change in the drawer now. If it is empty, enter 0.')}
          </p>
        </Dialog>
      )}

      {bukaTutup && sesi && (
        <Dialog judul={t('Tutup kasir', 'Close register')} sub={t(`Dibuka ${jam(sesi.dibuka_pada)}`, `Opened ${jam(sesi.dibuka_pada)}`)} lebar="sm"
          onTutup={() => setBukaTutup(false)}
          aksi={<>
            <button type="button" onClick={() => setBukaTutup(false)} className={TOMBOL_KEDUA}>{t('Batal', 'Cancel')}</button>
            <button type="button" onClick={tutup} disabled={sibuk || dihitung.trim() === ''} className={TOMBOL_UTAMA}>{t('Tutup kasir', 'Close register')}</button>
          </>}>
          <div className="space-y-4 text-sm">
            {hitung && (
              <dl className="grid grid-cols-2 gap-y-1.5">
                <dt className="text-[var(--ink-soft)]">{t('Kas awal', 'Opening cash')}</dt><dd className="text-right num">{rupiah(hitung.kas_awal)}</dd>
                <dt className="text-[var(--ink-soft)]">{t('Tunai diterima', 'Cash received')}</dt><dd className="text-right num">{rupiah(hitung.tunai)}</dd>
                <dt className="font-semibold text-[var(--ink)] border-t border-[var(--line-soft)] pt-1.5">{t('Seharusnya di laci', 'Expected in drawer')}</dt>
                <dd className="text-right num font-semibold border-t border-[var(--line-soft)] pt-1.5">{rupiah(hitung.kas_seharusnya)}</dd>
                <dt className="text-[var(--ink-faint)] text-xs pt-2">{t(`Non-tunai (tidak masuk laci), ${hitung.jumlah} transaksi`, `Non-cash (not in drawer), ${hitung.jumlah} transactions`)}</dt>
                <dd className="text-right num text-xs text-[var(--ink-faint)] pt-2">{rupiah(hitung.non_tunai)}</dd>
              </dl>
            )}
            <div>
              <label htmlFor="kas-dihitung" className="block text-[13px] font-medium text-[var(--ink-mid)] mb-1.5">
                {t('Uang yang dihitung di laci (Rp)', 'Cash counted in drawer (Rp)')}
              </label>
              <input id="kas-dihitung" inputMode="numeric" value={dihitung} onChange={e => setDihitung(e.target.value)} className={INPUT + ' num'} />
              {selisihSementara !== null && (
                <p className={`text-sm mt-1.5 font-medium num ${selisihSementara === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {selisihSementara === 0 ? t('Laci cocok.', 'Drawer balances.') : `${t('Selisih', 'Difference')} ${rupiah(selisihSementara)}`}
                </p>
              )}
            </div>
            {selisihSementara !== null && selisihSementara !== 0 && (
              <div>
                <label htmlFor="kas-catatan" className="block text-[13px] font-medium text-[var(--ink-mid)] mb-1.5">
                  {t('Catatan selisih (wajib)', 'Note on the difference (required)')}
                </label>
                <input id="kas-catatan" value={catatan} onChange={e => setCatatan(e.target.value)}
                  placeholder={t('Mis. kembalian salah ke pembeli', 'E.g. wrong change given')} className={INPUT} />
              </div>
            )}
          </div>
        </Dialog>
      )}
    </>
  )
}
