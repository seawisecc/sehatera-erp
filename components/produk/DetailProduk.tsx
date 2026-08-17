'use client'

import { useCallback, useEffect, useState } from 'react'
import { Pencil, Truck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'
import { TR } from '@/lib/ui'
import { rupiah, angka, desimal, tanggal } from '@/lib/format'
import TindakLanjutBatch, { type BatchTindakLanjut } from '@/components/TindakLanjutBatch'

/**
 * Detail satu produk: info, batch, riwayat keluar, riwayat masuk.
 *
 * Berdiri sendiri karena isinya empat kueri yang tidak dibutuhkan halaman
 * daftar. Selama menumpang di monolit, keempatnya ikut hidup di memori tiap
 * halaman, dan satu di antaranya (`showProdukDetail`) dipakai kode pemusnahan
 * sebagai sumber angka stok, yang jadi cacat data paling tajam di aplikasi ini.
 */

type Props = {
  produk: any
  profil: any
  namaApoteker?: string
  onTutup: () => void
  onEdit: (p: any) => void
  /** Dipanggil kalau tindak lanjut batch mengubah stok, supaya daftar dimuat ulang. */
  onBerubah: () => void
}

const TAB = ['info', 'batch', 'keluar', 'masuk'] as const
type Tab = typeof TAB[number]

export default function DetailProduk({ produk, profil, namaApoteker, onTutup, onEdit, onBerubah }: Props) {
  const { t } = useLang()

  const [tab, setTab] = useState<Tab>('info')
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [keluar, setKeluar] = useState<any[]>([])
  const [masuk, setMasuk] = useState<any[]>([])
  const [tindakLanjut, setTindakLanjut] = useState<BatchTindakLanjut | null>(null)

  const muat = useCallback(async () => {
    const [{ data: ps }, { data: b }, { data: out }, { data: inn }] = await Promise.all([
      supabase.from('product_suppliers').select('*, suppliers(*)').eq('product_id', produk.id),
      supabase.from('product_batches').select('*').eq('product_id', produk.id).order('expired_date'),
      // transaction_items tidak punya created_at sendiri, jadi urutkan di sini,
      // bukan lewat .order() yang akan diam-diam mengurutkan kolom yang salah.
      supabase.from('transaction_items')
        .select('*, transactions(nomor_transaksi, created_at, status)').eq('product_id', produk.id),
      supabase.from('po_items')
        .select('*, purchase_orders(nomor_po, tanggal_terima, status, suppliers(nama_supplier))').eq('product_id', produk.id),
    ])
    setSuppliers(ps || [])
    setBatches(b || [])
    setKeluar((out || []).sort((a: any, c: any) =>
      new Date(c.transactions?.created_at || 0).getTime() - new Date(a.transactions?.created_at || 0).getTime()))
    setMasuk((inn || []).sort((a: any, c: any) =>
      new Date(c.purchase_orders?.tanggal_terima || 0).getTime() - new Date(a.purchase_orders?.tanggal_terima || 0).getTime()))
  }, [produk.id])

  useEffect(() => { muat() }, [muat])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !tindakLanjut) onTutup() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onTutup, tindakLanjut])

  const beli = produk.harga_beli || 0
  const jual = produk.harga_jual || 0
  const markup = beli > 0 ? ((jual - beli) / beli) * 100 : 0
  const margin = jual > 0 ? ((jual - beli) / jual) * 100 : 0

  const judul: Record<Tab, string> = {
    info: t('Info Produk', 'Product Info'),
    batch: t('Batch & Kadaluarsa', 'Batch & Expiry'),
    keluar: t('Riwayat Keluar', 'Out History'),
    masuk: t('Riwayat Masuk', 'In History'),
  }

  const TH = 'px-3 py-2 text-xs text-[var(--on-brand)] font-semibold'
  const totalKeluar = keluar.filter(x => x.transactions?.status !== 'dibatalkan')

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
        <div className="bg-[var(--surface)] rounded-2xl w-full max-w-3xl shadow-xl max-h-[90vh] flex flex-col">
          <div className="p-6 border-b border-[var(--line-soft)]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[var(--brand)] truncate">{produk.nama_obat}</h2>
                <p className="text-xs text-[var(--ink-soft)]">
                  <span className="num">{produk.kode}</span>{produk.nama_generik ? ` · ${produk.nama_generik}` : ''}
                </p>
              </div>
              <button onClick={onTutup} aria-label={t('Tutup', 'Close')}
                className="text-[var(--ink-faint)] hover:text-[var(--brand)] text-xl font-light shrink-0">✕</button>
            </div>
            <div className="flex gap-1 mt-4 flex-wrap">
              {TAB.map(x => (
                <button key={x} onClick={() => setTab(x)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${tab === x ? 'bg-[var(--brand)] text-[var(--on-brand)]' : 'text-[var(--ink-soft)] hover:bg-[var(--surface-2)]'}`}>
                  {judul[x]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {tab === 'info' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                      {[
                        { l: t('Harga Pokok', 'Cost'), v: rupiah(beli) },
                        { l: t('Harga Jual', 'Sell Price'), v: rupiah(jual) },
                        { l: 'Markup', v: desimal(markup) + '%' },
                        { l: 'Margin', v: desimal(margin) + '%' },
                      ].map((x, i) => (
                        <div key={i}>
                          <p className="text-xs text-[var(--ink-soft)] mb-1">{x.l}</p>
                          <p className="font-semibold text-[var(--ink)] text-sm num">{x.v}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => onEdit(produk)} title={t('Atur harga', 'Edit prices')}
                      className="p-2 rounded-lg text-[var(--brand)] hover:bg-[var(--surface-2)] transition shrink-0">
                      <Pencil size={16} />
                    </button>
                  </div>
                </div>

                {[
                  { label: t('Kode', 'Code'), value: produk.kode, num: true },
                  { label: t('Kategori', 'Category'), value: produk.kategori },
                  { label: t('Satuan', 'Unit'), value: produk.satuan },
                  { label: t('Isi Kemasan', 'Pack Size'), value: produk.isi_kemasan, num: true },
                  { label: t('Stok Total', 'Total Stock'), value: angka(produk.stok_total), num: true },
                  { label: t('Stok Minimum', 'Min Stock'), value: angka(produk.stok_minimum), num: true },
                  { label: 'Status', value: produk.status },
                ].map((item, i) => (
                  <div key={i} className="bg-[var(--surface-2)] rounded-lg p-3">
                    <p className="text-xs text-[var(--ink-soft)] mb-0.5">{item.label}</p>
                    <p className={`font-medium text-[var(--ink)] text-sm capitalize ${item.num ? 'num' : ''}`}>{item.value || '-'}</p>
                  </div>
                ))}

                <div className="col-span-2 bg-[var(--surface-2)] rounded-lg p-3">
                  <p className="text-xs text-[var(--ink-soft)] mb-0.5">{t('Kandungan / Komposisi', 'Ingredient / Composition')}</p>
                  <p className="font-medium text-[var(--ink)] text-sm">{produk.kandungan || '-'}</p>
                </div>

                <div className="col-span-2 bg-[var(--surface-2)] rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Truck size={13} className="text-[var(--brand-soft)]" />
                    <p className="text-xs text-[var(--ink-soft)]">{t('Bisa dipesan di', 'Can be ordered from')}</p>
                  </div>
                  {suppliers.length === 0 ? (
                    <p className="text-xs text-[var(--ink-faint)] italic">{t('Belum ada supplier, atur lewat tombol Edit.', 'No supplier set, assign via Edit.')}</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {suppliers.map((ps: any) => (
                        <span key={ps.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--line)] text-xs font-medium text-[var(--ink)]">
                          {ps.suppliers?.nama_supplier || '-'}
                          {ps.suppliers?.jenis && <span className="text-[var(--ink-faint)] font-normal">· {ps.suppliers.jenis}</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'batch' && (
              batches.length === 0 ? (
                <p className="text-center text-[var(--ink-faint)] py-8 text-sm">{t('Belum ada data batch.', 'No batch data yet.')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--brand)]">
                        <th className={TH + ' text-left'}>No. Batch</th>
                        <th className={TH + ' text-left'}>{t('Kadaluarsa', 'Expiry')}</th>
                        <th className={TH + ' text-center'}>{t('Stok Batch', 'Batch Stock')}</th>
                        <th className={TH + ' text-left'}>Status</th>
                        <th className={TH + ' text-center'}>{t('Aksi', 'Action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map((b: any) => {
                        const hari = Math.ceil((new Date(b.expired_date).getTime() - Date.now()) / 86400000)
                        const lewat = hari <= 0
                        const bahaya = hari > 0 && hari <= 30
                        const awas = hari > 30 && hari <= 60
                        const sudah = !!b.ditindaklanjuti_pada
                        return (
                          <tr key={b.id} className={`border-b border-[var(--line-soft)] ${lewat || bahaya ? 'bg-red-50' : awas ? 'bg-yellow-50' : ''}`}>
                            <td className="px-3 py-2 num text-xs text-[var(--ink)]">{b.batch_number || '-'}</td>
                            <td className="px-3 py-2 text-sm num">{tanggal(b.expired_date) || '-'}</td>
                            <td className="px-3 py-2 text-center font-medium text-[var(--ink)] num">{angka(b.stok_batch)}</td>
                            <td className="px-3 py-2">
                              {lewat ? <span className="px-2 py-0.5 rounded-full text-xs bg-red-200 text-red-800 font-medium">{t('Kadaluarsa', 'Expired')}</span>
                                : bahaya ? <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">≤ 30 {t('hari', 'days')}</span>
                                : awas ? <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 font-medium">≤ 60 {t('hari', 'days')}</span>
                                : <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">{t('Aman', 'Healthy')}</span>}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {sudah ? (
                                <span className="text-xs text-[var(--ink-faint)]">{t('sudah ditindaklanjuti', 'followed up')}</span>
                              ) : b.stok_batch > 0 && (lewat || bahaya || awas) ? (
                                <button onClick={() => setTindakLanjut({ ...b, products: produk })}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${lewat || bahaya ? 'bg-red-600 text-white hover:bg-red-700' : 'border border-[var(--line)] text-[var(--brand)] hover:bg-[var(--surface-2)]'}`}>
                                  {t('Tindak Lanjut', 'Follow up')}
                                </button>
                              ) : (
                                <span className="text-xs text-[var(--ink-faint)]">-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {tab === 'keluar' && (
              keluar.length === 0 ? (
                <p className="text-center text-[var(--ink-faint)] py-8 text-sm">{t('Belum ada riwayat penjualan.', 'No sales history yet.')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--brand)]">
                        <th className={TH + ' text-left'}>{t('No. Transaksi', 'Transaction No.')}</th>
                        <th className={TH + ' text-left'}>{t('Tanggal', 'Date')}</th>
                        <th className={TH + ' text-center'}>Qty</th>
                        <th className={TH + ' text-right'}>{t('Harga Jual', 'Sell Price')}</th>
                        <th className={TH + ' text-right'}>Subtotal</th>
                        <th className={TH + ' text-center'}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keluar.map((x: any, i: number) => (
                        <tr key={i} className={TR}>
                          <td className="px-3 py-2 num text-xs text-[var(--brand)]">{x.transactions?.nomor_transaksi}</td>
                          <td className="px-3 py-2 text-xs text-[var(--ink-soft)] num">{tanggal(x.transactions?.created_at) || '-'}</td>
                          <td className="px-3 py-2 text-center text-[var(--ink)] font-medium num">{angka(x.jumlah)}</td>
                          <td className="px-3 py-2 text-right text-[var(--ink-soft)] num">{rupiah(x.harga_jual)}</td>
                          <td className="px-3 py-2 text-right font-medium text-[var(--ink)] num">{rupiah(x.subtotal)}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${x.transactions?.status === 'dibatalkan' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                              {x.transactions?.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[var(--brand)] bg-[var(--surface-2)]">
                        <td colSpan={2} className="px-3 py-2 font-bold text-sm text-[var(--brand)]">{t('Total Keluar', 'Total Out')}</td>
                        <td className="px-3 py-2 text-center font-bold text-[var(--brand)] num">
                          {angka(totalKeluar.reduce((a: number, b: any) => a + (b.jumlah || 0), 0))}
                        </td>
                        <td></td>
                        <td className="px-3 py-2 text-right font-bold text-[var(--brand)] num">
                          {rupiah(totalKeluar.reduce((a: number, b: any) => a + (b.subtotal || 0), 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )
            )}

            {tab === 'masuk' && (
              masuk.length === 0 ? (
                <p className="text-center text-[var(--ink-faint)] py-8 text-sm">{t('Belum ada riwayat penerimaan.', 'No receiving history yet.')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--brand)]">
                        <th className={TH + ' text-left'}>No. PO</th>
                        <th className={TH + ' text-left'}>Supplier</th>
                        <th className={TH + ' text-left'}>{t('Tgl Terima', 'Received')}</th>
                        <th className={TH + ' text-center'}>{t('Qty Pesan', 'Ordered')}</th>
                        <th className={TH + ' text-center'}>{t('Qty Terima', 'Received')}</th>
                        <th className={TH + ' text-right'}>{t('Harga Beli', 'Buy Price')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masuk.map((x: any, i: number) => (
                        <tr key={i} className={TR}>
                          <td className="px-3 py-2 num text-xs text-[var(--brand)]">{x.purchase_orders?.nomor_po}</td>
                          <td className="px-3 py-2 text-xs text-[var(--ink-soft)]">{x.purchase_orders?.suppliers?.nama_supplier || '-'}</td>
                          <td className="px-3 py-2 text-xs text-[var(--ink-soft)] num">{tanggal(x.purchase_orders?.tanggal_terima) || '-'}</td>
                          <td className="px-3 py-2 text-center text-[var(--ink-soft)] num">{angka(x.qty_pesan)}</td>
                          <td className="px-3 py-2 text-center font-medium text-[var(--ink)] num">{angka(x.qty_terima)}</td>
                          <td className="px-3 py-2 text-right text-[var(--ink)] num">{rupiah(x.harga_beli)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[var(--brand)] bg-[var(--surface-2)]">
                        <td colSpan={4} className="px-3 py-2 font-bold text-sm text-[var(--brand)]">{t('Total Masuk', 'Total In')}</td>
                        <td className="px-3 py-2 text-center font-bold text-[var(--brand)] num">
                          {angka(masuk.reduce((a: number, b: any) => a + (b.qty_terima || 0), 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {tindakLanjut && (
        <TindakLanjutBatch
          batch={tindakLanjut}
          profil={profil}
          namaApoteker={namaApoteker}
          onTutup={() => setTindakLanjut(null)}
          onSelesai={() => { muat(); onBerubah() }}
        />
      )}
    </>
  )
}
