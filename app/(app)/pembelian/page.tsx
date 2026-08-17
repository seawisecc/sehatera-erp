'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Check, Pencil, Receipt, Truck, Wand2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { pesanError } from '@/lib/session'
import { TBL_WRAP, TBL, THEAD, TH_L, TH_R, TH_C, TR } from '@/lib/ui'
import { rupiah, angka, tanggal } from '@/lib/format'
import { bukaCetak, purchaseOrder } from '@/lib/cetak'

/**
 * Pembelian: purchase order ke supplier, dan penerimaan barangnya.
 *
 * Penerimaan barang pindah ke `receive_purchase_order()` di database. Bentuk
 * lamanya berjalan di peramban, satu permintaan HTTP per baris, dan membawa
 * empat kesalahan sekaligus: stok ditulis sebagai nilai mutlak dari angka yang
 * dibaca saat modal dibuka (penjualan yang terjadi sementara modal terbuka
 * terhapus), menerima sebagian lalu menerima lagi menambah stok dua kali, batch
 * yang sama di-INSERT berulang sehingga FEFO membaginya, dan batch yang
 * ditambahkan super admin mendarat tanpa company_id. Lihat migrasi 0010.
 */

const STATUS_WARNA: Record<string, string> = {
  draft:      'bg-yellow-100 text-yellow-700',
  dikirim:    'bg-blue-100 text-blue-700',
  selesai:    'bg-green-100 text-green-700',
  dibatalkan: 'bg-red-100 text-red-700',
}

type BarisTerima = {
  id: string
  product_id: string | null
  nama_produk: string
  satuan: string | null
  qty_pesan: number
  qty_terima: number
  batch_number: string
  expired_date: string
  harga_beli: number
}

export default function HalamanPembelian() {
  const { t } = useLang()
  const app = useApp()
  const scope = app.scope

  const [poList, setPoList] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [memuat, setMemuat] = useState(true)
  const [sibuk, setSibuk] = useState(false)

  // Order manual
  const [formPO, setFormPO] = useState(false)
  const [supplierPilihan, setSupplierPilihan] = useState<any>(null)
  const [produkSupplier, setProdukSupplier] = useState<any[]>([])
  const [itemPO, setItemPO] = useState<any[]>([])
  const [catatanPO, setCatatanPO] = useState('')

  // Order terpandu
  const [terpanduBuka, setTerpanduBuka] = useState(false)
  const [terpanduStep, setTerpanduStep] = useState(1)
  const [terpanduItems, setTerpanduItems] = useState<any[]>([])
  const [terpanduSibuk, setTerpanduSibuk] = useState(false)

  // Penerimaan
  const [terima, setTerima] = useState<any>(null)
  const [barisTerima, setBarisTerima] = useState<BarisTerima[]>([])
  const [faktur, setFaktur] = useState({
    nomor_faktur: '',
    tanggal_faktur: new Date().toISOString().split('T')[0],
    term_of_payment: 30,
  })

  const [detail, setDetail] = useState<any>(null)

  /** Super admin tanpa apotek terpilih tidak boleh membuat dokumen apa pun. */
  const terkunci = app.isSuper && !app.superViewCompany

  const muat = useCallback(async () => {
    setMemuat(true)
    const [{ data: po }, { data: sup }] = await Promise.all([
      scope(supabase.from('purchase_orders')
        .select('*, suppliers(nama_supplier, kode, alamat, telepon)')
        .order('created_at', { ascending: false })),
      scope(supabase.from('suppliers').select('*').order('nama_supplier')),
    ])
    setPoList(po || [])
    setSuppliers(sup || [])
    setMemuat(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { muat() }, [muat])

  // ── Order manual ──

  const muatProdukSupplier = async (supplierId: string) => {
    const { data } = await supabase.from('product_suppliers').select('*, products(*)').eq('supplier_id', supplierId)
    setProdukSupplier(data?.map((d: any) => d.products).filter(Boolean) || [])
  }

  const tambahItem = (p: any) => {
    if (itemPO.some(i => i.product_id === p.id)) return
    setItemPO([...itemPO, {
      product_id: p.id,
      nama_produk: p.nama_obat,
      satuan: p.satuan,
      qty_pesan: 1,
      harga_beli: p.harga_beli || 0,
      subtotal: p.harga_beli || 0,
    }])
  }

  const ubahItem = (idx: number, field: string, nilai: number) => {
    setItemPO(prev => prev.map((it, i) => {
      if (i !== idx) return it
      const baru = { ...it, [field]: nilai }
      baru.subtotal = baru.qty_pesan * baru.harga_beli
      return baru
    }))
  }

  const tutupFormPO = () => {
    setFormPO(false); setSupplierPilihan(null); setItemPO([]); setCatatanPO(''); setProdukSupplier([])
  }

  const simpanPO = async () => {
    if (terkunci) { alert(t('Pilih satu apotek dulu di pemilih faskes sebelum membuat PO.', 'Select a specific pharmacy first before creating a PO.')); return }
    if (!supplierPilihan || itemPO.length === 0) {
      alert(t('Pilih supplier dan tambahkan produk dulu.', 'Select a supplier and add products first.')); return
    }
    setSibuk(true)
    const total_nilai = itemPO.reduce((a, b) => a + b.subtotal, 0)
    const cid = app.cid()
    const { data: po, error } = await supabase.from('purchase_orders')
      .insert([{ supplier_id: supplierPilihan.id, total_nilai, catatan: catatanPO, ...cid }])
      .select().single()
    if (error) { setSibuk(false); alert(pesanError(error)); return }

    const { error: eItem } = await supabase.from('po_items')
      .insert(itemPO.map(i => ({ ...i, po_id: po.id, ...cid })))
    setSibuk(false)
    if (eItem) {
      // PO tanpa baris tidak berguna dan membingungkan; buang lagi.
      await supabase.from('purchase_orders').delete().eq('id', po.id)
      alert(pesanError(eItem)); return
    }
    tutupFormPO()
    muat()
    alert(`PO ${po.nomor_po} ${t('berhasil dibuat.', 'created.')}`)
  }

  // ── Order terpandu ──

  const mulaiTerpandu = async () => {
    if (terkunci) { alert(t('Pilih satu apotek dulu di pemilih faskes sebelum membuat order.', 'Select a specific pharmacy first before creating an order.')); return }
    setTerpanduSibuk(true)
    const { data: prods } = await scope(
      supabase.from('products').select('id,nama_obat,satuan,stok_total,stok_minimum,harga_beli').order('nama_obat')
    )
    const minim = (prods || []).filter((p: any) => (p.stok_total ?? 0) <= (p.stok_minimum ?? 0))
    if (minim.length === 0) {
      setTerpanduSibuk(false)
      alert(t('Tidak ada barang yang mencapai stok minimum.', 'No items have reached minimum stock.'))
      return
    }
    const ids = minim.map((p: any) => p.id)
    const { data: ps } = await scope(
      supabase.from('product_suppliers').select('product_id, suppliers(id, nama_supplier, jenis)').in('product_id', ids)
    )
    const perProduk: Record<string, any[]> = {}
    ;(ps || []).forEach((r: any) => {
      if (r.suppliers) (perProduk[r.product_id] = perProduk[r.product_id] || []).push(r.suppliers)
    })
    setTerpanduItems(minim.map((p: any) => {
      const sup = perProduk[p.id] || []
      // Restok sampai kira-kira dua kali stok minimum, bukan pas di batas:
      // memesan tepat sampai batas berarti barang itu kembali ke daftar minim
      // pada penjualan berikutnya.
      const target = Math.max(1, (p.stok_minimum || 0) * 2 - (p.stok_total || 0))
      return {
        product_id: p.id, nama: p.nama_obat, satuan: p.satuan,
        stok_total: p.stok_total ?? 0, stok_minimum: p.stok_minimum ?? 0,
        harga_beli: p.harga_beli || 0, qty: target,
        suppliers: sup, supplier_id: sup[0]?.id || '',
      }
    }))
    setTerpanduStep(1); setTerpanduBuka(true); setTerpanduSibuk(false)
  }

  const tutupTerpandu = () => { setTerpanduBuka(false); setTerpanduStep(1); setTerpanduItems([]) }
  const ubahTerpandu = (pid: string, field: string, nilai: any) =>
    setTerpanduItems(prev => prev.map(i => i.product_id === pid ? { ...i, [field]: nilai } : i))
  const namaSupplier = (id: string) => suppliers.find((s: any) => s.id === id)?.nama_supplier || '-'

  const simpanTerpandu = async () => {
    const sah = terpanduItems.filter(i => i.supplier_id && i.qty > 0)
    if (sah.length === 0) { alert(t('Tidak ada item dengan supplier dan qty yang sah.', 'No items with a valid supplier and qty.')); return }
    setTerpanduSibuk(true)
    const grup: Record<string, any[]> = {}
    sah.forEach(i => { (grup[i.supplier_id] = grup[i.supplier_id] || []).push(i) })
    const cid = app.cid()
    const jadi: string[] = []
    for (const sid of Object.keys(grup)) {
      const items = grup[sid]
      const total_nilai = items.reduce((a, b) => a + b.qty * b.harga_beli, 0)
      const { data: po, error } = await supabase.from('purchase_orders').insert([{
        supplier_id: sid, total_nilai,
        catatan: t('Order terpandu, restok otomatis', 'Guided order, auto restock'), ...cid,
      }]).select().single()
      if (error) {
        setTerpanduSibuk(false)
        alert(pesanError(error) + (jadi.length ? `\n\n${jadi.length} PO sudah terlanjur dibuat: ${jadi.join(', ')}` : ''))
        muat(); return
      }
      const { error: eItem } = await supabase.from('po_items').insert(items.map(i => ({
        po_id: po.id, product_id: i.product_id, nama_produk: i.nama, satuan: i.satuan,
        qty_pesan: i.qty, harga_beli: i.harga_beli, subtotal: i.qty * i.harga_beli, ...cid,
      })))
      if (eItem) {
        await supabase.from('purchase_orders').delete().eq('id', po.id)
        setTerpanduSibuk(false)
        alert(pesanError(eItem) + (jadi.length ? `\n\n${jadi.length} PO sudah terlanjur dibuat: ${jadi.join(', ')}` : ''))
        muat(); return
      }
      jadi.push(po.nomor_po)
    }
    setTerpanduSibuk(false)
    tutupTerpandu()
    muat()
    alert(`${jadi.length} ${t('PO dibuat dan siap dikirim', 'POs created and ready to send')}: ${jadi.join(', ')}`)
  }

  // ── Penerimaan ──

  const bukaPenerimaan = async (po: any) => {
    const { data } = await supabase.from('po_items').select('*').eq('po_id', po.id).order('nama_produk')
    setBarisTerima((data || []).map((it: any) => ({
      id: it.id,
      product_id: it.product_id,
      nama_produk: it.nama_produk,
      satuan: it.satuan,
      qty_pesan: it.qty_pesan || 0,
      // Angka ini KUMULATIF: kalau PO ini pernah diterima sebagian, isinya
      // sudah termasuk penerimaan sebelumnya. Database menghitung selisihnya.
      qty_terima: it.qty_terima || it.qty_pesan || 0,
      batch_number: it.batch_number || '',
      expired_date: it.expired_date || '',
      harga_beli: it.harga_beli || 0,
    })))
    setFaktur({ nomor_faktur: '', tanggal_faktur: new Date().toISOString().split('T')[0], term_of_payment: 30 })
    setTerima(po)
  }

  const ubahBaris = (idx: number, field: keyof BarisTerima, nilai: any) =>
    setBarisTerima(prev => prev.map((b, i) => i === idx ? { ...b, [field]: nilai } : b))

  const simpanPenerimaan = async (tutup: boolean) => {
    if (!terima) return
    setSibuk(true)
    const { data, error } = await supabase.rpc('receive_purchase_order', {
      p_po_id: terima.id,
      p_items: barisTerima.map(b => ({
        po_item_id: b.id,
        qty_terima: b.qty_terima,
        batch_number: b.batch_number,
        expired_date: b.expired_date || null,
        harga_beli: b.harga_beli,
      })),
      p_tutup: tutup,
      p_faktur: faktur.nomor_faktur.trim() ? faktur : null,
    })
    setSibuk(false)
    if (error) { alert(pesanError(error)); return }

    setTerima(null); setBarisTerima([])
    muat()
    const hasil = data as any
    const pesanFaktur = hasil?.nomor_faktur
      ? `\n${t('Faktur', 'Invoice')} ${hasil.nomor_faktur} ${t('tercatat, jatuh tempo', 'recorded, due')} ${tanggal(hasil.jatuh_tempo)}.`
      : ''
    alert((tutup
      ? t('PO selesai. Stok dan batch sudah diperbarui.', 'PO completed. Stock and batches updated.')
      : t('Penerimaan parsial disimpan. PO masih terbuka.', 'Partial receipt saved. PO still open.')) + pesanFaktur)
  }

  const batalkanPO = async (po: any) => {
    if (!confirm(t(`Batalkan PO ${po.nomor_po}? Barang yang sudah diterima tidak ikut dibatalkan.`,
                   `Cancel PO ${po.nomor_po}? Goods already received are not reversed.`))) return
    const { error } = await supabase.from('purchase_orders').update({ status: 'dibatalkan' }).eq('id', po.id)
    if (error) { alert(pesanError(error)); return }
    setTerima(null); setBarisTerima([]); muat()
  }

  const kirimPO = async (po: any) => {
    const { error } = await supabase.from('purchase_orders').update({ status: 'dikirim' }).eq('id', po.id)
    if (error) { alert(pesanError(error)); return }
    muat()
  }

  const cetakPO = async (po: any) => {
    const { data: items } = await supabase.from('po_items').select('*').eq('po_id', po.id)
    const ok = bukaCetak(purchaseOrder(app.settingsData, {
      nomor_po: po.nomor_po,
      tanggal: po.tanggal_po || po.created_at,
      status: po.status,
      total_nilai: po.total_nilai,
      catatan: po.catatan,
      supplier_nama: po.suppliers?.nama_supplier,
      supplier_alamat: po.suppliers?.alamat,
      supplier_telepon: po.suppliers?.telepon,
    }, items || []))
    if (!ok) alert(t('Jendela cetak diblokir peramban. Izinkan pop-up untuk situs ini.', 'The print window was blocked. Allow pop-ups for this site.'))
  }

  const bukaDetail = async (po: any) => {
    const { data } = await supabase.from('po_items').select('*').eq('po_id', po.id)
    setDetail({ ...po, items: data || [] })
  }

  const inputCls = 'border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const kecil = 'border border-[var(--line)] rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand)]'

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-[var(--ink)] mb-1">{t('Pembelian', 'Purchasing')}</h1>
          <p className="text-[var(--ink-soft)] text-sm">{t('Purchase order ke supplier dan penerimaan barangnya.', 'Purchase orders to suppliers and goods receipt.')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setFormPO(true)} disabled={terkunci}
            className="inline-flex items-center gap-1.5 border border-[var(--brand)] text-[var(--brand)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--surface-2)] transition disabled:opacity-40 disabled:cursor-not-allowed">
            <Pencil size={15} /> {t('Order Manual', 'Manual Order')}
          </button>
          <button onClick={mulaiTerpandu} disabled={terpanduSibuk || terkunci}
            className="inline-flex items-center gap-1.5 bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed">
            <Wand2 size={15} /> {terpanduSibuk ? t('Memuat…', 'Loading…') : t('Order Terpandu', 'Guided Order')}
          </button>
        </div>
      </div>

      {terkunci && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">{t('Pembuatan PO dikunci', 'PO creation locked')}</p>
            <p className="text-amber-700">
              {t('Pemilih faskes di atas masih menampilkan semua apotek. Pilih satu apotek supaya PO tidak tercampur.',
                 'The facility picker above still shows all pharmacies. Pick one so POs are not mixed across pharmacies.')}
            </p>
          </div>
        </div>
      )}

      <div className={TBL_WRAP}>
        <table className={TBL}>
          <thead className={THEAD}>
            <tr>
              <th className={TH_L}>{t('No. PO', 'PO No.')}</th>
              <th className={TH_L}>Supplier</th>
              <th className={TH_L}>{t('Tanggal', 'Date')}</th>
              <th className={TH_R}>Total</th>
              <th className={TH_C}>Status</th>
              <th className={TH_C}>{t('Aksi', 'Action')}</th>
            </tr>
          </thead>
          <tbody>
            {memuat ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</td></tr>
            ) : poList.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--ink-faint)]">
                {t('Belum ada PO. Buat yang pertama lewat tombol di atas.', 'No POs yet. Create the first one with the button above.')}
              </td></tr>
            ) : poList.map((po: any) => (
              <tr key={po.id} className={TR}>
                <td className="px-4 py-3 num text-xs text-[var(--brand)] font-medium">{po.nomor_po}</td>
                <td className="px-4 py-3 text-[var(--ink)]">{po.suppliers?.nama_supplier || '-'}</td>
                <td className="px-4 py-3 text-[var(--ink-soft)] num">{tanggal(po.tanggal_po || po.created_at)}</td>
                <td className="px-4 py-3 text-right font-medium text-[var(--brand)] num">{rupiah(po.total_nilai)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_WARNA[po.status] || 'bg-gray-100 text-gray-600'}`}>{po.status}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                    <button onClick={() => cetakPO(po)} className="text-xs text-[var(--brand)] hover:underline font-medium">Print</button>
                    <span className="text-[var(--line)]">|</span>
                    <button onClick={() => bukaDetail(po)} className="text-xs text-[var(--ink-soft)] hover:underline font-medium">{t('Detail', 'Details')}</button>
                    {po.status === 'draft' && (
                      <>
                        <span className="text-[var(--line)]">|</span>
                        <button onClick={() => kirimPO(po)} className="text-xs text-blue-600 hover:underline font-medium">{t('Kirim', 'Send')}</button>
                      </>
                    )}
                    {po.status === 'dikirim' && (
                      <>
                        <span className="text-[var(--line)]">|</span>
                        <button onClick={() => bukaPenerimaan(po)} className="text-xs text-green-600 hover:underline font-medium">
                          {po.status_penerimaan === 'partial' ? t('Terima Lagi', 'Receive More') : t('Terima Barang', 'Receive Goods')}
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

      {/* ── Order manual ── */}
      {formPO && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[var(--brand)] mb-4">{t('Order Manual', 'Manual Order')}</h2>

            <div className="mb-4">
              <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Pilih Supplier *', 'Select Supplier *')}</label>
              <select
                value={supplierPilihan?.id || ''}
                onChange={e => {
                  const s = suppliers.find((x: any) => x.id === e.target.value)
                  setSupplierPilihan(s || null); setItemPO([]); setProdukSupplier([])
                  if (s) muatProdukSupplier(s.id)
                }}
                className={inputCls + ' w-full'}
              >
                <option value="">{t('-- Pilih Supplier --', '-- Select Supplier --')}</option>
                {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.nama_supplier}{s.jenis ? ` (${s.jenis})` : ''}</option>)}
              </select>
            </div>

            {supplierPilihan && (
              <div className="mb-4">
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-2 block">
                  {t('Produk dari', 'Products from')} {supplierPilihan.nama_supplier}
                </label>
                {produkSupplier.length === 0 ? (
                  <p className="text-xs text-[var(--ink-faint)] p-3 bg-[var(--surface-2)] rounded-lg">
                    {t('Belum ada produk yang ditautkan ke supplier ini. Tautkan lewat Produk, tab Supplier.',
                       'No products linked to this supplier yet. Link them from Products, Supplier tab.')}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {produkSupplier.map((p: any) => (
                      <button key={p.id} onClick={() => tambahItem(p)}
                        className={`text-left px-3 py-2 rounded-lg border text-sm transition ${
                          itemPO.some(i => i.product_id === p.id)
                            ? 'border-[var(--brand)] bg-[var(--surface-2)]'
                            : 'border-[var(--line)] hover:bg-[var(--surface-2)]'
                        }`}>
                        <div className="font-medium text-[var(--ink)]">{p.nama_obat}</div>
                        <div className="text-xs text-[var(--ink-faint)]">{p.satuan} · {t('stok', 'stock')} {angka(p.stok_total)}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {itemPO.length > 0 && (
              <div className="mb-4 overflow-x-auto">
                <label className="text-xs font-medium text-[var(--ink-soft)] mb-2 block">{t('Detail Order', 'Order Detail')}</label>
                <table className="w-full text-sm border border-[var(--line-soft)] rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-[var(--surface-2)] text-xs text-[var(--ink-soft)]">
                      <th className="text-left px-3 py-2">{t('Produk', 'Product')}</th>
                      <th className="text-left px-3 py-2">{t('Satuan', 'Unit')}</th>
                      <th className="text-center px-3 py-2">Qty</th>
                      <th className="text-right px-3 py-2">{t('Harga Beli', 'Buy Price')}</th>
                      <th className="text-right px-3 py-2">Subtotal</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemPO.map((item, idx) => (
                      <tr key={idx} className="border-t border-[var(--line-soft)]">
                        <td className="px-3 py-2 text-[var(--ink)] font-medium">{item.nama_produk}</td>
                        <td className="px-3 py-2 text-[var(--ink-soft)]">{item.satuan}</td>
                        <td className="px-3 py-2 text-center">
                          <input type="number" min={1} value={item.qty_pesan}
                            onChange={e => ubahItem(idx, 'qty_pesan', Math.max(1, +e.target.value))}
                            className={kecil + ' w-16 text-center num'} />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input type="number" min={0} value={item.harga_beli}
                            onChange={e => ubahItem(idx, 'harga_beli', Math.max(0, +e.target.value))}
                            className={kecil + ' w-24 text-right num'} />
                        </td>
                        <td className="px-3 py-2 text-right text-[var(--brand)] num">{rupiah(item.subtotal)}</td>
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => setItemPO(itemPO.filter((_, i) => i !== idx))}
                            aria-label={t('Hapus', 'Remove')}
                            className="text-red-400 hover:text-red-600 text-xs">✕</button>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-[var(--brand)] bg-[var(--surface-2)]">
                      <td colSpan={4} className="px-3 py-2 font-bold text-sm text-[var(--brand)]">TOTAL</td>
                      <td className="px-3 py-2 text-right font-bold text-[var(--brand)] num">
                        {rupiah(itemPO.reduce((a, b) => a + b.subtotal, 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="mb-4">
              <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Catatan (opsional)', 'Notes (optional)')}</label>
              <textarea value={catatanPO} onChange={e => setCatatanPO(e.target.value)} rows={2} className={inputCls + ' w-full'} />
            </div>

            <div className="flex gap-3">
              <button onClick={tutupFormPO} className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
                {t('Batal', 'Cancel')}
              </button>
              <button onClick={simpanPO} disabled={sibuk}
                className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                {sibuk ? t('Menyimpan…', 'Saving…') : t('Buat PO', 'Create PO')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Order terpandu ── */}
      {terpanduBuka && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl w-full max-w-3xl shadow-xl max-h-[92vh] flex flex-col">
            <div className="px-6 pt-5 pb-4 border-b border-[var(--line-soft)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[var(--brand)] flex items-center gap-2"><Wand2 size={18} /> {t('Order Terpandu', 'Guided Order')}</h2>
                <button onClick={tutupTerpandu} aria-label={t('Tutup', 'Close')} className="text-[var(--ink-faint)] hover:text-[var(--brand)]"><X size={20} /></button>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { n: 1, label: t('Pilih Barang', 'Select Items') },
                  { n: 2, label: t('Bagi Distributor', 'Assign Distributors') },
                  { n: 3, label: t('Review & Buat', 'Review & Create') },
                ].map((s, i) => (
                  <div key={s.n} className="flex items-center gap-2 flex-1">
                    <div className={`flex items-center gap-2 ${terpanduStep >= s.n ? 'text-[var(--brand)]' : 'text-[var(--ink-faint)]'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        terpanduStep > s.n ? 'bg-[var(--brand-soft)] text-[var(--on-brand)]'
                        : terpanduStep === s.n ? 'bg-[var(--brand)] text-[var(--on-brand)]'
                        : 'bg-[var(--line-soft)] text-[var(--ink-faint)]'}`}>
                        {terpanduStep > s.n ? <Check size={13} /> : s.n}
                      </div>
                      <span className="text-xs font-medium hidden sm:block">{s.label}</span>
                    </div>
                    {i < 2 && <div className={`flex-1 h-0.5 rounded ${terpanduStep > s.n ? 'bg-[var(--brand-soft)]' : 'bg-[var(--line-soft)]'}`} />}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 overflow-y-auto flex-1">
              {terpanduStep === 1 && (
                <div>
                  <p className="text-sm text-[var(--ink-soft)] mb-3">
                    {t('Ini barang yang sudah menyentuh stok minimum. Sesuaikan jumlah ordernya bila perlu.',
                       'These items have reached minimum stock. Adjust the order quantities if needed.')}
                  </p>
                  {terpanduItems.length === 0 ? (
                    <p className="text-center text-sm text-[var(--ink-faint)] py-8">{t('Tidak ada barang yang perlu direstok.', 'No items need restocking.')}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-[var(--line-soft)] rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-[var(--surface-2)] text-xs text-[var(--ink-soft)]">
                            <th className="text-left px-3 py-2">{t('Produk', 'Product')}</th>
                            <th className="text-center px-3 py-2">{t('Stok / Min', 'Stock / Min')}</th>
                            <th className="text-center px-3 py-2">{t('Qty Order', 'Order Qty')}</th>
                            <th className="px-2 py-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {terpanduItems.map(it => (
                            <tr key={it.product_id} className="border-t border-[var(--line-soft)]">
                              <td className="px-3 py-2">
                                <div className="font-medium text-[var(--ink)]">{it.nama}</div>
                                <div className="text-xs text-[var(--ink-faint)]">{it.satuan}</div>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 num">
                                  {angka(it.stok_total)} / {angka(it.stok_minimum)}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input type="number" min={1} value={it.qty}
                                  onChange={e => ubahTerpandu(it.product_id, 'qty', Math.max(1, +e.target.value))}
                                  className={kecil + ' w-16 text-center num'} />
                              </td>
                              <td className="px-2 py-2 text-center">
                                <button onClick={() => setTerpanduItems(terpanduItems.filter(x => x.product_id !== it.product_id))}
                                  aria-label={t('Hapus', 'Remove')}
                                  className="text-red-400 hover:text-red-600 text-xs">✕</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {terpanduStep === 2 && (
                <div>
                  <p className="text-sm text-[var(--ink-soft)] mb-3">
                    {t('Distributor bawaan sudah dipilihkan per barang. Ubah bila perlu. Barang tanpa supplier akan dilewati.',
                       'A default distributor is pre-selected per item. Change if needed. Items without a supplier are skipped.')}
                  </p>
                  <div className="space-y-2">
                    {terpanduItems.map(it => (
                      <div key={it.product_id} className="flex items-center justify-between gap-3 px-3 py-2 border border-[var(--line-soft)] rounded-lg">
                        <div className="min-w-0">
                          <div className="font-medium text-[var(--ink)] text-sm truncate">{it.nama}</div>
                          <div className="text-xs text-[var(--ink-faint)] num">{angka(it.qty)} {it.satuan}</div>
                        </div>
                        {it.suppliers.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 shrink-0">
                            <AlertTriangle size={13} /> {t('Belum ada supplier', 'No supplier')}
                          </span>
                        ) : (
                          <select value={it.supplier_id} onChange={e => ubahTerpandu(it.product_id, 'supplier_id', e.target.value)}
                            className={kecil + ' max-w-[55%]'}>
                            {it.suppliers.map((s: any) => (
                              <option key={s.id} value={s.id}>{s.nama_supplier}{s.jenis ? ` (${s.jenis})` : ''}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {terpanduStep === 3 && (() => {
                const sah = terpanduItems.filter(i => i.supplier_id && i.qty > 0)
                const lewat = terpanduItems.filter(i => !i.supplier_id || i.qty <= 0)
                const grup: Record<string, any[]> = {}
                sah.forEach(i => { (grup[i.supplier_id] = grup[i.supplier_id] || []).push(i) })
                const sids = Object.keys(grup)
                return (
                  <div>
                    <p className="text-sm text-[var(--ink-soft)] mb-3">
                      {t('Order akan dipecah menjadi', 'The order will be split into')}{' '}
                      <span className="font-bold text-[var(--brand)]">{sids.length} PO</span>{' '}
                      {t('siap kirim ke masing-masing distributor.', 'ready to send to each distributor.')}
                    </p>
                    <div className="space-y-3">
                      {sids.map(sid => {
                        const items = grup[sid]
                        const total = items.reduce((a, b) => a + b.qty * b.harga_beli, 0)
                        return (
                          <div key={sid} className="border border-[var(--line)] rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--surface-2)]">
                              <span className="font-semibold text-[var(--brand)] text-sm flex items-center gap-1.5"><Truck size={14} /> {namaSupplier(sid)}</span>
                              <span className="text-xs text-[var(--ink-soft)]">{items.length} {t('item', 'items')}</span>
                            </div>
                            <table className="w-full text-sm">
                              <tbody>
                                {items.map(it => (
                                  <tr key={it.product_id} className="border-t border-[var(--line-soft)]">
                                    <td className="px-4 py-2 text-[var(--ink)]">{it.nama}</td>
                                    <td className="px-2 py-2 text-center text-[var(--ink-soft)] whitespace-nowrap num">
                                      {angka(it.qty)} × {rupiah(it.harga_beli)}
                                    </td>
                                    <td className="px-4 py-2 text-right text-[var(--brand)] font-medium num">{rupiah(it.qty * it.harga_beli)}</td>
                                  </tr>
                                ))}
                                <tr className="border-t border-[var(--line)] bg-[var(--surface)]">
                                  <td colSpan={2} className="px-4 py-2 font-semibold text-[var(--brand)] text-xs">TOTAL</td>
                                  <td className="px-4 py-2 text-right font-bold text-[var(--brand)] num">{rupiah(total)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )
                      })}
                    </div>
                    {lewat.length > 0 && (
                      <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                        <span className="font-semibold">{lewat.length} {t('barang dilewati', 'items skipped')}</span>{' '}
                        ({t('tanpa supplier', 'no supplier')}): {lewat.map(s => s.nama).join(', ')}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            <div className="px-6 py-4 border-t border-[var(--line-soft)] flex gap-3">
              <button onClick={() => terpanduStep === 1 ? tutupTerpandu() : setTerpanduStep(terpanduStep - 1)}
                className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm hover:bg-[var(--surface-2)]">
                {terpanduStep === 1 ? t('Batal', 'Cancel') : t('Kembali', 'Back')}
              </button>
              {terpanduStep < 3 ? (
                <button onClick={() => setTerpanduStep(terpanduStep + 1)} disabled={terpanduItems.length === 0}
                  className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] disabled:opacity-50">
                  {t('Lanjut', 'Next')}
                </button>
              ) : (
                <button onClick={simpanTerpandu} disabled={terpanduSibuk}
                  className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] disabled:opacity-50">
                  {terpanduSibuk ? t('Memproses…', 'Processing…') : t('Buat Semua PO', 'Create All POs')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Penerimaan barang ── */}
      {terima && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-[var(--brand)]">{t('Penerimaan Barang', 'Goods Receipt')}</h2>
              <p className="text-xs text-[var(--ink-soft)]">PO {terima.nomor_po} · {terima.suppliers?.nama_supplier}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="bg-[var(--surface-2)] text-xs text-[var(--ink-soft)]">
                    <th className="text-left px-3 py-2">{t('Produk', 'Product')}</th>
                    <th className="text-center px-3 py-2">{t('Qty PO', 'PO Qty')}</th>
                    <th className="text-center px-3 py-2">{t('Qty Terima', 'Recv Qty')}</th>
                    <th className="text-left px-3 py-2">{t('No. Batch', 'Batch No.')}</th>
                    <th className="text-left px-3 py-2">{t('Kadaluarsa', 'Expiry')}</th>
                    <th className="text-right px-3 py-2">{t('Harga Beli', 'Buy Price')}</th>
                  </tr>
                </thead>
                <tbody>
                  {barisTerima.map((item, idx) => (
                    <tr key={item.id} className="border-t border-[var(--line-soft)]">
                      <td className="px-3 py-2">
                        <div className="font-medium text-[var(--ink)] text-sm">{item.nama_produk}</div>
                        <div className="text-xs text-[var(--ink-faint)]">{item.satuan}</div>
                      </td>
                      <td className="px-3 py-2 text-center text-[var(--ink-soft)] num">{angka(item.qty_pesan)}</td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} value={item.qty_terima}
                          onChange={e => ubahBaris(idx, 'qty_terima', Math.max(0, +e.target.value))}
                          className={kecil + ' w-16 text-center num'} />
                      </td>
                      <td className="px-3 py-2">
                        <input value={item.batch_number} placeholder="BT-001"
                          onChange={e => ubahBaris(idx, 'batch_number', e.target.value)}
                          className={kecil + ' w-28 num'} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="date" value={item.expired_date}
                          onChange={e => ubahBaris(idx, 'expired_date', e.target.value)}
                          className={kecil + ' w-36'} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} value={item.harga_beli}
                          onChange={e => ubahBaris(idx, 'harga_beli', Math.max(0, +e.target.value))}
                          className={kecil + ' w-28 text-right num'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border border-[var(--line)] rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Receipt size={15} className="text-[var(--brand)]" />
                <p className="text-sm font-semibold text-[var(--brand)]">{t('Faktur Pembelian', 'Purchase Invoice')}</p>
                <span className="text-xs text-[var(--ink-faint)]">{t('(kosongkan kalau fakturnya belum ada)', '(leave empty if there is no invoice yet)')}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Nomor Faktur', 'Invoice Number')}</label>
                  <input value={faktur.nomor_faktur} onChange={e => setFaktur({ ...faktur, nomor_faktur: e.target.value })}
                    placeholder="INV/2026/001" className={inputCls + ' w-full num'} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">{t('Tanggal Faktur', 'Invoice Date')}</label>
                  <input type="date" value={faktur.tanggal_faktur} onChange={e => setFaktur({ ...faktur, tanggal_faktur: e.target.value })}
                    className={inputCls + ' w-full'} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--ink-soft)] mb-1 block">Term of Payment</label>
                  <select value={faktur.term_of_payment} onChange={e => setFaktur({ ...faktur, term_of_payment: +e.target.value })}
                    className={inputCls + ' w-full'}>
                    <option value={0}>{t('Tunai (0 hari)', 'Cash (0 days)')}</option>
                    {[7, 14, 30, 45, 60, 90].map(d => <option key={d} value={d}>{d} {t('hari', 'days')}</option>)}
                  </select>
                </div>
              </div>
              {faktur.nomor_faktur.trim() && (
                <p className="text-xs text-[var(--ink-soft)] mt-2">
                  {t('Jatuh tempo', 'Due date')}: <b className="text-[var(--brand)] num">{(() => {
                    const d = new Date(faktur.tanggal_faktur)
                    d.setDate(d.getDate() + (Number(faktur.term_of_payment) || 0))
                    return tanggal(d.toISOString())
                  })()}</b>
                </p>
              )}
            </div>

            <div className="bg-[var(--surface-2)] rounded-lg p-3 mb-4 text-xs text-[var(--ink-soft)] leading-relaxed">
              <b>{t('Penerimaan parsial:', 'Partial receipt:')}</b>{' '}
              {t('isi Qty Terima sesuai barang yang sudah datang seluruhnya, termasuk yang sudah diterima sebelumnya. Database menghitung selisihnya sendiri, jadi menyimpan dua kali tidak menambah stok dua kali.',
                 'enter the cumulative received quantity, including earlier receipts. The database computes the difference, so saving twice does not add stock twice.')}
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => { setTerima(null); setBarisTerima([]) }}
                className="flex-1 min-w-[7rem] border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
                {t('Batal', 'Cancel')}
              </button>
              <button onClick={() => batalkanPO(terima)}
                className="px-4 border border-red-200 text-red-500 py-2 rounded-lg text-sm hover:bg-red-50 transition">
                {t('Batalkan PO', 'Cancel PO')}
              </button>
              <button onClick={() => simpanPenerimaan(false)} disabled={sibuk}
                className="flex-1 min-w-[9rem] border-2 border-[var(--brand)] text-[var(--brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--surface-2)] transition disabled:opacity-50">
                {t('Simpan Parsial', 'Save Partial')}
              </button>
              <button onClick={() => simpanPenerimaan(true)} disabled={sibuk}
                className="flex-1 min-w-[9rem] bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                {sibuk ? t('Menyimpan…', 'Saving…') : t('Terima & Tutup PO', 'Receive & Close PO')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail PO ── */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--brand)]">{t('Detail PO', 'PO Details')}</h2>
                <p className="text-xs text-[var(--ink-soft)] num">{detail.nomor_po}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_WARNA[detail.status] || 'bg-gray-100 text-gray-600'}`}>
                {detail.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-[var(--surface-2)] rounded-xl text-sm">
              <div>
                <p className="text-xs text-[var(--ink-soft)] mb-0.5">Supplier</p>
                <p className="font-medium text-[var(--ink)]">{detail.suppliers?.nama_supplier || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--ink-soft)] mb-0.5">{t('Tanggal PO', 'PO Date')}</p>
                <p className="font-medium text-[var(--ink)] num">{tanggal(detail.tanggal_po || detail.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--ink-soft)] mb-0.5">{t('Tanggal Terima', 'Received Date')}</p>
                <p className="font-medium text-[var(--ink)] num">{tanggal(detail.tanggal_terima) || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--ink-soft)] mb-0.5">{t('Total Nilai', 'Total Value')}</p>
                <p className="font-bold text-[var(--brand)] num">{rupiah(detail.total_nilai)}</p>
              </div>
              {detail.catatan && (
                <div className="col-span-2">
                  <p className="text-xs text-[var(--ink-soft)] mb-0.5">{t('Catatan', 'Notes')}</p>
                  <p className="text-[var(--ink)]">{detail.catatan}</p>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="bg-[var(--brand)] text-xs text-[var(--on-brand)]">
                    <th className="text-left px-3 py-2">{t('Produk', 'Product')}</th>
                    <th className="text-center px-3 py-2">{t('Qty Pesan', 'Order Qty')}</th>
                    <th className="text-center px-3 py-2">{t('Qty Terima', 'Recv Qty')}</th>
                    <th className="text-left px-3 py-2">{t('No. Batch', 'Batch No.')}</th>
                    <th className="text-left px-3 py-2">{t('Kadaluarsa', 'Expiry')}</th>
                    <th className="text-right px-3 py-2">{t('Harga Beli', 'Buy Price')}</th>
                    <th className="text-right px-3 py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.items || []).map((item: any, i: number) => (
                    <tr key={i} className={TR}>
                      <td className="px-3 py-2 font-medium text-[var(--ink)]">{item.nama_produk}</td>
                      <td className="px-3 py-2 text-center text-[var(--ink-soft)] num">{angka(item.qty_pesan)} {item.satuan}</td>
                      <td className="px-3 py-2 text-center num">
                        <span className={`font-medium ${(item.qty_terima || 0) < item.qty_pesan ? 'text-yellow-600' : 'text-green-600'}`}>
                          {angka(item.qty_terima)} {item.satuan}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[var(--ink-soft)] num text-xs">{item.batch_number || '-'}</td>
                      <td className="px-3 py-2 text-[var(--ink-soft)] num text-xs">{tanggal(item.expired_date) || '-'}</td>
                      <td className="px-3 py-2 text-right text-[var(--ink)] num">{rupiah(item.harga_beli)}</td>
                      <td className="px-3 py-2 text-right font-medium text-[var(--brand)] num">{rupiah(item.subtotal)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-[var(--brand)] bg-[var(--surface-2)]">
                    <td colSpan={6} className="px-3 py-2 font-bold text-sm text-[var(--brand)]">TOTAL</td>
                    <td className="px-3 py-2 text-right font-bold text-[var(--brand)] num">
                      {rupiah((detail.items || []).reduce((a: number, b: any) => a + (b.subtotal || 0), 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setDetail(null)} className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2 rounded-lg text-sm">
                {t('Tutup', 'Close')}
              </button>
              <button onClick={() => cetakPO(detail)}
                className="flex-1 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-sm font-medium hover:bg-[var(--brand-hover)] transition">
                {t('Cetak PO', 'Print PO')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
