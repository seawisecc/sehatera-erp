'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { semua } from '@/lib/semua'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { rupiah, tanggalJam } from '@/lib/format'
import { TBL_WRAP, TBL, THEAD, TH_L, TH_R, TR } from '@/lib/ui'

/**
 * Riwayat setoran kasir untuk pemilik: siapa membuka laci kapan, berapa yang
 * seharusnya ada, berapa yang dihitung, dan selisihnya beserta catatan.
 * Angkanya dibekukan saat sesi ditutup (migrasi 0091), jadi pembatalan
 * transaksi sesudahnya tidak mengubah setoran yang sudah diserahkan.
 */

type Baris = {
  id: string; kasir_email: string; status: string; dibuka_pada: string; ditutup_pada: string | null
  kas_awal: number; tunai_diterima: number | null; non_tunai: number | null; jumlah_transaksi: number | null
  kas_seharusnya: number | null; kas_dihitung: number | null; selisih: number | null; catatan: string | null
}

export default function SetoranKasir() {
  const app = useApp()
  const { t } = useLang()
  const [daftar, setDaftar] = useState<Baris[] | null>(null)

  const muat = useCallback(async () => {
    const { data } = await semua<Baris>(() => app.scope(supabase.from('sesi_kasir').select('*').order('dibuka_pada', { ascending: false })))
    setDaftar(data)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { muat() }, [muat])

  const totalSelisih = (daftar || []).reduce((a, b) => a + Number(b.selisih || 0), 0)

  return (
    <div>
      <p className="text-sm text-[var(--ink-soft)] mb-4 max-w-3xl">
        {t('Setiap sesi kasir: kas awal, tunai yang diterima, uang yang seharusnya di laci, dan yang benar-benar dihitung saat tutup. Selisih wajib diberi catatan oleh kasirnya.',
           'Each register session: opening cash, cash received, what the drawer should hold, and what was actually counted at closing. Differences require a note from the cashier.')}
        {daftar && daftar.length > 0 && (
          <> {t('Jumlah selisih seluruh sesi', 'Total difference across sessions')}: <span className={`num font-semibold ${totalSelisih < 0 ? 'text-red-700' : 'text-[var(--ink)]'}`}>{rupiah(totalSelisih)}</span>.</>
        )}
      </p>
      <div className={TBL_WRAP}>
        <table className={TBL}>
          <thead className={THEAD}>
            <tr>
              <th className={TH_L}>{t('Kasir', 'Cashier')}</th>
              <th className={TH_L}>{t('Dibuka', 'Opened')}</th>
              <th className={TH_L}>{t('Ditutup', 'Closed')}</th>
              <th className={TH_R}>{t('Kas awal', 'Opening')}</th>
              <th className={TH_R}>{t('Seharusnya', 'Expected')}</th>
              <th className={TH_R}>{t('Dihitung', 'Counted')}</th>
              <th className={TH_R}>{t('Selisih', 'Diff.')}</th>
              <th className={TH_L}>{t('Catatan', 'Note')}</th>
            </tr>
          </thead>
          <tbody>
            {daftar === null ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</td></tr>
            ) : daftar.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-[var(--ink-faint)]">
                {t('Belum ada sesi kasir. Kasir membukanya dari layar Kasir.', 'No register sessions yet. Cashiers open them from the Cashier screen.')}
              </td></tr>
            ) : daftar.map(b => {
              const sel = Number(b.selisih || 0)
              return (
                <tr key={b.id} className={TR}>
                  <td className="px-4 py-2.5 text-[var(--ink)]">{b.kasir_email}</td>
                  <td className="px-4 py-2.5 text-xs text-[var(--ink-soft)] num whitespace-nowrap">{tanggalJam(b.dibuka_pada)}</td>
                  <td className="px-4 py-2.5 text-xs num whitespace-nowrap">
                    {b.status === 'buka'
                      ? <span className="text-amber-700 font-medium">{t('masih buka', 'still open')}</span>
                      : <span className="text-[var(--ink-soft)]">{tanggalJam(b.ditutup_pada)}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right num">{rupiah(b.kas_awal)}</td>
                  <td className="px-4 py-2.5 text-right num">{b.kas_seharusnya === null ? '-' : rupiah(b.kas_seharusnya)}</td>
                  <td className="px-4 py-2.5 text-right num">{b.kas_dihitung === null ? '-' : rupiah(b.kas_dihitung)}</td>
                  <td className={`px-4 py-2.5 text-right num font-semibold ${b.status === 'buka' ? 'text-[var(--ink-faint)]' : sel === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {b.status === 'buka' ? '-' : rupiah(sel)}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--ink-soft)]">{b.catatan || '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
