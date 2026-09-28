'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Search, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { usePemuat } from '@/lib/pemuat'
import { useLang } from '@/lib/i18n'
import { useUmpan } from '@/components/Umpan'
import { pesanError } from '@/lib/session'
import { boleh } from '@/lib/hak'
import { angka, tanggal, tanggalJam } from '@/lib/format'
import { TBL_WRAP, TBL_KARTU, TBL_KARTU_WADAH, TBL, THEAD, TH_L, TH_R, TR } from '@/lib/ui'
import Dialog, { TOMBOL_KEDUA, TOMBOL_UTAMA } from '@/components/Dialog'

/**
 * Transfer stok antar outlet dalam satu kelompok (migrasi 0092).
 *
 * Pengirim memilih batch; stoknya langsung turun. Penerima menekan Terima;
 * produknya dicocokkan ke katalog penerima (barcode, KFA, lalu nama persis)
 * atau dibuat, dan batch yang sama digabung. Seluruh aturannya di database.
 *
 * Nama outlet lawan diambil dari `outlet_saya`, bukan dari embed `companies`:
 * RLS companies hanya membuka faskes yang sedang dibuka, jadi embed ke outlet
 * lain akan kosong tanpa galat.
 */

type Outlet = { id: string; nama: string; aktif: boolean }
type Transfer = {
  id: string; company_id: string; ke_company_id: string; nomor: string | null; status: 'dikirim' | 'diterima' | 'batal'
  catatan: string | null; dibuat_oleh: string | null; dibuat_pada: string; diterima_oleh: string | null
  diterima_pada: string | null; alasan_batal: string | null
  stock_transfer_items: { id: string; nama_obat: string; batch_number: string | null; expired_date: string | null; qty: number; satuan: string | null }[]
}
type Batch = { id: string; batch_number: string | null; expired_date: string | null; stok_batch: number; products: { nama_obat: string; satuan: string | null; kode: string | null } | null }
type Baris = { batch: Batch; qty: string }

const STATUS_CLS: Record<Transfer['status'], string> = {
  dikirim:  'bg-amber-50 text-amber-800 ring-1 ring-amber-600/20',
  diterima: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  batal:    'bg-gray-100 text-gray-500 ring-1 ring-gray-400/20',
}
const INPUT = 'border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-sm bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'

export default function TransferStok() {
  const app = useApp()
  const { t } = useLang()
  const { kabar, konfirmasi, tanya } = useUmpan()
  const { memuat, mulai, selesai } = usePemuat(app.superViewCompany)

  const [outlet, setOutlet] = useState<Outlet[]>([])
  const [daftar, setDaftar] = useState<Transfer[]>([])
  const [detail, setDetail] = useState<Transfer | null>(null)
  const [bukaKirim, setBukaKirim] = useState(false)
  const [tujuan, setTujuan] = useState('')
  const [cari, setCari] = useState('')
  const [hasilCari, setHasilCari] = useState<Batch[]>([])
  const [baris, setBaris] = useState<Baris[]>([])
  const [catatan, setCatatan] = useState('')
  const [sibuk, setSibuk] = useState(false)

  const bolehTransfer = boleh(app.currentRole, 'stok.transfer', app.isSuper)
  const aktif = outlet.find(o => o.aktif)
  const namaOutlet = useCallback((id: string) => outlet.find(o => o.id === id)?.nama || t('outlet lain', 'another outlet'), [outlet, t])
  const tujuanPilihan = outlet.filter(o => !o.aktif)

  const muat = useCallback(async () => {
    mulai()
    const [{ data: o }, { data, error }] = await Promise.all([
      supabase.rpc('outlet_saya'),
      supabase.from('stock_transfers')
        .select('*, stock_transfer_items(id,nama_obat,batch_number,expired_date,qty,satuan)')
        .order('dibuat_pada', { ascending: false }).limit(100),
    ])
    if (error) kabar(pesanError(error), 'galat')
    setOutlet((o as Outlet[]) || [])
    setDaftar((data as Transfer[]) || [])
    selesai()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { muat() }, [muat])

  // Pencarian batch di outlet yang sedang dibuka, hanya yang masih berisi.
  useEffect(() => {
    const q = cari.trim()
    if (q.length < 2) { setHasilCari([]); return }
    const id = window.setTimeout(async () => {
      const { data } = await supabase.from('product_batches')
        .select('id,batch_number,expired_date,stok_batch,products!inner(nama_obat,satuan,kode)')
        .gt('stok_batch', 0).ilike('products.nama_obat', `%${q}%`)
        .order('expired_date').limit(12)
      setHasilCari((data as unknown as Batch[]) || [])
    }, 250)
    return () => window.clearTimeout(id)
  }, [cari])

  const tambah = (b: Batch) => {
    if (baris.some(x => x.batch.id === b.id)) return
    setBaris(prev => [...prev, { batch: b, qty: '' }])
    setCari(''); setHasilCari([])
  }

  const kirim = async () => {
    if (!tujuan) { kabar(t('Pilih outlet tujuan.', 'Choose the destination outlet.'), 'galat'); return }
    const isi = baris.map(x => ({ batch_id: x.batch.id, qty: Math.floor(Number(x.qty)) }))
    if (isi.length === 0 || isi.some(x => !(x.qty > 0))) {
      kabar(t('Isi jumlah setiap baris, lebih dari nol.', 'Enter a quantity above zero on every row.'), 'galat'); return
    }
    const lebih = baris.find(x => Number(x.qty) > x.batch.stok_batch)
    if (lebih) {
      kabar(t(`${lebih.batch.products?.nama_obat} batch ${lebih.batch.batch_number || '-'} hanya berisi ${lebih.batch.stok_batch}.`,
              `${lebih.batch.products?.nama_obat} batch ${lebih.batch.batch_number || '-'} only holds ${lebih.batch.stok_batch}.`), 'galat'); return
    }
    const total = isi.reduce((a, x) => a + x.qty, 0)
    if (!await konfirmasi({
      judul: t(`Kirim ke ${namaOutlet(tujuan)}?`, `Send to ${namaOutlet(tujuan)}?`),
      pesan: t(`${isi.length} batch, ${angka(total)} unit. Stok di outlet ini langsung berkurang; stok di ${namaOutlet(tujuan)} bertambah saat mereka menekan Terima.`,
               `${isi.length} batches, ${angka(total)} units. Stock here drops right away; ${namaOutlet(tujuan)} gains it when they press Receive.`),
      tombol: t('Kirim', 'Send'),
    })) return
    setSibuk(true)
    const { data, error } = await supabase.rpc('kirim_transfer', { p_ke: tujuan, p_baris: isi, p_catatan: catatan || null })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    kabar(t(`Transfer ${data.nomor} dikirim.`, `Transfer ${data.nomor} sent.`), 'ok')
    setBukaKirim(false); setBaris([]); setTujuan(''); setCatatan('')
    muat()
  }

  const terima = async (tr: Transfer) => {
    if (!await konfirmasi({
      judul: t(`Terima ${tr.nomor}?`, `Receive ${tr.nomor}?`),
      pesan: t(`${tr.stock_transfer_items.length} batch dari ${namaOutlet(tr.company_id)} masuk ke stok outlet ini. Pastikan barangnya sudah benar-benar sampai dan jumlahnya sesuai.`,
               `${tr.stock_transfer_items.length} batches from ${namaOutlet(tr.company_id)} enter this outlet's stock. Make sure the goods actually arrived and the counts match.`),
      tombol: t('Terima', 'Receive'),
    })) return
    setSibuk(true)
    const { data, error } = await supabase.rpc('terima_transfer', { p_transfer: tr.id })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    kabar(data.produk_baru > 0
      ? t(`Diterima. ${data.produk_baru} produk baru ditambahkan ke katalog outlet ini.`, `Received. ${data.produk_baru} new products added to this outlet's catalog.`)
      : t('Diterima. Stok outlet ini sudah bertambah.', 'Received. This outlet\'s stock has increased.'), 'ok')
    setDetail(null)
    muat()
  }

  const batalkan = async (tr: Transfer) => {
    const alasan = await tanya({ judul: t(`Batalkan ${tr.nomor}?`, `Cancel ${tr.nomor}?`),
      label: t('Alasan pembatalan', 'Reason for cancelling'), wajib: true })
    if (!alasan) return
    setSibuk(true)
    const { error } = await supabase.rpc('batal_transfer', { p_transfer: tr.id, p_alasan: alasan })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    kabar(t('Transfer dibatalkan. Stok kembali ke batch asalnya.', 'Transfer cancelled. Stock returned to its original batches.'), 'ok')
    setDetail(null)
    muat()
  }

  const ringkas = useMemo(() => ({
    masukMenunggu: daftar.filter(x => x.status === 'dikirim' && x.ke_company_id === aktif?.id).length,
  }), [daftar, aktif])

  const satuOutlet = !memuat && outlet.length <= 1

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-3xl font-bold text-[var(--ink)] mb-1">{t('Transfer Stok', 'Stock Transfer')}</h1>
          <p className="text-sm text-[var(--ink-soft)] max-w-2xl">
            {t('Pindahkan obat antar outlet tanpa mencatatnya sebagai penjualan dan pembelian. Batch dan tanggal kedaluwarsanya ikut pindah, dan gerakannya masuk SIPNAP kedua outlet.',
               'Move stock between outlets without recording it as a sale and a purchase. Batches and expiry dates move with it, and the movement appears in both outlets\' SIPNAP.')}
          </p>
        </div>
        {bolehTransfer && !satuOutlet && (
          <button onClick={() => setBukaKirim(true)} disabled={app.isSuper && !app.superViewCompany}
            className="inline-flex items-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-40 whitespace-nowrap">
            <ArrowLeftRight size={16} /> {t('Kirim stok', 'Send stock')}
          </button>
        )}
      </div>

      {satuOutlet && (
        <p className="mb-4 text-sm text-[var(--ink-soft)] bg-[var(--surface-2)] rounded-xl px-4 py-3">
          {t('Faskes ini baru punya satu outlet. Transfer stok berguna begitu ada cabang kedua; tambahkan di Pengaturan > Outlet & Cabang.',
             'This facility has only one outlet. Stock transfer becomes useful once there is a second branch; add one in Settings > Outlets & Branches.')}
        </p>
      )}
      {ringkas.masukMenunggu > 0 && (
        <p className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          {t(`${ringkas.masukMenunggu} kiriman menunggu diterima di outlet ini. Terima begitu barangnya sampai, supaya stoknya terlihat di kasir.`,
             `${ringkas.masukMenunggu} shipments are waiting to be received here. Receive them once the goods arrive so the stock shows at the register.`)}
        </p>
      )}

      <div className={`${TBL_WRAP} ${TBL_KARTU_WADAH}`}>
        <table className={`${TBL} ${TBL_KARTU}`}>
          <thead className={THEAD}>
            <tr>
              <th className={TH_L}>{t('Nomor', 'Number')}</th>
              <th className={TH_L}>{t('Arah', 'Direction')}</th>
              <th className={TH_L}>{t('Dikirim', 'Sent')}</th>
              <th className={TH_R}>{t('Baris', 'Rows')}</th>
              <th className={TH_L}>Status</th>
              <th className={TH_R}>{t('Aksi', 'Action')}</th>
            </tr>
          </thead>
          <tbody>
            {memuat ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</td></tr>
            ) : daftar.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--ink-faint)]">{t('Belum ada transfer.', 'No transfers yet.')}</td></tr>
            ) : daftar.map(tr => {
              const keluar = tr.company_id === aktif?.id
              return (
                <tr key={tr.id} className={`${TR} cursor-pointer`} onClick={() => setDetail(tr)}>
                  <td data-utama className="px-4 py-3 num font-medium text-[var(--brand)]">{tr.nomor || '-'}</td>
                  <td data-l={t('Arah', 'Direction')} className="px-4 py-3 text-sm">
                    {keluar ? <>{t('Ke', 'To')} <strong className="font-medium">{namaOutlet(tr.ke_company_id)}</strong></>
                            : <>{t('Dari', 'From')} <strong className="font-medium">{namaOutlet(tr.company_id)}</strong></>}
                  </td>
                  <td data-l={t('Dikirim', 'Sent')} className="px-4 py-3 text-xs text-[var(--ink-soft)] num whitespace-nowrap">{tanggalJam(tr.dibuat_pada)}</td>
                  <td data-l={t('Baris', 'Rows')} className="px-4 py-3 text-right num">{tr.stock_transfer_items.length}</td>
                  <td data-l="Status" className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CLS[tr.status]}`}>{tr.status}</span></td>
                  <td data-aksi className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    {tr.status === 'dikirim' && bolehTransfer && (!keluar
                      ? <button onClick={() => terima(tr)} disabled={sibuk} className="px-3 py-1.5 rounded-lg bg-[var(--brand)] text-[var(--on-brand)] text-xs font-semibold hover:bg-[var(--brand-hover)] disabled:opacity-50">{t('Terima', 'Receive')}</button>
                      : <button onClick={() => batalkan(tr)} disabled={sibuk} className="px-3 py-1.5 rounded-lg border border-[var(--line)] text-xs text-[var(--ink-soft)] hover:bg-[var(--surface-2)] disabled:opacity-50">{t('Batalkan', 'Cancel')}</button>)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {detail && (
        <Dialog judul={detail.nomor || ''} sub={detail.company_id === aktif?.id
            ? `${t('Ke', 'To')} ${namaOutlet(detail.ke_company_id)}` : `${t('Dari', 'From')} ${namaOutlet(detail.company_id)}`}
          lebar="md" onTutup={() => setDetail(null)}
          aksi={<button type="button" onClick={() => setDetail(null)} className={TOMBOL_KEDUA}>{t('Tutup', 'Close')}</button>}>
          <div className="space-y-3 text-sm">
            <p className="text-xs text-[var(--ink-soft)]">
              {t('Dikirim', 'Sent')} {tanggalJam(detail.dibuat_pada)} {t('oleh', 'by')} {detail.dibuat_oleh}
              {detail.diterima_pada && <> · {t('diterima', 'received')} {tanggalJam(detail.diterima_pada)} {t('oleh', 'by')} {detail.diterima_oleh}</>}
              {detail.alasan_batal && <> · {t('dibatalkan', 'cancelled')}: {detail.alasan_batal}</>}
            </p>
            {detail.catatan && <p className="text-[var(--ink-soft)]">{detail.catatan}</p>}
            <ul className="divide-y divide-[var(--line-soft)] border border-[var(--line)] rounded-xl">
              {detail.stock_transfer_items.map(it => (
                <li key={it.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div>
                    <p className="font-medium text-[var(--ink)]">{it.nama_obat}</p>
                    <p className="text-[11px] text-[var(--ink-faint)] num">{it.batch_number || '-'}{it.expired_date && ` · ED ${tanggal(it.expired_date)}`}</p>
                  </div>
                  <span className="num font-semibold">{angka(it.qty)} {it.satuan || ''}</span>
                </li>
              ))}
            </ul>
          </div>
        </Dialog>
      )}

      {bukaKirim && (
        <Dialog judul={t('Kirim stok', 'Send stock')} sub={aktif ? `${t('Dari', 'From')} ${aktif.nama}` : undefined} lebar="lg"
          onTutup={() => setBukaKirim(false)}
          aksi={<>
            <button type="button" onClick={() => setBukaKirim(false)} className={TOMBOL_KEDUA}>{t('Batal', 'Cancel')}</button>
            <button type="button" onClick={kirim} disabled={sibuk || baris.length === 0} className={TOMBOL_UTAMA}>{t('Kirim', 'Send')}</button>
          </>}>
          <div className="space-y-4">
            <div>
              <label htmlFor="trf-tujuan" className="block text-[13px] font-medium text-[var(--ink-mid)] mb-1.5">{t('Outlet tujuan', 'Destination outlet')}</label>
              <select id="trf-tujuan" value={tujuan} onChange={e => setTujuan(e.target.value)} className={INPUT + ' w-full py-2.5'}>
                <option value="">{t('Pilih outlet…', 'Choose outlet…')}</option>
                {tujuanPilihan.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
              </select>
            </div>
            <div className="relative">
              <label htmlFor="trf-cari" className="block text-[13px] font-medium text-[var(--ink-mid)] mb-1.5">{t('Tambah obat', 'Add a drug')}</label>
              <Search size={15} className="absolute left-3 top-[2.35rem] text-[var(--ink-faint)]" />
              <input id="trf-cari" value={cari} onChange={e => setCari(e.target.value)} placeholder={t('Ketik nama obat…', 'Type a drug name…')}
                className={INPUT + ' w-full py-2.5 pl-9'} />
              {hasilCari.length > 0 && (
                <ul className="mt-1 border border-[var(--line)] rounded-xl divide-y divide-[var(--line-soft)] max-h-56 overflow-auto bg-[var(--surface)]">
                  {hasilCari.map(b => (
                    <li key={b.id}>
                      <button type="button" onClick={() => tambah(b)} className="w-full text-left px-3 py-2 hover:bg-[var(--surface-2)]">
                        <span className="font-medium text-[var(--ink)]">{b.products?.nama_obat}</span>
                        <span className="block text-[11px] text-[var(--ink-faint)] num">
                          {b.batch_number || t('tanpa nomor batch', 'no batch number')}{b.expired_date && ` · ED ${tanggal(b.expired_date)}`} · {t('stok', 'stock')} {angka(b.stok_batch)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {baris.length > 0 && (
              <ul className="border border-[var(--line)] rounded-xl divide-y divide-[var(--line-soft)]">
                {baris.map((x, i) => (
                  <li key={x.batch.id} className="flex items-center gap-3 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--ink)] truncate">{x.batch.products?.nama_obat}</p>
                      <p className="text-[11px] text-[var(--ink-faint)] num">{x.batch.batch_number || '-'} · {t('stok', 'stock')} {angka(x.batch.stok_batch)}</p>
                    </div>
                    <input inputMode="numeric" value={x.qty} placeholder="0"
                      onChange={e => setBaris(prev => prev.map((y, j) => j === i ? { ...y, qty: e.target.value.replace(/[^\d]/g, '') } : y))}
                      aria-label={t(`Jumlah ${x.batch.products?.nama_obat}`, `Quantity ${x.batch.products?.nama_obat}`)}
                      className={INPUT + ' w-20 text-right num'} />
                    <button type="button" onClick={() => setBaris(prev => prev.filter((_, j) => j !== i))}
                      aria-label={t('Hapus baris', 'Remove row')} className="text-[var(--ink-faint)] hover:text-red-600"><X size={16} /></button>
                  </li>
                ))}
              </ul>
            )}
            <div>
              <label htmlFor="trf-catatan" className="block text-[13px] font-medium text-[var(--ink-mid)] mb-1.5">{t('Catatan (opsional)', 'Note (optional)')}</label>
              <input id="trf-catatan" value={catatan} onChange={e => setCatatan(e.target.value)} className={INPUT + ' w-full py-2.5'} />
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
