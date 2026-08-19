'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CalendarClock, Printer } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { useUmpan } from '@/components/Umpan'
import { pesanError } from '@/lib/session'
import { TBL_WRAP, TBL, THEAD, TH_L, TH_C, TR } from '@/lib/ui'
import { angka, tanggal } from '@/lib/format'
import { bukaCetak, beritaAcaraPemusnahan } from '@/lib/cetak'
import TindakLanjutBatch, { type BatchTindakLanjut } from '@/components/TindakLanjutBatch'

/**
 * Tindak Lanjut: batch yang mendekati kadaluarsa, dan riwayat pemusnahan
 * serta retur atasnya.
 *
 * Daftar pengingatnya pindah ke sini dari halaman Produk. Tempatnya memang di
 * sini: Produk adalah katalog, sedangkan ini pekerjaan berjangka waktu yang
 * punya tenggat. Produk tetap menampilkan ringkasannya sebagai tautan.
 *
 * Konfirmasi retur sekarang lewat `konfirmasi_retur()`. Bentuk lamanya membaca
 * stok batch dan stok produk, lalu menulisnya kembali sebagai nilai mutlak,
 * dari peramban, dalam empat permintaan HTTP terpisah: penjualan yang terjadi
 * di sela-selanya hilang, dan menekan Konfirmasi dua kali memotong stok dua
 * kali. Lihat migrasi 0011.
 */

export default function HalamanTindakLanjut() {
  const { t, lang } = useLang()
  const { kabar, konfirmasi } = useUmpan()
  const app = useApp()
  const scope = app.scope

  const [tab, setTab] = useState<'pengingat' | 'musnahkan' | 'retur'>('pengingat')
  const [batches, setBatches] = useState<any[]>([])
  const [musnah, setMusnah] = useState<any[]>([])
  const [retur, setRetur] = useState<any[]>([])
  const [memuat, setMemuat] = useState(true)
  const [sibuk, setSibuk] = useState(false)
  const [pilih, setPilih] = useState<BatchTindakLanjut | null>(null)

  const muat = useCallback(async () => {
    setMemuat(true)
    const in60 = new Date(); in60.setDate(in60.getDate() + 60)
    const [{ data: b }, { data: m }, { data: r }] = await Promise.all([
      scope(supabase.from('product_batches')
        .select('*, products(nama_obat, kode, satuan)')
        .lte('expired_date', in60.toISOString().split('T')[0])
        .gt('stok_batch', 0)
        .is('ditindaklanjuti_pada', null)
        .order('expired_date')),
      scope(supabase.from('pemusnahan')
        .select('*, products(nama_obat, satuan, kode), product_batches(batch_number, expired_date)')
        .order('created_at', { ascending: false })),
      scope(supabase.from('retur_supplier')
        .select('*, products(nama_obat, satuan, kode), suppliers(nama_supplier), product_batches(batch_number, expired_date)')
        .order('created_at', { ascending: false })),
    ])
    setBatches(b || []); setMusnah(m || []); setRetur(r || [])
    setMemuat(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { muat() }, [muat])

  const cetakBA = (row: any) => {
    const ok = bukaCetak(beritaAcaraPemusnahan(app.settingsData, {
      nomor_ba: row.nomor_ba,
      tanggal_musnahkan: row.tanggal_musnahkan,
      nama_produk: row.products?.nama_obat,
      satuan: row.products?.satuan,
      batch_number: row.product_batches?.batch_number,
      expired_date: row.product_batches?.expired_date,
      qty_musnahkan: row.qty_musnahkan,
      metode: row.metode,
      keterangan: row.keterangan,
      saksi_1: row.saksi_1,
      saksi_2: row.saksi_2,
    }))
    if (!ok) kabar(t('Jendela cetak diblokir peramban. Izinkan pop-up untuk situs ini.', 'The print window was blocked. Allow pop-ups for this site.'))
  }

  const konfirmasiRetur = async (row: any) => {
    if (!await konfirmasi({ judul: t(
      `Konfirmasi retur ${row.nomor_retur || ''}?\nStok "${row.products?.nama_obat || ''}" berkurang ${row.qty_retur} ${row.products?.satuan || ''}.`,
      `Confirm return ${row.nomor_retur || ''}?\nStock of "${row.products?.nama_obat || ''}" drops by ${row.qty_retur} ${row.products?.satuan || ''}.`)})) return
    setSibuk(true)
    const { error } = await supabase.rpc('konfirmasi_retur', { p_retur_id: row.id })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    muat()
  }

  const batalkan = async (row: any) => {
    if (!await konfirmasi({ bahaya: true, tombol: t('Batalkan retur', 'Cancel return'), judul: t(`Batalkan retur ${row.nomor_retur || ''}?`, `Cancel return ${row.nomor_retur || ''}?`) })) return
    const { error } = await supabase.from('retur_supplier').update({ status: 'dibatalkan' }).eq('id', row.id)
    if (error) { kabar(pesanError(error), 'galat'); return }
    muat()
  }

  const hariIni = new Date(); hariIni.setHours(0, 0, 0, 0)
  const in30 = new Date(hariIni); in30.setDate(hariIni.getDate() + 30)
  const merah = batches.filter(b => new Date(b.expired_date) <= in30)
  const kuning = batches.filter(b => new Date(b.expired_date) > in30)

  const grup = [
    {
      items: merah, Icon: AlertTriangle,
      wrap: 'bg-red-50 border-red-200', title: t('Segera Kadaluarsa', 'Expiring Soon'), sub: `≤30 ${t('hari', 'days')}`,
      titleCls: 'text-red-700', badgeCls: 'bg-red-100 text-red-700', card: 'border-red-100',
      dayCls: 'text-red-600', btn: 'bg-red-600 hover:bg-red-700',
    },
    {
      items: kuning, Icon: CalendarClock,
      wrap: 'bg-amber-50 border-amber-200', title: t('Perlu Perhatian', 'Needs Attention'), sub: `31-60 ${t('hari', 'days')}`,
      titleCls: 'text-amber-800', badgeCls: 'bg-amber-100 text-amber-800', card: 'border-amber-100',
      dayCls: 'text-amber-700', btn: 'bg-amber-600 hover:bg-amber-700',
    },
  ]

  const tabs = [
    { id: 'pengingat', label: `${t('Pengingat', 'Reminders')} (${batches.length})` },
    { id: 'musnahkan', label: `${t('Pemusnahan', 'Destruction')} (${musnah.length})` },
    { id: 'retur',     label: `${t('Retur Supplier', 'Supplier Returns')} (${retur.length})` },
  ] as const

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--ink)] mb-1">{t('Tindak Lanjut', 'Follow-up')}</h1>
      <p className="text-[var(--ink-soft)] text-sm mb-6">
        {t('Batch yang mendekati kadaluarsa, dan riwayat pemusnahan serta retur atasnya.',
           'Batches nearing expiry, plus the destruction and return history for them.')}
      </p>

      <div className="flex gap-1 mb-5 flex-wrap">
        {tabs.map(x => (
          <button key={x.id} onClick={() => setTab(x.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === x.id ? 'bg-[var(--brand)] text-[var(--on-brand)]' : 'text-[var(--ink-soft)] hover:bg-[var(--surface)]/60'}`}>
            {x.label}
          </button>
        ))}
      </div>

      {tab === 'pengingat' && (
        memuat ? (
          <p className="text-center text-[var(--ink-faint)] py-12 text-sm">{t('Memuat…', 'Loading…')}</p>
        ) : batches.length === 0 ? (
          <div className={`${TBL_WRAP} py-12 text-center`}>
            <p className="text-[var(--ink-faint)] text-sm">
              {t('Tidak ada batch yang mendekati kadaluarsa dalam 60 hari ke depan.', 'No batches nearing expiry in the next 60 days.')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {grup.filter(g => g.items.length > 0).map((g, gi) => (
              <div key={gi} className={`border rounded-2xl p-3 sm:p-4 ${g.wrap}`}>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <g.Icon size={17} className={g.titleCls} />
                  <span className={`font-semibold text-sm ${g.titleCls}`}>{g.title}</span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${g.badgeCls}`}>
                    {g.items.length} {t('batch', 'batches')} · {g.sub}
                  </span>
                </div>
                <div className="space-y-2">
                  {g.items.map((b: any) => {
                    const hari = Math.ceil((new Date(b.expired_date).getTime() - hariIni.getTime()) / 86400000)
                    const exp = new Date(b.expired_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                    return (
                      <div key={b.id} className={`flex items-center gap-3 bg-[var(--surface)] rounded-xl border px-3 py-2.5 ${g.card}`}>
                        <div className="shrink-0 w-12 text-center">
                          <div className={`text-base font-bold leading-none num ${g.dayCls}`}>{hari < 0 ? '!' : hari}</div>
                          <div className="text-[9px] text-[var(--ink-faint)] mt-0.5 leading-none">{hari < 0 ? t('lewat', 'past') : t('hari lagi', 'days left')}</div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[var(--ink)] text-sm leading-tight truncate">{b.products?.nama_obat || '-'}</p>
                          <p className="text-[11px] text-[var(--ink-soft)] leading-tight mt-0.5">
                            <span className="num">{b.batch_number || '-'}</span> · {t('kadaluarsa', 'expiry')} {exp} · {t('stok', 'stock')} {angka(b.stok_batch)}
                          </p>
                        </div>
                        <button onClick={() => setPilih(b)}
                          className={`shrink-0 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition ${g.btn}`}>
                          {t('Tindak Lanjut', 'Follow up')}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'musnahkan' && (
        <div className={TBL_WRAP}>
          <table className={TBL}>
            <thead className={THEAD}>
              <tr>
                <th className={TH_L}>No. BA</th>
                <th className={TH_L}>{t('Tanggal', 'Date')}</th>
                <th className={TH_L}>{t('Produk', 'Product')}</th>
                <th className={TH_L}>{t('Batch / Kadaluarsa', 'Batch / Expiry')}</th>
                <th className={TH_C}>Qty</th>
                <th className={TH_L}>{t('Metode', 'Method')}</th>
                <th className={TH_C}>{t('Aksi', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {musnah.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[var(--ink-faint)] text-sm">
                  {t('Belum ada riwayat pemusnahan.', 'No destruction history yet.')}
                </td></tr>
              ) : musnah.map((r: any) => (
                <tr key={r.id} className={TR}>
                  <td className="px-4 py-3 num text-xs text-[var(--ink)]">{r.nomor_ba || '-'}</td>
                  <td className="px-4 py-3 text-xs text-[var(--ink-soft)] num">{tanggal(r.tanggal_musnahkan) || '-'}</td>
                  <td className="px-4 py-3 text-[var(--ink)] font-medium">{r.products?.nama_obat || '-'}</td>
                  <td className="px-4 py-3 text-xs text-[var(--ink-soft)]">
                    <span className="num">{r.product_batches?.batch_number || '-'}</span>
                    {r.product_batches?.expired_date && (
                      <span className="text-[var(--ink-faint)]"> · {tanggal(r.product_batches.expired_date)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-[var(--ink)] font-medium num">{angka(r.qty_musnahkan)} {r.products?.satuan || ''}</td>
                  <td className="px-4 py-3 text-xs text-[var(--ink-soft)]">{r.metode || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => cetakBA(r)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--line)] text-[var(--brand)] text-xs font-medium hover:bg-[var(--surface-2)] transition whitespace-nowrap">
                      <Printer size={13} /> {t('Cetak BA', 'Print Report')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'retur' && (
        <div className={TBL_WRAP}>
          <table className={TBL}>
            <thead className={THEAD}>
              <tr>
                <th className={TH_L}>No. Retur</th>
                <th className={TH_L}>{t('Tanggal', 'Date')}</th>
                <th className={TH_L}>{t('Produk', 'Product')}</th>
                <th className={TH_L}>Supplier</th>
                <th className={TH_L}>{t('Batch / Kadaluarsa', 'Batch / Expiry')}</th>
                <th className={TH_C}>Qty</th>
                <th className={TH_L}>{t('Alasan', 'Reason')}</th>
                <th className={TH_C}>Status</th>
                <th className={TH_C}>{t('Aksi', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {retur.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-[var(--ink-faint)] text-sm">
                  {t('Belum ada riwayat retur.', 'No return history yet.')}
                </td></tr>
              ) : retur.map((r: any) => (
                <tr key={r.id} className={TR}>
                  <td className="px-4 py-3 num text-xs text-[var(--ink)]">{r.nomor_retur || '-'}</td>
                  <td className="px-4 py-3 text-xs text-[var(--ink-soft)] num">{tanggal(r.tanggal_retur) || '-'}</td>
                  <td className="px-4 py-3 text-[var(--ink)] font-medium">{r.products?.nama_obat || '-'}</td>
                  <td className="px-4 py-3 text-xs text-[var(--ink-soft)]">{r.suppliers?.nama_supplier || '-'}</td>
                  <td className="px-4 py-3 text-xs text-[var(--ink-soft)]">
                    <span className="num">{r.product_batches?.batch_number || '-'}</span>
                    {r.product_batches?.expired_date && (
                      <span className="text-[var(--ink-faint)]"> · {tanggal(r.product_batches.expired_date)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-[var(--ink)] font-medium num">{angka(r.qty_retur)} {r.products?.satuan || ''}</td>
                  <td className="px-4 py-3 text-xs text-[var(--ink-soft)] max-w-[220px] truncate">{r.alasan || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.status === 'selesai' ? 'bg-green-100 text-green-700'
                      : r.status === 'dibatalkan' ? 'bg-gray-100 text-gray-500'
                      : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.status || 'diajukan'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(!r.status || r.status === 'diajukan') ? (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => konfirmasiRetur(r)} disabled={sibuk}
                          className="px-2.5 py-1 rounded-lg bg-[var(--brand)] text-[var(--on-brand)] text-xs font-medium hover:bg-[var(--brand-hover)] transition whitespace-nowrap disabled:opacity-50">
                          {t('Konfirmasi', 'Confirm')}
                        </button>
                        <button onClick={() => batalkan(r)}
                          className="px-2.5 py-1 rounded-lg border border-[var(--line)] text-[var(--ink-soft)] text-xs font-medium hover:bg-[var(--surface-2)] transition">
                          {t('Batal', 'Cancel')}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-xs text-[var(--ink-faint)]">-</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pilih && (
        <TindakLanjutBatch
          batch={pilih}
          profil={app.settingsData}
          namaApoteker={app.settingsData?.nama_apoteker}
          onTutup={() => setPilih(null)}
          onSelesai={muat}
        />
      )}
    </div>
  )
}
