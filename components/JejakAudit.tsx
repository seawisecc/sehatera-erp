'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { TBL_WRAP, TBL, THEAD, TH_L, TR } from '@/lib/ui'
import { tanggalJam } from '@/lib/format'

/**
 * Jejak audit: siapa melakukan apa, kapan.
 *
 * Barisnya ditulis DARI DALAM fungsi database yang melakukan pekerjaannya,
 * bukan dari peramban. Itu bedanya jejak audit dengan catatan biasa: yang bisa
 * dilewatkan dengan cara tidak memanggilnya bukan jejak audit, cuma dekorasi.
 *
 * Dipakai dua tempat dengan aturan baca yang sudah ditegakkan RLS: pemilik
 * apotek melihat apoteknya sendiri, super admin melihat semuanya.
 */

/** Kata kerja untuk manusia, bukan nama tabel. */
function labelAksi(action: string, t: (id: string, en: string) => string): string {
  const map: Record<string, string> = {
    'transaksi.dibatalkan': t('Transaksi dibatalkan', 'Sale cancelled'),
    'undangan.dibuat':      t('Undangan dibuat', 'Invitation created'),
    'undangan.diterima':    t('Undangan diterima', 'Invitation accepted'),
    'undangan.dicabut':     t('Undangan dicabut', 'Invitation revoked'),
    'apotek.status':        t('Status faskes diubah', 'Facility status changed'),
    'apotek.paket':         t('Paket atau masa aktif diubah', 'Plan or validity changed'),
  }
  return map[action] || action
}

const NADA: Record<string, string> = {
  'transaksi.dibatalkan': 'bg-red-50 text-red-700 ring-1 ring-red-600/15',
  'undangan.dibuat':      'bg-blue-50 text-blue-700 ring-1 ring-blue-600/15',
  'undangan.diterima':    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15',
  'undangan.dicabut':     'bg-gray-100 text-gray-600',
  'apotek.status':        'bg-amber-50 text-amber-800 ring-1 ring-amber-600/15',
  'apotek.paket':         'bg-violet-50 text-violet-700 ring-1 ring-violet-600/15',
}

export default function JejakAudit({ tampilkanFaskes = false }: { tampilkanFaskes?: boolean }) {
  const { t } = useLang()
  const app = useApp()

  const [baris, setBaris] = useState<any[]>([])
  const [memuat, setMemuat] = useState(true)

  const muat = useCallback(async () => {
    setMemuat(true)
    // Super admin tanpa faskes terpilih memang melihat semuanya; RLS yang
    // menentukan, bukan halaman ini.
    const { data } = await app.scope(
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200)
    )
    setBaris(data || [])
    setMemuat(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { muat() }, [muat])

  const namaFaskes = (id: string | null) =>
    app.companies.find((c: any) => c.id === id)?.nama || '-'

  /** Isi `detail` diringkas jadi satu baris yang bisa dibaca sambil lalu. */
  const ringkas = (r: any): string => {
    const d = r.detail || {}
    switch (r.action) {
      case 'transaksi.dibatalkan':
        return [d.nomor, d.catatan ? t('batch tidak dikembalikan otomatis', 'batches not auto-restored') : null]
          .filter(Boolean).join(' · ')
      case 'undangan.dibuat':
      case 'undangan.diterima':
      case 'undangan.dicabut':
        return [d.email, d.role].filter(Boolean).join(' · ')
      case 'apotek.status':
        return `${d.dari || '?'} → ${d.ke || '?'}`
      case 'apotek.paket':
        return d.tanpa_batas ? t('tanpa batas', 'unlimited') : (d.sampai || '')
      default:
        return Object.keys(d).length ? JSON.stringify(d) : ''
    }
  }

  return (
    <div>
      <div className={TBL_WRAP}>
        <table className={TBL}>
          <thead className={THEAD}>
            <tr>
              <th className={TH_L}>{t('Waktu', 'Time')}</th>
              {tampilkanFaskes && <th className={TH_L}>{t('Faskes', 'Facility')}</th>}
              <th className={TH_L}>{t('Tindakan', 'Action')}</th>
              <th className={TH_L}>{t('Oleh', 'By')}</th>
              <th className={TH_L}>{t('Keterangan', 'Detail')}</th>
            </tr>
          </thead>
          <tbody>
            {memuat ? (
              <tr><td colSpan={tampilkanFaskes ? 5 : 4} className="px-4 py-10 text-center text-[var(--ink-faint)]">
                {t('Memuat…', 'Loading…')}
              </td></tr>
            ) : baris.length === 0 ? (
              <tr><td colSpan={tampilkanFaskes ? 5 : 4} className="px-4 py-10 text-center text-[var(--ink-faint)] text-sm">
                {t('Belum ada yang tercatat. Jejak audit terisi sendiri saat ada tindakan yang tidak bisa dibatalkan, seperti pembatalan transaksi atau perubahan hak akses.',
                   'Nothing recorded yet. The audit trail fills itself when an irreversible action happens, such as cancelling a sale or changing access.')}
              </td></tr>
            ) : baris.map((r: any) => (
              <tr key={r.id} className={TR}>
                <td className="px-4 py-3 text-xs text-[var(--ink-soft)] num whitespace-nowrap">{tanggalJam(r.created_at)}</td>
                {tampilkanFaskes && (
                  <td className="px-4 py-3 text-sm text-[var(--ink)]">{namaFaskes(r.company_id)}</td>
                )}
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${NADA[r.action] || 'bg-[var(--surface-2)] text-[var(--ink-soft)]'}`}>
                    {labelAksi(r.action, t)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--ink-soft)]">{r.actor_email || '-'}</td>
                <td className="px-4 py-3 text-xs text-[var(--ink-soft)] max-w-[24rem] truncate">{ringkas(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[var(--ink-faint)] mt-3 leading-relaxed">
        {t('Menampilkan 200 kejadian terakhir. Barisnya ditulis oleh database saat tindakannya terjadi, jadi tidak bisa dilewatkan dan tidak bisa disunting dari aplikasi.',
           'Showing the last 200 events. Rows are written by the database as the action happens, so they cannot be skipped or edited from the app.')}
      </p>
    </div>
  )
}
