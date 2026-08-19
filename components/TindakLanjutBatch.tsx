'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/i18n'
import { useUmpan } from '@/components/Umpan'
import { pesanError } from '@/lib/session'
import { bukaCetak, beritaAcaraPemusnahan } from '@/lib/cetak'
import { angka, tanggal } from '@/lib/format'

/**
 * Tindak lanjut satu batch yang mendekati atau melewati kadaluarsa.
 *
 * Dipakai dua halaman: daftar pengingat di Produk, dan halaman Tindak Lanjut.
 * Karena itu ia berdiri sendiri, bukan menumpang salah satunya.
 *
 * Ketiga tindakannya sekarang lewat RPC (migrasi 0011). Yang dulu terjadi di
 * peramban:
 *
 * - Pemusnahan menulis stok produk sebagai `salinan_produk_di_layar - qty`.
 *   Salinan itu diambil saat modal detail produk dibuka, dan kalau modal itu
 *   tidak sedang terbuka nilainya undefined, jadi stok produknya jadi NOL.
 * - "Tandai selesai" menulis `stok_batch = 0` tanpa menyentuh stok produk,
 *   yang membuat jumlah batch tidak lagi cocok dengan stok produk selamanya.
 *   Sekarang batchnya cuma ditandai `ditindaklanjuti_pada`, angkanya utuh.
 */

export type BatchTindakLanjut = {
  id: string
  product_id: string
  batch_number: string | null
  expired_date: string | null
  stok_batch: number
  po_id?: string | null
  products?: { nama_obat?: string; satuan?: string | null } | null
}

type Props = {
  batch: BatchTindakLanjut
  /** Profil apotek untuk kop berita acara. */
  profil: any
  namaApoteker?: string
  onTutup: () => void
  /** Dipanggil sesudah salah satu tindakan berhasil, supaya daftar dimuat ulang. */
  onSelesai: () => void
}

const INPUT = 'w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'

export default function TindakLanjutBatch({ batch, profil, namaApoteker, onTutup, onSelesai }: Props) {
  const { t } = useLang()
  const { kabar, konfirmasi } = useUmpan()

  const [mode, setMode] = useState<'pilih' | 'musnahkan' | 'retur'>('pilih')
  const [sibuk, setSibuk] = useState(false)
  const [supplierBatch, setSupplierBatch] = useState<any>(null)
  const [suppliers, setSuppliers] = useState<any[]>([])

  const [musnah, setMusnah] = useState({
    tanggal_musnahkan: new Date().toISOString().split('T')[0],
    qty_musnahkan: batch.stok_batch,
    metode: 'Dibakar',
    saksi_1: namaApoteker || '',
    saksi_2: '',
    keterangan: '',
  })
  const [retur, setRetur] = useState({
    supplier_id: '',
    tanggal_retur: new Date().toISOString().split('T')[0],
    qty_retur: batch.stok_batch,
    alasan: 'Produk mendekati atau melebihi tanggal kadaluarsa',
  })

  const nama = batch.products?.nama_obat || ''

  // Supplier asal batch: dari PO kalau batchnya datang lewat penerimaan barang,
  // kalau tidak dari daftar supplier produk itu.
  useEffect(() => {
    (async () => {
      if (batch.po_id) {
        const { data } = await supabase.from('purchase_orders').select('suppliers(*)').eq('id', batch.po_id).maybeSingle()
        if ((data as any)?.suppliers) { setSupplierBatch((data as any).suppliers); return }
      }
      const { data: ps } = await supabase.from('product_suppliers')
        .select('suppliers(*)').eq('product_id', batch.product_id).limit(1).maybeSingle()
      if ((ps as any)?.suppliers) setSupplierBatch((ps as any).suppliers)
    })()
  }, [batch.po_id, batch.product_id])

  useEffect(() => {
    if (mode !== 'retur' || supplierBatch || suppliers.length) return
    supabase.from('suppliers').select('id,nama_supplier').order('nama_supplier')
      .then(({ data }) => setSuppliers(data || []))
  }, [mode, supplierBatch, suppliers.length])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onTutup() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onTutup])

  const tandaiSelesai = async () => {
    if (!await konfirmasi({ judul: t(
      'Singkirkan pengingat untuk batch ini?\nStok tidak diubah sama sekali, batchnya hanya berhenti muncul di daftar.',
      'Remove the reminder for this batch?\nStock is not changed at all, the batch just stops appearing in the list.')})) return
    setSibuk(true)
    const { error } = await supabase.rpc('abaikan_batch', { p_batch_id: batch.id })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    onSelesai(); onTutup()
  }

  const kirimMusnahkan = async () => {
    if (!musnah.saksi_1.trim()) { kabar(t('Saksi pertama wajib diisi.', 'The first witness is required.')); return }
    setSibuk(true)
    const { data, error } = await supabase.rpc('musnahkan_batch', {
      p_batch_id: batch.id,
      p_data: musnah,
    })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }

    const ba = data as any
    const ok = bukaCetak(beritaAcaraPemusnahan(profil, {
      nomor_ba: ba?.nomor_ba,
      tanggal_musnahkan: musnah.tanggal_musnahkan,
      nama_produk: nama,
      satuan: batch.products?.satuan,
      batch_number: batch.batch_number,
      expired_date: batch.expired_date,
      qty_musnahkan: musnah.qty_musnahkan,
      metode: musnah.metode,
      keterangan: musnah.keterangan,
      saksi_1: musnah.saksi_1,
      saksi_2: musnah.saksi_2,
    }))
    onSelesai(); onTutup()
    if (!ok) kabar(t(`Pemusnahan tercatat sebagai ${ba?.nomor_ba}, tapi jendela cetak diblokir peramban. Cetak ulang dari Tindak Lanjut.`,
                     `Destruction recorded as ${ba?.nomor_ba}, but the print window was blocked. Reprint it from Follow-up.`))
  }

  const kirimRetur = async () => {
    const supplierId = retur.supplier_id || supplierBatch?.id
    if (!supplierId) { kabar(t('Pilih supplier dulu.', 'Choose a supplier first.')); return }
    if (retur.qty_retur <= 0 || retur.qty_retur > batch.stok_batch) {
      kabar(t(`Jumlah retur harus antara 1 dan ${batch.stok_batch}.`, `Return quantity must be between 1 and ${batch.stok_batch}.`)); return
    }
    setSibuk(true)
    const { error } = await supabase.from('retur_supplier').insert([{
      batch_id: batch.id, product_id: batch.product_id, supplier_id: supplierId,
      qty_retur: retur.qty_retur, tanggal_retur: retur.tanggal_retur,
      alasan: retur.alasan, status: 'diajukan',
    }])
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    onSelesai(); onTutup()
    kabar(t('Retur diajukan. Stok belum berubah, konfirmasi di Tindak Lanjut, tab Retur, untuk memprosesnya.',
            'Return filed. Stock is unchanged, confirm it in Follow-up, Returns tab, to process it.'))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" role="dialog" aria-modal="true">
      <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[var(--brand)]">{t('Tindak Lanjut Batch', 'Batch Follow-up')}</h2>
          <p className="text-xs text-[var(--ink-soft)]">
            {nama} · Batch {batch.batch_number || '-'} · {t('kadaluarsa', 'expiry')} {tanggal(batch.expired_date) || '-'} · {t('stok', 'stock')} {angka(batch.stok_batch)}
          </p>
        </div>

        {mode === 'pilih' && (
          <div className="space-y-3">
            <button onClick={tandaiSelesai} disabled={sibuk}
              className="w-full flex items-start gap-4 p-4 border-2 border-[var(--line)] rounded-xl hover:border-[var(--brand)] hover:bg-[var(--surface-2)] transition text-left disabled:opacity-50">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-[var(--ink)] text-sm">{t('Tandai Selesai (pengingat saja)', 'Mark Done (reminder only)')}</p>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  {t('Batch ini berhenti muncul di daftar pengingat. Stok tidak diubah sama sekali.',
                     'This batch stops appearing in the reminder list. Stock is not changed at all.')}
                </p>
              </div>
            </button>

            <button onClick={() => setMode('musnahkan')}
              className="w-full flex items-start gap-4 p-4 border-2 border-[var(--line)] rounded-xl hover:border-red-400 hover:bg-red-50 transition text-left">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="font-semibold text-[var(--ink)] text-sm">{t('Musnahkan', 'Destroy')}</p>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  {t('Membuat Berita Acara Pemusnahan dan mencetak dokumen resminya. Stok batch dan stok produk sama-sama berkurang.',
                     'Creates a Destruction Report and prints the official document. Both batch stock and product stock are reduced.')}
                </p>
              </div>
            </button>

            <button onClick={() => setMode('retur')}
              className="w-full flex items-start gap-4 p-4 border-2 border-[var(--line)] rounded-xl hover:border-blue-400 hover:bg-blue-50 transition text-left">
              <span className="text-2xl">↩️</span>
              <div>
                <p className="font-semibold text-[var(--ink)] text-sm">{t('Retur ke Supplier', 'Return to Supplier')}</p>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  {supplierBatch ? `${t('Retur ke', 'Return to')} ${supplierBatch.nama_supplier}` : t('Pilih supplier untuk returnya.', 'Choose a supplier for the return.')}
                </p>
              </div>
            </button>

            <button onClick={onTutup} className="w-full border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
              {t('Batal', 'Cancel')}
            </button>
          </div>
        )}

        {mode === 'musnahkan' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Tanggal Pemusnahan', 'Destruction Date')}</label>
                <input type="date" value={musnah.tanggal_musnahkan}
                  onChange={e => setMusnah({ ...musnah, tanggal_musnahkan: e.target.value })} className={INPUT} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">
                  {t('Qty Dimusnahkan', 'Qty Destroyed')} <span className="text-[var(--ink-faint)]">({t('maks', 'max')} {angka(batch.stok_batch)})</span>
                </label>
                <input type="number" min={1} max={batch.stok_batch} value={musnah.qty_musnahkan}
                  onChange={e => setMusnah({ ...musnah, qty_musnahkan: +e.target.value })} className={INPUT + ' num'} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Metode', 'Method')}</label>
              <select value={musnah.metode} onChange={e => setMusnah({ ...musnah, metode: e.target.value })} className={INPUT}>
                <option>Dibakar</option><option>Dikubur</option><option>Dihancurkan</option>
                <option>Dilarutkan &amp; Dibuang</option><option>Lainnya</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Saksi 1 *', 'Witness 1 *')}</label>
                <input value={musnah.saksi_1} onChange={e => setMusnah({ ...musnah, saksi_1: e.target.value })} className={INPUT} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Saksi 2', 'Witness 2')}</label>
                <input value={musnah.saksi_2} onChange={e => setMusnah({ ...musnah, saksi_2: e.target.value })} className={INPUT} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Keterangan', 'Notes')}</label>
              <textarea rows={2} value={musnah.keterangan}
                onChange={e => setMusnah({ ...musnah, keterangan: e.target.value })} className={INPUT} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setMode('pilih')} className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
                {t('Kembali', 'Back')}
              </button>
              <button onClick={kirimMusnahkan} disabled={sibuk}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50">
                {sibuk ? t('Menyimpan…', 'Saving…') : t('Musnahkan & Cetak BA', 'Destroy & Print Report')}
              </button>
            </div>
          </div>
        )}

        {mode === 'retur' && (
          <div className="space-y-3">
            {supplierBatch ? (
              <div className="p-3 bg-[var(--surface-2)] rounded-lg">
                <p className="text-xs text-[var(--ink-soft)] mb-0.5">{t('Supplier dari PO asal', 'Supplier from the original PO')}</p>
                <p className="font-semibold text-[var(--ink)]">{supplierBatch.nama_supplier}</p>
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Pilih Supplier *', 'Choose Supplier *')}</label>
                <select value={retur.supplier_id} onChange={e => setRetur({ ...retur, supplier_id: e.target.value })} className={INPUT}>
                  <option value="">{t('-- Pilih Supplier --', '-- Choose Supplier --')}</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama_supplier}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Tanggal Retur', 'Return Date')}</label>
                <input type="date" value={retur.tanggal_retur}
                  onChange={e => setRetur({ ...retur, tanggal_retur: e.target.value })} className={INPUT} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">
                  {t('Qty Retur', 'Return Qty')} <span className="text-[var(--ink-faint)]">({t('maks', 'max')} {angka(batch.stok_batch)})</span>
                </label>
                <input type="number" min={1} max={batch.stok_batch} value={retur.qty_retur}
                  onChange={e => setRetur({ ...retur, qty_retur: +e.target.value })} className={INPUT + ' num'} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Alasan', 'Reason')}</label>
              <textarea rows={2} value={retur.alasan}
                onChange={e => setRetur({ ...retur, alasan: e.target.value })} className={INPUT} />
            </div>
            <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              <span>ℹ️</span>
              <span>
                {t('Retur diajukan dulu.', 'The return is filed first.')}{' '}
                <b>{t('Stok baru berkurang sesudah kamu Konfirmasi', 'Stock is only reduced after you Confirm')}</b>{' '}
                {t('di Tindak Lanjut, tab Retur.', 'in Follow-up, Returns tab.')}
              </span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setMode('pilih')} className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
                {t('Kembali', 'Back')}
              </button>
              <button onClick={kirimRetur} disabled={sibuk}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                {sibuk ? t('Menyimpan…', 'Saving…') : t('Ajukan Retur', 'File Return')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
