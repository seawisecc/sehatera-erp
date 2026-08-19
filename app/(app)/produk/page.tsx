'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Search, Eye, Pencil, Printer, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { useUmpan } from '@/components/Umpan'
import { pesanError } from '@/lib/session'
import { TBL_WRAP, TBL, THEAD, TH_L, TH_R, TH_C, TR, TD, KATEGORI_BADGE } from '@/lib/ui'
import { rupiah, angka } from '@/lib/format'
import DetailProduk from '@/components/produk/DetailProduk'
import { bukaCetak, labelRak } from '@/lib/cetak'
import TombolIkon from '@/components/TombolIkon'

/**
 * Produk & Stok: katalog obat apotek.
 *
 * Tiga hal ikut dibetulkan saat modul ini pindah:
 *
 * 1. Penambahan produk tidak pernah menyertakan company_id. Untuk pemilik
 *    apotek trigger database mengisinya dari sesi, tapi super admin tidak
 *    terikat apotek mana pun: produk yang ia tambahkan sambil "melihat sebagai"
 *    satu apotek mendarat tanpa pemilik, lalu tidak terlihat siapa pun. Sama
 *    persis dengan yang sudah dibetulkan di Supplier.
 * 2. Simpan dan Edit tidak pernah melaporkan kegagalan. Keduanya `if (!error)`
 *    tanpa cabang lain, jadi saat kuota paket menolak (SH002) formulirnya hanya
 *    diam tertutup, dan orang mengira produknya tersimpan.
 * 3. Nama obat tidak pernah divalidasi, jadi produk tanpa nama bisa masuk
 *    katalog dan muncul sebagai baris kosong di kasir.
 */

const KATEGORI: Record<string, string> = {
  bebas: 'Bebas', bebas_terbatas: 'Bebas Terbatas', keras: 'Keras',
  suplemen: 'Suplemen', psikotropika: 'Psikotropika', narkotika: 'Narkotika',
  prekursor: 'Prekursor', alkes: 'Alkes', lainnya: 'Lainnya',
}
const SATUAN = ['Tablet', 'Kapsul', 'Botol', 'Sachet', 'Tube', 'Ampul', 'Vial']

const FORM_KOSONG = {
  nama_obat: '', nama_generik: '', kandungan: '',
  kategori: 'bebas', satuan: 'Tablet', isi_kemasan: 1,
  harga_beli: 0, harga_jual: 0, stok_total: 0, stok_minimum: 10,
  barcode: '', rak: '',
}

export default function HalamanProduk() {
  const { t } = useLang()
  const { kabar, konfirmasi } = useUmpan()
  const app = useApp()
  const scope = app.scope

  const [produk, setProduk] = useState<any[]>([])
  const [batchAlert, setBatchAlert] = useState(0)
  const [memuat, setMemuat] = useState(true)
  const [sibuk, setSibuk] = useState(false)

  const [cari, setCari] = useState('')
  const [fKategori, setFKategori] = useState('')
  const [fStok, setFStok] = useState('')
  const [fStatus, setFStatus] = useState('')

  const [formBuka, setFormBuka] = useState(false)
  const [form, setForm] = useState(FORM_KOSONG)

  const [edit, setEdit] = useState<any>(null)
  const [editSuppliers, setEditSuppliers] = useState<any[]>([])
  const [semuaSupplier, setSemuaSupplier] = useState<any[]>([])
  const [cariSupplier, setCariSupplier] = useState('')

  const [detail, setDetail] = useState<any>(null)

  const muat = useCallback(async () => {
    setMemuat(true)
    const in60 = new Date(); in60.setDate(in60.getDate() + 60)
    const [{ data: p }, { count }] = await Promise.all([
      scope(supabase.from('products').select('*').order('kode')),
      scope(supabase.from('product_batches').select('*', { count: 'exact', head: true })
        .lte('expired_date', in60.toISOString().split('T')[0])
        .gt('stok_batch', 0)
        .is('ditindaklanjuti_pada', null)),
    ])
    setProduk(p || [])
    setBatchAlert(count || 0)
    setMemuat(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { muat() }, [muat])

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return produk.filter(p => {
      // Barcode ikut dicari. Pemindai genggam mengetik angkanya ke kotak yang
      // sedang fokus lalu menekan Enter, jadi kotak cari yang tidak mengenal
      // barcode membuat pemindai di meja gudang tidak berguna sama sekali.
      if (q && ![p.nama_obat, p.nama_generik, p.kandungan, p.kode, p.barcode, p.rak]
        .some((v: string) => (v || '').toLowerCase().includes(q))) return false
      if (fKategori && p.kategori !== fKategori) return false
      if (fStatus && (p.status || 'aktif') !== fStatus) return false
      if (fStok) {
        const stok = p.stok_total ?? 0, min = p.stok_minimum ?? 0
        if (fStok === 'habis' && stok > 0) return false
        if (fStok === 'minim' && !(stok > 0 && stok <= min)) return false
        if (fStok === 'aman' && !(stok > min)) return false
      }
      return true
    })
  }, [produk, cari, fKategori, fStok, fStatus])

  const simpanBaru = async () => {
    if (!form.nama_obat.trim()) { kabar(t('Nama obat wajib diisi.', 'Drug name is required.')); return }
    setSibuk(true)
    const { error } = await supabase.from('products').insert([{
      ...form,
      barcode: form.barcode.trim() || null,
      rak: form.rak.trim() || null,
      ...app.cid(),
    }])
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    setFormBuka(false)
    setForm(FORM_KOSONG)
    muat()
  }

  const bukaEdit = async (p: any) => {
    setEdit({ ...p })
    setCariSupplier('')
    const [{ data: ps }, { data: sup }] = await Promise.all([
      supabase.from('product_suppliers').select('*, suppliers(*)').eq('product_id', p.id),
      semuaSupplier.length ? Promise.resolve({ data: semuaSupplier }) : scope(supabase.from('suppliers').select('*').order('nama_supplier')),
    ])
    setEditSuppliers(ps || [])
    if (!semuaSupplier.length) setSemuaSupplier(sup || [])
  }

  const toggleSupplier = async (supplierId: string, aktif: boolean) => {
    if (!edit) return
    if (aktif) {
      await supabase.from('product_suppliers').delete().eq('product_id', edit.id).eq('supplier_id', supplierId)
    } else {
      const { error } = await supabase.from('product_suppliers')
        .insert([{ product_id: edit.id, supplier_id: supplierId, ...app.cid() }])
      if (error) { kabar(pesanError(error), 'galat'); return }
    }
    const { data } = await supabase.from('product_suppliers').select('*, suppliers(*)').eq('product_id', edit.id)
    setEditSuppliers(data || [])
  }

  const simpanEdit = async () => {
    if (!edit) return
    if (!String(edit.nama_obat || '').trim()) { kabar(t('Nama obat wajib diisi.', 'Drug name is required.')); return }
    setSibuk(true)
    const { error } = await supabase.from('products').update({
      nama_obat: edit.nama_obat, nama_generik: edit.nama_generik,
      kandungan: edit.kandungan, harga_beli: edit.harga_beli,
      harga_jual: edit.harga_jual, stok_total: edit.stok_total,
      stok_minimum: edit.stok_minimum,
      // Kosong disimpan sebagai null, bukan string kosong: indeks unik
      // barcode melewatkan null, dan dua produk berbarcode "" akan bertabrakan
      // padahal dua-duanya sebenarnya belum diisi.
      barcode: String(edit.barcode || '').trim() || null,
      rak: String(edit.rak || '').trim() || null,
    }).eq('id', edit.id)
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    setEdit(null); setEditSuppliers([]); setCariSupplier('')
    muat()
    if (detail && detail.id === edit.id) setDetail({ ...detail, ...edit })
  }

  /**
   * Label rak untuk produk yang SEDANG TERSARING, bukan seluruh katalog.
   *
   * Itu yang membuatnya berguna: saring per rak lalu cetak, atau saring "stok
   * habis" sesudah barang datang lalu cetak yang itu saja. Tombol yang selalu
   * mencetak 800 item adalah tombol yang tidak pernah ditekan dua kali.
   */
  const cetakLabel = async (daftar: any[]) => {
    if (daftar.length === 0) {
      kabar(t('Tidak ada produk yang cocok dengan saringan ini.', 'No products match this filter.'), 'galat')
      return
    }
    // Ambang 40 kira-kira dua lembar A4. Di atas itu orang biasanya belum
    // menyaring, dan kertas yang terlanjur keluar tidak bisa ditarik kembali.
    if (daftar.length > 40 && !await konfirmasi({
      judul: t(`Cetak ${daftar.length} label?`, `Print ${daftar.length} labels?`),
      pesan: t('Kira-kira sebanyak itu dibagi delapan label per lembar A4. Kalau yang kamu butuhkan cuma satu rak, saring dulu lewat kotak cari.',
               'That is roughly that many divided by eight labels per A4 sheet. If you only need one shelf, filter first using the search box.'),
      tombol: t('Cetak semua', 'Print all'),
    })) return

    const ok = bukaCetak(labelRak(app.settingsData || {}, daftar.map(x => ({
      nama_obat: x.nama_obat, nama_generik: x.nama_generik, kandungan: x.kandungan,
      satuan: x.satuan, harga_jual: x.harga_jual, kode: x.kode,
      barcode: x.barcode, rak: x.rak, kategori: x.kategori,
    }))), 1000, 800)
    if (!ok) kabar(t('Jendela cetak diblokir peramban. Izinkan popup untuk situs ini.',
                     'The print window was blocked. Allow popups for this site.'), 'galat')
  }

  const inputCls = 'w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const filterCls = 'border border-[var(--line)] bg-[var(--surface)] rounded-lg px-3 py-2.5 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-[var(--ink)] mb-1">{t('Produk & Stok', 'Products & Stock')}</h1>
          <p className="text-[var(--ink-soft)] text-sm">
            {t('Katalog obat dan perbekalan.', 'Catalogue of medicines and supplies.')}
            {' '}<span className="num">{angka(produk.length)}</span> {t('item terdaftar.', 'items registered.')}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button onClick={() => cetakLabel(tersaring)}
            className="inline-flex items-center gap-2 border border-[var(--line)] text-[var(--ink-soft)] px-3 py-2 rounded-lg text-sm hover:bg-[var(--surface-2)] transition">
            <Printer size={15} /> {t('Cetak label', 'Print labels')}
            <span className="num text-xs text-[var(--ink-faint)]">({angka(tersaring.length)})</span>
          </button>
          <button onClick={() => { setForm(FORM_KOSONG); setFormBuka(true) }}
            className="bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition">
            + {t('Tambah Produk', 'Add Product')}
          </button>
        </div>
      </div>

      {batchAlert > 0 && (
        <Link href="/tindak-lanjut"
          className="mb-6 flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition">
          <AlertTriangle size={18} className="shrink-0" />
          <span className="text-sm">
            <b className="num">{angka(batchAlert)} {t('batch', 'batches')}</b>{' '}
            {t('mendekati atau melewati kadaluarsa.', 'are nearing or past expiry.')}{' '}
            <span className="underline">{t('Buka Tindak Lanjut', 'Open Follow-up')}</span>
          </span>
        </Link>
      )}

      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
          <input
            value={cari} onChange={e => setCari(e.target.value)}
            placeholder={t('Cari nama obat, generik, kandungan, atau kode…', 'Search drug name, generic, ingredient, or code…')}
            className="w-full border border-[var(--line)] bg-[var(--surface)] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </div>
        <select value={fKategori} onChange={e => setFKategori(e.target.value)} className={filterCls}>
          <option value="">{t('Semua Kategori', 'All Categories')}</option>
          {Object.keys(KATEGORI).map(k => <option key={k} value={k}>{KATEGORI[k]}</option>)}
        </select>
        <select value={fStok} onChange={e => setFStok(e.target.value)} className={filterCls}>
          <option value="">{t('Semua Stok', 'All Stock')}</option>
          <option value="aman">{t('Stok Aman', 'Healthy')}</option>
          <option value="minim">{t('Stok Minim', 'Low')}</option>
          <option value="habis">{t('Stok Habis', 'Out of stock')}</option>
        </select>
        <select value={fStatus} onChange={e => setFStatus(e.target.value)} className={filterCls}>
          <option value="">{t('Semua Status', 'All Status')}</option>
          <option value="aktif">{t('Aktif', 'Active')}</option>
          <option value="nonaktif">{t('Nonaktif', 'Inactive')}</option>
        </select>
        {(cari || fKategori || fStok || fStatus) && (
          <button onClick={() => { setCari(''); setFKategori(''); setFStok(''); setFStatus('') }}
            className="px-3 py-2.5 rounded-lg text-sm text-[var(--ink-soft)] border border-[var(--line)] hover:bg-[var(--surface-2)] whitespace-nowrap">
            {t('Reset', 'Reset')}
          </button>
        )}
      </div>

      <div className={TBL_WRAP}>
        <table className={TBL}>
          <thead className={THEAD}>
            <tr>
              <th className={TH_L}>{t('Kode', 'Code')}</th>
              <th className={TH_L}>{t('Nama Obat', 'Drug Name')}</th>
              <th className={TH_L}>{t('Kategori', 'Category')}</th>
              <th className={TH_L}>{t('Satuan', 'Unit')}</th>
              <th className={TH_R}>{t('H. Jual', 'Sell Price')}</th>
              <th className={TH_C}>{t('Stok', 'Stock')}</th>
              <th className={TH_C}>Status</th>
              <th className={TH_R}>{t('Aksi', 'Action')}</th>
            </tr>
          </thead>
          <tbody>
            {memuat ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</td></tr>
            ) : tersaring.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-[var(--ink-faint)]">
                {produk.length === 0
                  ? t('Belum ada produk. Tambahkan yang pertama lewat tombol di atas.', 'No products yet. Add the first one with the button above.')
                  : t('Tidak ada produk yang cocok dengan saringan ini.', 'No products match this filter.')}
              </td></tr>
            ) : tersaring.map(p => {
              const habis = (p.stok_total ?? 0) <= 0
              const minim = !habis && (p.stok_total ?? 0) <= (p.stok_minimum ?? 0)
              const stokCls = habis
                ? 'bg-red-50 text-red-600 ring-1 ring-red-500/20'
                : minim ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-500/20'
                : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20'
              return (
                <tr key={p.id} className={TR}>
                  <td className={TD}><span className="num text-xs text-[var(--ink-faint)]">{p.kode}</span></td>
                  <td className={TD}>
                    <div className="font-medium text-[var(--ink)] leading-tight">{p.nama_obat}</div>
                    {p.nama_generik && <div className="text-xs text-[var(--ink-faint)] leading-tight mt-0.5">{p.nama_generik}</div>}
                  </td>
                  <td className={TD}>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${KATEGORI_BADGE[p.kategori] || KATEGORI_BADGE.lainnya}`}>
                      {KATEGORI[p.kategori] || p.kategori}
                    </span>
                  </td>
                  <td className={TD + ' text-[var(--ink-soft)]'}>{p.satuan}</td>
                  <td className={TD + ' text-right font-medium text-[var(--ink)] num whitespace-nowrap'}>{rupiah(p.harga_jual)}</td>
                  <td className={TD + ' text-center'}>
                    <span className={`inline-block min-w-[2.25rem] px-2 py-0.5 rounded-full text-xs font-semibold num ${stokCls}`}>
                      {angka(p.stok_total)}
                    </span>
                  </td>
                  <td className={TD + ' text-center'}>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${p.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'aktif' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {p.status === 'aktif' ? t('Aktif', 'Active') : t('Nonaktif', 'Inactive')}
                    </span>
                  </td>
                  <td className={TD + ' text-right whitespace-nowrap'}>
                    <div className="inline-flex items-center gap-1.5">
                      <TombolIkon label={t('Lihat detail & batch', 'View details & batches')}
                        onClick={() => setDetail(p)}>
                        <Eye size={14} />
                      </TombolIkon>
                      <TombolIkon label={t('Cetak label rak', 'Print shelf label')}
                        onClick={e => { e.stopPropagation(); cetakLabel([p]) }}>
                        <Tag size={14} />
                      </TombolIkon>
                      <TombolIkon label={t('Ubah data produk', 'Edit product')}
                        onClick={() => bukaEdit(p)}>
                        <Pencil size={14} />
                      </TombolIkon>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Tambah produk ── */}
      {formBuka && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[var(--brand)] mb-4">{t('Tambah Produk Baru', 'Add New Product')}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Nama Obat *', 'Drug Name *')}</label>
                  <input autoFocus value={form.nama_obat} onChange={e => setForm({ ...form, nama_obat: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Nama Generik', 'Generic Name')}</label>
                  <input value={form.nama_generik} onChange={e => setForm({ ...form, nama_generik: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Kandungan / Komposisi', 'Ingredient / Composition')}</label>
                <input value={form.kandungan} onChange={e => setForm({ ...form, kandungan: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">Barcode</label>
                  {/* Diisi dengan MEMINDAI dusnya, bukan diketik. Pemindai
                      genggam berlaku seperti papan ketik: ia mengetik angkanya
                      lalu menekan Enter, jadi kotak ini cukup difokuskan. */}
                  <input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })}
                    placeholder={t('Pindai dus obatnya', 'Scan the box')} className={inputCls + ' num'} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Rak', 'Shelf')}</label>
                  <input value={form.rak} onChange={e => setForm({ ...form, rak: e.target.value })}
                    placeholder={t('mis. A3-2', 'e.g. A3-2')} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Kategori', 'Category')}</label>
                  <select value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })} className={inputCls}>
                    {Object.keys(KATEGORI).map(k => <option key={k} value={k}>{KATEGORI[k]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Satuan', 'Unit')}</label>
                  <select value={form.satuan} onChange={e => setForm({ ...form, satuan: e.target.value })} className={inputCls}>
                    {SATUAN.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Harga Beli', 'Buy Price')}</label>
                  <input type="number" min={0} value={form.harga_beli}
                    onChange={e => setForm({ ...form, harga_beli: +e.target.value })} className={inputCls + ' num'} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Harga Jual', 'Sell Price')}</label>
                  <input type="number" min={0} value={form.harga_jual}
                    onChange={e => setForm({ ...form, harga_jual: +e.target.value })} className={inputCls + ' num'} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Stok Awal', 'Opening Stock')}</label>
                  <input type="number" min={0} value={form.stok_total}
                    onChange={e => setForm({ ...form, stok_total: +e.target.value })} className={inputCls + ' num'} />
                </div>
              </div>
              <p className="text-[11px] text-[var(--ink-faint)] leading-relaxed">
                {t('Stok awal masuk sebagai angka produk saja, tanpa nomor batch dan tanggal kadaluarsa. Untuk obat yang perlu ditelusuri, catat lewat Pembelian supaya batchnya ikut tercatat.',
                   'Opening stock is recorded as a product figure only, with no batch number or expiry date. For traceable medicines, record it through Purchasing so the batch is captured too.')}
              </p>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setFormBuka(false)} className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
                {t('Batal', 'Cancel')}
              </button>
              <button onClick={simpanBaru} disabled={sibuk}
                className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                {sibuk ? t('Menyimpan…', 'Saving…') : t('Simpan Produk', 'Save Product')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit produk ── */}
      {edit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[55] p-4" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[var(--brand)] mb-4">
              {t('Edit Produk', 'Edit Product')} <span className="num text-sm text-[var(--ink-soft)]">{edit.kode}</span>
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Nama Obat *', 'Drug Name *')}</label>
                  <input value={edit.nama_obat || ''} onChange={e => setEdit({ ...edit, nama_obat: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Nama Generik', 'Generic Name')}</label>
                  <input value={edit.nama_generik || ''} onChange={e => setEdit({ ...edit, nama_generik: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Kandungan', 'Ingredient')}</label>
                <input value={edit.kandungan || ''} onChange={e => setEdit({ ...edit, kandungan: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">Barcode</label>
                  <input value={edit.barcode || ''} onChange={e => setEdit({ ...edit, barcode: e.target.value })}
                    placeholder={t('Pindai dus obatnya', 'Scan the box')} className={inputCls + ' num'} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Rak', 'Shelf')}</label>
                  <input value={edit.rak || ''} onChange={e => setEdit({ ...edit, rak: e.target.value })}
                    placeholder={t('mis. A3-2', 'e.g. A3-2')} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Harga Beli', 'Buy Price')}</label>
                  <input type="number" min={0} value={edit.harga_beli ?? 0}
                    onChange={e => setEdit({ ...edit, harga_beli: +e.target.value })} className={inputCls + ' num'} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Harga Jual', 'Sell Price')}</label>
                  <input type="number" min={0} value={edit.harga_jual ?? 0}
                    onChange={e => setEdit({ ...edit, harga_jual: +e.target.value })} className={inputCls + ' num'} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Stok', 'Stock')}</label>
                  <input type="number" min={0} value={edit.stok_total ?? 0}
                    onChange={e => setEdit({ ...edit, stok_total: +e.target.value })} className={inputCls + ' num'} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Stok Minimum', 'Min Stock')}</label>
                  <input type="number" min={0} value={edit.stok_minimum ?? 0}
                    onChange={e => setEdit({ ...edit, stok_minimum: +e.target.value })} className={inputCls + ' num'} />
                </div>
              </div>

              {edit.stok_total !== produk.find(p => p.id === edit.id)?.stok_total && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
                  {t('Kamu mengubah stok langsung. Ini penyesuaian manual: jumlah batch tidak ikut berubah, jadi angkanya bisa berbeda dari yang dibaca laporan SIPNAP. Untuk barang masuk pakai Pembelian, untuk barang keluar pakai Tindak Lanjut.',
                     'You are editing stock directly. This is a manual adjustment: batch totals do not follow, so the figure can diverge from what SIPNAP reads. Use Purchasing for goods in and Follow-up for goods out.')}
                </p>
              )}

              <div className="border-t border-[var(--line-soft)] pt-3">
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-2 block">
                  {t('Supplier Produk Ini', 'Suppliers for this Product')}{' '}
                  <span className="text-[var(--ink-faint)]">({editSuppliers.length} {t('dipilih', 'selected')})</span>
                </label>
                {semuaSupplier.length === 0 ? (
                  <p className="text-xs text-[var(--ink-faint)]">
                    {t('Belum ada supplier. Tambahkan dulu di menu Supplier.', 'No suppliers yet. Add them under Suppliers first.')}
                  </p>
                ) : (
                  <>
                    <div className="relative mb-2">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
                      <input value={cariSupplier} onChange={e => setCariSupplier(e.target.value)}
                        placeholder={t('Cari supplier…', 'Search supplier…')} className={inputCls + ' pl-9'} />
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {semuaSupplier.filter(s => {
                        const q = cariSupplier.trim().toLowerCase()
                        return !q || `${s.nama_supplier} ${s.kode} ${s.jenis}`.toLowerCase().includes(q)
                      }).map(s => {
                        const aktif = editSuppliers.some(ps => ps.supplier_id === s.id)
                        return (
                          <button key={s.id} onClick={() => toggleSupplier(s.id, aktif)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition text-left ${
                              aktif ? 'border-[var(--brand)] bg-[var(--surface-2)]' : 'border-[var(--line)] hover:bg-[var(--surface-2)]'}`}>
                            <div>
                              <div className="text-sm font-medium text-[var(--ink)]">{s.nama_supplier}</div>
                              <div className="text-xs text-[var(--ink-faint)]">{s.jenis} · <span className="num">{s.kode}</span></div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              aktif ? 'border-[var(--brand)] bg-[var(--brand)]' : 'border-[var(--line)]'}`}>
                              {aktif && <div className="w-2 h-2 rounded-full bg-[var(--surface)]" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setEdit(null); setEditSuppliers([]); setCariSupplier('') }}
                className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
                {t('Batal', 'Cancel')}
              </button>
              <button onClick={simpanEdit} disabled={sibuk}
                className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                {sibuk ? t('Menyimpan…', 'Saving…') : t('Simpan Perubahan', 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <DetailProduk
          produk={detail}
          profil={app.settingsData}
          namaApoteker={app.settingsData?.nama_apoteker}
          onTutup={() => setDetail(null)}
          onEdit={p => bukaEdit(p)}
          onBerubah={muat}
        />
      )}
    </div>
  )
}
