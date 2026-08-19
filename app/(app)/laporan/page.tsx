'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Printer } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { pesanError } from '@/lib/session'
import { TBL_WRAP, TBL, THEAD, TH_L, TH_R, TH_C, TR, TD } from '@/lib/ui'
import { rupiah, angka, tanggalJam } from '@/lib/format'
import { bukaCetak, laporanSipnap, type BarisSipnap } from '@/lib/cetak'

/**
 * Laporan: penjualan, rekap metode bayar, dan SIPNAP.
 *
 * Dua hal ikut dibetulkan saat modul ini keluar dari monolit.
 *
 * 1. Pembatalan transaksi. Kodenya membaca stok tiap produk, menjumlahkannya
 *    dengan jumlah yang dijual, lalu menulisnya kembali, satu produk per
 *    permintaan HTTP, dari peramban. Dua orang membatalkan bersamaan berarti
 *    yang kedua menimpa hasil yang pertama. Dan `stok_batch` tidak pernah ikut
 *    dikembalikan, padahal angka batch itulah yang dibaca laporan SIPNAP.
 *    Sekarang lewat `cancel_transaction()`, satu transaksi database.
 * 2. Templat cetak SIPNAP. Nama obat dan nama pasien ditempel mentah ke HTML.
 *    Sudah pindah ke `lib/cetak.ts` yang meloloskan karakter HTML.
 */

const METODE = ['Tunai', 'QRIS', 'Transfer', 'Debit', 'Kartu Kredit'] as const
const IKON: Record<string, string> = { Tunai: '💵', QRIS: '📱', Transfer: '🏦', Debit: '💳', 'Kartu Kredit': '💳' }
const LABEL_PENJAMIN: Record<string, string> = { umum: 'Umum', bpjs: 'BPJS', asuransi: 'Asuransi' }
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export default function HalamanLaporan() {
  const { t } = useLang()
  const app = useApp()

  const [tab, setTab] = useState<'penjualan' | 'metode' | 'penjamin' | 'sipnap'>('penjualan')
  const [penjamin, setPenjamin] = useState<any[]>([])
  const [muatPenjamin, setMuatPenjamin] = useState(false)
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [memuat, setMemuat] = useState(true)

  const [dari, setDari] = useState('')
  const [sampai, setSampai] = useState('')
  const [metode, setMetode] = useState('')
  const [status, setStatus] = useState('')

  const [detail, setDetail] = useState<any>(null)
  const [detailItems, setDetailItems] = useState<any[]>([])
  const [sibuk, setSibuk] = useState(false)

  const [sipnap, setSipnap] = useState({
    golongan: 'narkotika',
    bulan: new Date().getMonth() + 1,
    tahun: new Date().getFullYear(),
  })

  const scope = app.scope

  const muat = useCallback(async () => {
    setMemuat(true)
    const { data } = await scope(supabase.from('transactions').select('*').order('created_at', { ascending: false }))
    setRiwayat(data || [])
    setMemuat(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { muat() }, [muat])

  /**
   * Rekap per penjamin dibaca lewat RPC, bukan dijumlahkan di peramban dari
   * `riwayat`. Bukan soal kerapian: daftar itu diambil tanpa batas tanggal,
   * jadi menjumlahkannya di layar berarti angka laporan bergantung pada berapa
   * baris yang kebetulan sudah termuat. Uang tidak boleh begitu.
   */
  useEffect(() => {
    if (tab !== 'penjamin') return
    let batal = false
    ;(async () => {
      setMuatPenjamin(true)
      const { data } = await supabase.rpc('laporan_penjamin', {
        p_dari: dari || '1900-01-01',
        p_sampai: sampai || '2999-12-31',
        p_company: app.superViewCompany || null,
      })
      if (!batal) { setPenjamin((data as any[]) || []); setMuatPenjamin(false) }
    })()
    return () => { batal = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, dari, sampai, app.superViewCompany])

  useEffect(() => {
    if (!detail) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setDetail(null); setDetailItems([]) } }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [detail])

  const totalPenjamin = useMemo(() => penjamin.reduce((a, r) => ({
    tunai:  a.tunai  + Number(r.diterima_tunai || 0),
    tagih:  a.tagih  + Number(r.ditagihkan || 0),
    total:  a.total  + Number(r.total || 0),
    jumlah: a.jumlah + Number(r.jumlah_transaksi || 0),
  }), { tunai: 0, tagih: 0, total: 0, jumlah: 0 }), [penjamin])

  const tersaring = useMemo(() => riwayat.filter(x => {
    const d = (x.created_at || '').split('T')[0]
    if (dari && d < dari) return false
    if (sampai && d > sampai) return false
    if (metode && (x.metode_bayar || 'Tunai') !== metode) return false
    if (status && (x.status || 'selesai') !== status) return false
    return true
  }), [riwayat, dari, sampai, metode, status])

  const bukaDetail = async (trx: any) => {
    const { data } = await supabase.from('transaction_items').select('*').eq('transaction_id', trx.id)
    setDetailItems(data || [])
    setDetail(trx)
  }

  /**
   * Membatalkan penjualan.
   *
   * Semua pengembalian stok dikerjakan `cancel_transaction()` di database,
   * bukan di sini. Sebelumnya halaman ini menulis balik stok tiap produk satu
   * per satu dari peramban: kalau jaringan putus di tengah, sebagian stok
   * kembali dan sebagian tidak, dan transaksinya tetap berstatus selesai.
   */
  const batalkan = async (trx: any) => {
    const pesan = t(
      `Batalkan transaksi ${trx.nomor_transaksi}? Stok obat dan stok batch akan dikembalikan.`,
      `Cancel transaction ${trx.nomor_transaksi}? Product and batch stock will be restored.`,
    )
    if (!confirm(pesan)) return
    setSibuk(true)
    const { data, error } = await supabase.rpc('cancel_transaction', { p_transaction_id: trx.id })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }
    muat()
    const catatan = (data as any)?.catatan_pembatalan
    alert(catatan
      ? t('Transaksi dibatalkan. ', 'Transaction cancelled. ') + catatan
      : t('Transaksi dibatalkan, stok dikembalikan.', 'Transaction cancelled, stock restored.'))
  }

  const cetakSipnap = async () => {
    const { golongan, bulan, tahun } = sipnap
    const awalBulan = new Date(tahun, bulan - 1, 1)
    const akhirBulan = new Date(tahun, bulan, 1)
    const diBulanIni = (d: any) => { const x = new Date(d); return x >= awalBulan && x < akhirBulan }
    const sebelum = (d: any) => new Date(d) < awalBulan
    const fmt = (d: any) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
    const fmtED = (d: any) => d ? new Date(d).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '-'

    const { data: prods } = await scope(
      supabase.from('products').select('*').eq('kategori', golongan).order('nama_obat')
    )
    if (!prods || prods.length === 0) {
      alert(t('Belum ada produk berkategori ', 'No products in category ') + golongan + '.')
      return
    }
    const ids = prods.map((p: any) => p.id)

    const { data: penerimaan } = await supabase.from('po_items')
      .select('product_id, qty_terima, purchase_orders(tanggal_terima, suppliers(nama_supplier))').in('product_id', ids)
    const { data: pengeluaran } = await supabase.from('transaction_items')
      .select('product_id, jumlah, transactions(created_at, nama_pasien, alamat_pasien, kontak_pasien, nomor_resep, status)').in('product_id', ids)
    const { data: batches } = await supabase.from('product_batches')
      .select('product_id, batch_number, expired_date').in('product_id', ids)

    const baris: BarisSipnap[] = prods.map((p: any) => {
      const masukSemua = (penerimaan || []).filter((r: any) => r.product_id === p.id && r.purchase_orders?.tanggal_terima)
      const keluarSemua = (pengeluaran || []).filter((r: any) =>
        r.product_id === p.id && r.transactions?.status !== 'dibatalkan' && r.transactions?.created_at)

      const awal =
        masukSemua.filter((r: any) => sebelum(r.purchase_orders.tanggal_terima)).reduce((a: number, r: any) => a + (r.qty_terima || 0), 0) -
        keluarSemua.filter((r: any) => sebelum(r.transactions.created_at)).reduce((a: number, r: any) => a + (r.jumlah || 0), 0)

      return {
        nama: p.nama_obat,
        satuan: p.satuan,
        awal,
        masuk: masukSemua.filter((r: any) => diBulanIni(r.purchase_orders.tanggal_terima)).map((r: any) => ({
          tgl: fmt(r.purchase_orders.tanggal_terima),
          sumber: r.purchase_orders?.suppliers?.nama_supplier || '-',
          jml: r.qty_terima || 0,
        })),
        keluar: keluarSemua.filter((r: any) => diBulanIni(r.transactions.created_at)).map((r: any) => ({
          tgl: fmt(r.transactions.created_at),
          resep: r.transactions?.nomor_resep || '-',
          pasien: [r.transactions?.nama_pasien, r.transactions?.alamat_pasien, r.transactions?.kontak_pasien]
            .filter(Boolean).join(' / ') || '-',
          jml: r.jumlah || 0,
        })),
        batch: (batches || []).filter((b: any) => b.product_id === p.id)
          .map((b: any) => `${b.batch_number || '-'} (ED ${fmtED(b.expired_date)})`),
      }
    })

    const ok = bukaCetak(laporanSipnap(app.settingsData, sipnap, baris), 1200, 800)
    if (!ok) alert(t('Jendela cetak diblokir peramban. Izinkan pop-up untuk situs ini.', 'The print window was blocked. Allow pop-ups for this site.'))
  }

  const rekap = useMemo(() => {
    const aktif = tersaring.filter(x => x.status !== 'dibatalkan')
    const rows = METODE.map(m => {
      const r = aktif.filter(x => (x.metode_bayar || 'Tunai') === m)
      return { metode: m as string, count: r.length, total: r.reduce((a, b) => a + (b.total || 0), 0) }
    })
    return {
      rows,
      grand: rows.reduce((a, b) => a + b.total, 0),
      grandCount: rows.reduce((a, b) => a + b.count, 0),
    }
  }, [tersaring])

  const omzet = tersaring.filter(x => x.status !== 'dibatalkan').reduce((a, b) => a + (b.total || 0), 0)
  const inputCls = 'border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const KARTU = 'bg-[var(--surface)]/70 backdrop-blur-sm border border-[var(--line)] rounded-2xl shadow-sm'

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--ink)] mb-1">{t('Laporan', 'Reports')}</h1>
      <p className="text-[var(--ink-soft)] text-sm mb-5">
        {t('Laporan penjualan dan laporan SIPNAP (Narkotika, Psikotropika, Prekursor)',
           'Sales reports and SIPNAP reports (Narcotics, Psychotropics, Precursors)')}
      </p>

      <div className="flex gap-1 mb-5">
        {([
          { id: 'penjualan', label: t('Penjualan', 'Sales') },
          { id: 'metode', label: t('Metode Bayar', 'Payment Methods') },
          ...(app.sektor !== 'apotek' ? [{ id: 'penjamin' as const, label: t('Penjamin', 'Payers') }] : []),
          { id: 'sipnap', label: 'SIPNAP' },
        ] as const).map(x => (
          <button key={x.id} onClick={() => setTab(x.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === x.id ? 'bg-[var(--brand)] text-[var(--on-brand)]' : 'text-[var(--ink-soft)] hover:bg-[var(--surface)]/60'}`}>
            {x.label}
          </button>
        ))}
      </div>

      {(tab === 'penjualan' || tab === 'metode' || tab === 'penjamin') && (
        <div className={`${KARTU} mb-5 flex flex-wrap items-end gap-3 p-3`}>
          <div>
            <label className="text-[11px] font-medium text-[var(--ink-soft)] mb-1 block uppercase tracking-wide">{t('Dari Tgl', 'From')}</label>
            <input type="date" value={dari} onChange={e => setDari(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-[11px] font-medium text-[var(--ink-soft)] mb-1 block uppercase tracking-wide">{t('Sampai Tgl', 'To')}</label>
            <input type="date" value={sampai} onChange={e => setSampai(e.target.value)} className={inputCls} />
          </div>
          {tab !== 'penjamin' && (<div>
            <label className="text-[11px] font-medium text-[var(--ink-soft)] mb-1 block uppercase tracking-wide">{t('Metode', 'Method')}</label>
            <select value={metode} onChange={e => setMetode(e.target.value)} className={inputCls}>
              <option value="">{t('Semua', 'All')}</option>
              {METODE.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>)}
          {tab !== 'penjamin' && (<div>
            <label className="text-[11px] font-medium text-[var(--ink-soft)] mb-1 block uppercase tracking-wide">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
              <option value="">{t('Semua', 'All')}</option>
              <option value="selesai">{t('Selesai', 'Completed')}</option>
              <option value="dibatalkan">{t('Dibatalkan', 'Cancelled')}</option>
            </select>
          </div>)}
          {(dari || sampai || metode || status) && (
            <button onClick={() => { setDari(''); setSampai(''); setMetode(''); setStatus('') }}
              className="px-3 py-2 rounded-lg text-sm text-[var(--ink-soft)] border border-[var(--line)] hover:bg-[var(--surface-2)]">
              {t('Reset', 'Reset')}
            </button>
          )}
        </div>
      )}

      {tab === 'penjamin' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className={`${KARTU} p-4`}>
              <p className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wide mb-2">{t('Diterima tunai', 'Received in cash')}</p>
              <p className="text-2xl font-bold text-[var(--ink)] num leading-none">{rupiah(totalPenjamin.tunai)}</p>
              <p className="text-xs text-[var(--ink-faint)] mt-1.5">{t('Yang harus ada di laci', 'What should be in the till')}</p>
            </div>
            <div className={`${KARTU} p-4`}>
              <p className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wide mb-2">{t('Ditagihkan ke penjamin', 'Billed to payers')}</p>
              <p className="text-2xl font-bold text-[var(--accent)] num leading-none">{rupiah(totalPenjamin.tagih)}</p>
              <p className="text-xs text-[var(--ink-faint)] mt-1.5">{t('Piutang, belum jadi uang', 'Receivable, not yet money')}</p>
            </div>
            <div className={`${KARTU} p-4`}>
              <p className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wide mb-2">{t('Nilai pelayanan', 'Service value')}</p>
              <p className="text-2xl font-bold text-[var(--ink)] num leading-none">{rupiah(totalPenjamin.total)}</p>
              <p className="text-xs text-[var(--ink-faint)] mt-1.5">{angka(totalPenjamin.jumlah)} {t('transaksi', 'transactions')}</p>
            </div>
          </div>

          <div className={TBL_WRAP}>
            <table className={TBL}>
              <thead className={THEAD}>
                <tr>
                  <th className={TH_L}>{t('Penjamin', 'Payer')}</th>
                  <th className={TH_C}>{t('Jumlah Transaksi', 'Transactions')}</th>
                  <th className={TH_R}>{t('Nilai Pelayanan', 'Service Value')}</th>
                  <th className={TH_R}>{t('Diterima Tunai', 'Received in Cash')}</th>
                  <th className={TH_R}>{t('Ditagihkan', 'Billed')}</th>
                </tr>
              </thead>
              <tbody>
                {muatPenjamin && (
                  <tr><td className={TD + ' text-center text-[var(--ink-faint)]'} colSpan={5}>{t('Memuat...', 'Loading...')}</td></tr>
                )}
                {!muatPenjamin && penjamin.length === 0 && (
                  <tr><td className={TD + ' text-center text-[var(--ink-faint)]'} colSpan={5}>
                    {t('Belum ada transaksi pada rentang ini.', 'No transactions in this range.')}
                  </td></tr>
                )}
                {penjamin.map((r, i) => (
                  <tr key={i} className={TR}>
                    <td className={TD + ' font-medium text-[var(--ink)]'}>
                      {LABEL_PENJAMIN[r.penjamin] || r.penjamin}
                      {r.asuransi && <span className="text-[var(--ink-soft)]"> &middot; {r.asuransi}</span>}
                    </td>
                    <td className={TD + ' text-center text-[var(--ink-soft)] num'}>{angka(r.jumlah_transaksi)}</td>
                    <td className={TD + ' text-right text-[var(--ink-soft)] num'}>{rupiah(r.total)}</td>
                    <td className={TD + ' text-right font-medium text-[var(--ink)] num'}>{rupiah(r.diterima_tunai)}</td>
                    <td className={TD + ' text-right font-medium num ' + (Number(r.ditagihkan) > 0 ? 'text-[var(--accent)]' : 'text-[var(--ink-faint)]')}>
                      {rupiah(r.ditagihkan)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-[var(--ink-faint)] mt-3 leading-relaxed">
            {t('Yang ditagihkan ke penjamin belum menjadi uang. Kolom yang harus cocok dengan isi laci kasir adalah Diterima Tunai.',
               'What is billed to a payer is not money yet. The column that must match the cash drawer is Received in Cash.')}
          </p>
        </div>
      )}

      {tab === 'metode' && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            {rekap.rows.map(r => (
              <div key={r.metode} className={`${KARTU} p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{IKON[r.metode]}</span>
                  <span className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wide">{r.metode}</span>
                </div>
                <p className="text-lg font-bold text-[var(--ink)] num leading-none">{rupiah(r.total)}</p>
                <p className="text-xs text-[var(--ink-faint)] mt-1.5">{angka(r.count)} {t('transaksi', 'transactions')}</p>
                {rekap.grand > 0 && (
                  <div className="mt-2 h-1.5 rounded-full bg-[var(--paper)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--brand-soft)]" style={{ width: `${(r.total / rekap.grand) * 100}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={TBL_WRAP}>
            <table className={TBL}>
              <thead className={THEAD}>
                <tr>
                  <th className={TH_L}>{t('Metode Pembayaran', 'Payment Method')}</th>
                  <th className={TH_C}>{t('Jumlah Transaksi', 'Transactions')}</th>
                  <th className={TH_R}>{t('Total Diterima', 'Total Received')}</th>
                  <th className={TH_R}>{t('% dari Total', '% of Total')}</th>
                </tr>
              </thead>
              <tbody>
                {rekap.rows.map(r => (
                  <tr key={r.metode} className={TR}>
                    <td className={TD + ' font-medium text-[var(--ink)]'}>{IKON[r.metode]} {r.metode}</td>
                    <td className={TD + ' text-center text-[var(--ink-soft)] num'}>{angka(r.count)}</td>
                    <td className={TD + ' text-right font-medium text-[var(--ink)] num'}>{rupiah(r.total)}</td>
                    <td className={TD + ' text-right text-[var(--ink-soft)] num'}>{rekap.grand ? ((r.total / rekap.grand) * 100).toFixed(1) : '0,0'}%</td>
                  </tr>
                ))}
                <tr className="bg-[var(--surface-2)] border-t-2 border-[var(--brand)]">
                  <td className={TD + ' font-bold text-[var(--brand)]'}>TOTAL</td>
                  <td className={TD + ' text-center font-bold text-[var(--brand)] num'}>{angka(rekap.grandCount)}</td>
                  <td className={TD + ' text-right font-bold text-[var(--brand)] num'}>{rupiah(rekap.grand)}</td>
                  <td className={TD + ' text-right font-bold text-[var(--brand)]'}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--ink-faint)] mt-3">
            {t('Rekap uang masuk per metode pembayaran (transaksi dibatalkan tidak dihitung). Gunakan untuk mencocokkan uang tunai dan saldo QRIS/transfer dengan fisik.',
               'Money-in recap per payment method (cancelled transactions excluded). Use it to reconcile cash and QRIS/transfer balances with actuals.')}
          </p>
        </div>
      )}

      {tab === 'sipnap' && (
        <div className={`${KARTU} p-6 max-w-2xl`}>
          <h2 className="text-lg font-bold text-[var(--ink)] mb-1">Laporan SIPNAP</h2>
          <p className="text-sm text-[var(--ink-soft)] mb-5">
            {t('Pilih golongan dan periode. Penerimaan diambil dari pembelian supplier, pengeluaran dari transaksi beserta data pasien dan nomor resep.',
               'Choose the class and period. Receipts come from supplier purchases, dispensing from transactions along with patient data and prescription numbers.')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Golongan', 'Class')}</label>
              <select value={sipnap.golongan} onChange={e => setSipnap({ ...sipnap, golongan: e.target.value })} className={inputCls + ' w-full'}>
                <option value="narkotika">Narkotika</option>
                <option value="psikotropika">Psikotropika</option>
                <option value="prekursor">Prekursor</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Bulan', 'Month')}</label>
              <select value={sipnap.bulan} onChange={e => setSipnap({ ...sipnap, bulan: +e.target.value })} className={inputCls + ' w-full'}>
                {BULAN.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Tahun', 'Year')}</label>
              <input type="number" value={sipnap.tahun} onChange={e => setSipnap({ ...sipnap, tahun: +e.target.value })} className={inputCls + ' w-full num'} />
            </div>
          </div>
          <button onClick={cetakSipnap}
            className="inline-flex items-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition">
            <Printer size={15} /> {t('Cetak Laporan SIPNAP', 'Print SIPNAP Report')}
          </button>
          <p className="text-xs text-[var(--ink-faint)] mt-3">
            {t('Tanda tangan hanya oleh Apoteker Penanggung Jawab (APJ). Pastikan Nama Apoteker dan SIPA sudah diisi di Pengaturan, Data Apoteker.',
               'Signed only by the pharmacist in charge. Make sure the pharmacist name and SIPA number are filled in under Settings, Pharmacist Data.')}
          </p>
        </div>
      )}

      {tab === 'penjualan' && (
        <>
          <div className={TBL_WRAP}>
            <table className={TBL}>
              <thead className={THEAD}>
                <tr>
                  <th className={TH_L}>{t('No. Transaksi', 'Transaction No.')}</th>
                  <th className={TH_L}>{t('Waktu', 'Time')}</th>
                  <th className={TH_C}>{t('Metode', 'Method')}</th>
                  <th className={TH_R}>Total</th>
                  <th className={TH_R}>{t('Bayar', 'Paid')}</th>
                  <th className={TH_R}>{t('Kembalian', 'Change')}</th>
                  <th className={TH_C}>Status</th>
                  <th className={TH_C}>{t('Aksi', 'Action')}</th>
                </tr>
              </thead>
              <tbody>
                {memuat ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</td></tr>
                ) : tersaring.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-[var(--ink-faint)]">
                    {riwayat.length === 0
                      ? t('Belum ada transaksi', 'No transactions yet')
                      : t('Tidak ada yang cocok dengan saringan ini.', 'Nothing matches this filter.')}
                  </td></tr>
                ) : tersaring.map(trx => (
                  <tr key={trx.id} className={TR}>
                    <td className="px-4 py-3 num text-xs text-[var(--brand)] font-medium">{trx.nomor_transaksi}</td>
                    <td className="px-4 py-3 text-[var(--ink-soft)] num">{tanggalJam(trx.created_at)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--paper)] text-[var(--brand-soft)]">
                        {trx.metode_bayar || 'Tunai'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-[var(--brand)] num">{rupiah(trx.total)}</td>
                    <td className="px-4 py-3 text-right text-[var(--ink-soft)] num">{rupiah(trx.bayar)}</td>
                    <td className="px-4 py-3 text-right text-[var(--ink-soft)] num">{rupiah(trx.kembalian)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${trx.status === 'dibatalkan' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                        {trx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => bukaDetail(trx)} className="text-xs text-[var(--brand)] hover:underline font-medium">
                          Detail
                        </button>
                        {trx.status !== 'dibatalkan' && (
                          <>
                            <span className="text-[var(--line)]">|</span>
                            <button onClick={() => batalkan(trx)} disabled={sibuk}
                              className="text-xs text-red-500 hover:underline font-medium disabled:opacity-50">
                              {t('Batalkan', 'Cancel')}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {tersaring.length > 0 && (
            <div className={`${KARTU} mt-4 p-4 flex justify-between items-center`}>
              <span className="text-sm text-[var(--ink-soft)]">
                Total {angka(tersaring.length)} {t('transaksi', 'transactions')}
              </span>
              <span className="text-sm font-semibold text-[var(--brand)] num">
                {t('Total Omzet', 'Total Revenue')}: {rupiah(omzet)}
              </span>
            </div>
          )}
        </>
      )}

      {detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--brand)]">{t('Detail Transaksi', 'Transaction Details')}</h2>
                <p className="text-xs text-[var(--ink-soft)] num">{detail.nomor_transaksi}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${detail.status === 'dibatalkan' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                {detail.status === 'dibatalkan' ? t('dibatalkan', 'cancelled') : (detail.status || t('selesai', 'completed'))}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 p-4 bg-[var(--surface-2)] rounded-xl text-sm">
              <div>
                <p className="text-xs text-[var(--ink-soft)] mb-0.5">{t('Waktu', 'Time')}</p>
                <p className="font-medium text-[var(--brand)] num">{tanggalJam(detail.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--ink-soft)] mb-0.5">Total</p>
                <p className="font-bold text-[var(--brand)] num">{rupiah(detail.total)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--ink-soft)] mb-0.5">{t('Bayar', 'Paid')}</p>
                <p className="font-medium text-[var(--brand)] num">{rupiah(detail.bayar)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--ink-soft)] mb-0.5">{t('Kembalian', 'Change')}</p>
                <p className="font-medium text-[var(--brand)] num">{rupiah(detail.kembalian)}</p>
              </div>
            </div>

            {detail.catatan_pembatalan && (
              <p className="mb-4 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
                {detail.catatan_pembatalan}
              </p>
            )}

            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="bg-[var(--brand)]">
                  <th className="text-left px-3 py-2 text-xs text-[var(--on-brand)]">{t('Produk', 'Product')}</th>
                  <th className="text-center px-3 py-2 text-xs text-[var(--on-brand)]">Qty</th>
                  <th className="text-right px-3 py-2 text-xs text-[var(--on-brand)]">{t('Harga', 'Price')}</th>
                  <th className="text-right px-3 py-2 text-xs text-[var(--on-brand)]">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detailItems.map((item, i) => (
                  <tr key={i} className={TR}>
                    <td className="px-3 py-2 font-medium text-[var(--brand)]">{item.nama_obat}</td>
                    <td className="px-3 py-2 text-center text-[var(--ink-soft)] num">{angka(item.jumlah)}</td>
                    <td className="px-3 py-2 text-right text-[var(--ink-soft)] num">{rupiah(item.harga_jual)}</td>
                    <td className="px-3 py-2 text-right font-medium text-[var(--brand)] num">{rupiah(item.subtotal)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-[var(--brand)] bg-[var(--surface-2)]">
                  <td colSpan={3} className="px-3 py-2 font-bold text-sm text-[var(--brand)]">TOTAL</td>
                  <td className="px-3 py-2 text-right font-bold text-[var(--brand)] num">
                    {rupiah(detailItems.reduce((a, b) => a + (b.subtotal || 0), 0))}
                  </td>
                </tr>
              </tbody>
            </table>

            <button onClick={() => { setDetail(null); setDetailItems([]) }}
              className="w-full border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
              {t('Tutup', 'Close')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
