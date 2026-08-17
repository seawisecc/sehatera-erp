'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, Download, PackageOpen, Pill, Receipt, Truck, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { parseCSV, unduhCSV } from '@/lib/csv'

/**
 * Migrasi Data: impor dan ekspor CSV.
 *
 * Sub-rute Pengaturan, bukan tab di dalamnya, karena isinya paling besar dan
 * paling jarang dibuka: satu apotek biasanya memakainya sekali seumur hidup,
 * saat pindah dari catatan lama. Menjadikannya alamat sendiri juga berarti
 * tautannya bisa dikirim ke apotek baru saat pendampingan onboarding.
 */
export default function HalamanMigrasi() {
  const { t } = useLang()
  const app = useApp()

  const [importInfo, setImportInfo] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState<string | null>(null)
  const [migrasiCompany, setMigrasiCompany] = useState('')

  const importProduk = async (file: File) => {
    const cid = (app.isSuper && migrasiCompany) ? migrasiCompany : null
    setImporting('produk'); setImportInfo(p => ({ ...p, produk: '' }))
    try {
      const rows = parseCSV(await file.text())
      const valid = rows.filter(r => r.nama_obat)
      if (valid.length === 0) { setImportInfo(p => ({ ...p, produk: 'Tidak ada baris valid (kolom nama_obat kosong).' })); return }
      const payload = valid.map(r => {
        const o: any = {
          nama_obat: r.nama_obat, nama_generik: r.nama_generik || null, kandungan: r.kandungan || null,
          kategori: (r.kategori || 'bebas').toLowerCase().replace(/\s+/g, '_'),
          satuan: r.satuan || 'Tablet', isi_kemasan: +(r.isi_kemasan || 1) || 1,
          harga_beli: +(r.harga_beli || 0) || 0, harga_jual: +(r.harga_jual || 0) || 0,
          stok_total: +(r.stok_total || 0) || 0, stok_minimum: +(r.stok_minimum || 10) || 10,
        }
        if (r.kode) o.kode = r.kode
        if (cid) o.company_id = cid
        return o
      })
      const { error } = await supabase.from('products').insert(payload)
      if (error) { setImportInfo(p => ({ ...p, produk: 'Error: ' + error.message })); return }
      setImportInfo(p => ({ ...p, produk: `✅ ${payload.length} produk berhasil diimpor.` }))
    } catch (e: any) { setImportInfo(p => ({ ...p, produk: 'Gagal membaca file: ' + (e?.message || e) })) }
    finally { setImporting(null) }
  }

  const importSupplier = async (file: File) => {
    const cid = (app.isSuper && migrasiCompany) ? migrasiCompany : null
    setImporting('supplier'); setImportInfo(p => ({ ...p, supplier: '' }))
    try {
      const rows = parseCSV(await file.text())
      const valid = rows.filter(r => r.nama_supplier)
      if (valid.length === 0) { setImportInfo(p => ({ ...p, supplier: 'Tidak ada baris valid (kolom nama_supplier kosong).' })); return }
      const normJenis = (v: string) => {
        const s = (v || '').trim().toLowerCase().replace(/[\s-]/g, '')
        if (!s || s === 'pbf') return 'PBF'
        if (s.includes('sub') || s.includes('distributor')) return 'Subdistributor'
        return 'Lainnya'
      }
      const payload = valid.map(r => ({ nama_supplier: r.nama_supplier, jenis: normJenis(r.jenis), alamat: r.alamat || null, telepon: r.telepon || null, email: r.email || null, ...(cid ? { company_id: cid } : {}) }))
      const { error } = await supabase.from('suppliers').insert(payload)
      if (error) { setImportInfo(p => ({ ...p, supplier: 'Error: ' + error.message })); return }
      setImportInfo(p => ({ ...p, supplier: `✅ ${payload.length} supplier berhasil diimpor.` }))
    } catch (e: any) { setImportInfo(p => ({ ...p, supplier: 'Gagal membaca file: ' + (e?.message || e) })) }
    finally { setImporting(null) }
  }

  const importStok = async (file: File) => {
    const cid = (app.isSuper && migrasiCompany) ? migrasiCompany : null
    setImporting('stok'); setImportInfo(p => ({ ...p, stok: '' }))
    try {
      const rows = parseCSV(await file.text())
      const valid = rows.filter(r => (r.kode_produk || r.kode) && r.stok_batch)
      if (valid.length === 0) { setImportInfo(p => ({ ...p, stok: 'Tidak ada baris valid (butuh kode_produk & stok_batch).' })); return }
      let ok = 0; const gagal: string[] = []
      for (const r of valid) {
        const kode = (r.kode_produk || r.kode).trim()
        let pq = supabase.from('products').select('id, stok_total').eq('kode', kode)
        if (cid) pq = pq.eq('company_id', cid)
        const { data: prod } = await pq.maybeSingle()
        if (!prod) { gagal.push(kode); continue }
        const qty = +(r.stok_batch || 0) || 0
        await supabase.from('product_batches').insert([{ product_id: prod.id, batch_number: r.batch_number || null, expired_date: r.expired_date || null, stok_batch: qty, ...(cid ? { company_id: cid } : {}) }])
        await supabase.from('products').update({ stok_total: (prod.stok_total || 0) + qty }).eq('id', prod.id)
        ok++
      }
      setImportInfo(p => ({ ...p, stok: `✅ ${ok} batch stok awal diimpor.` + (gagal.length ? ` ${gagal.length} kode tidak ditemukan: ${gagal.slice(0, 5).join(', ')}` : '') }))
    } catch (e: any) { setImportInfo(p => ({ ...p, stok: 'Gagal membaca file: ' + (e?.message || e) })) }
    finally { setImporting(null) }
  }

  const importMapping = async (file: File) => {
    const cid = (app.isSuper && migrasiCompany) ? migrasiCompany : null
    setImporting('mapping'); setImportInfo(p => ({ ...p, mapping: '' }))
    try {
      const rows = parseCSV(await file.text())
      const valid = rows.filter(r => (r.kode_produk || r.kode) && (r.nama_supplier || r.kode_supplier))
      if (valid.length === 0) { setImportInfo(p => ({ ...p, mapping: 'Tidak ada baris valid (butuh kode_produk & nama_supplier).' })); return }
      let ok = 0; const gagal: string[] = []
      for (const r of valid) {
        const kode = (r.kode_produk || r.kode).trim()
        let pq = supabase.from('products').select('id').eq('kode', kode)
        if (cid) pq = pq.eq('company_id', cid)
        const { data: prod } = await pq.maybeSingle()
        if (!prod) { gagal.push(kode); continue }
        let sup: any = null
        if (r.kode_supplier) { let sq = supabase.from('suppliers').select('id').eq('kode', r.kode_supplier.trim()); if (cid) sq = sq.eq('company_id', cid); const { data } = await sq.maybeSingle(); sup = data }
        if (!sup && r.nama_supplier) { let sq = supabase.from('suppliers').select('id').ilike('nama_supplier', r.nama_supplier.trim()); if (cid) sq = sq.eq('company_id', cid); const { data } = await sq.maybeSingle(); sup = data }
        if (!sup) { gagal.push(kode + '→' + (r.nama_supplier || r.kode_supplier)); continue }
        const { data: exists } = await supabase.from('product_suppliers').select('id').eq('product_id', prod.id).eq('supplier_id', sup.id).maybeSingle()
        if (!exists) await supabase.from('product_suppliers').insert([{ product_id: prod.id, supplier_id: sup.id, ...(cid ? { company_id: cid } : {}) }])
        ok++
      }
      setImportInfo(p => ({ ...p, mapping: `✅ ${ok} mapping produk–supplier diimpor.` + (gagal.length ? ` ${gagal.length} gagal: ${gagal.slice(0, 5).join(', ')}` : '') }))
    } catch (e: any) { setImportInfo(p => ({ ...p, mapping: 'Gagal membaca file: ' + (e?.message || e) })) }
    finally { setImporting(null) }
  }

  const importFakturAwal = async (file: File) => {
    const cid = (app.isSuper && migrasiCompany) ? migrasiCompany : null
    setImporting('fakturawal'); setImportInfo(p => ({ ...p, fakturawal: '' }))
    try {
      const rows = parseCSV(await file.text())
      const valid = rows.filter(r => r.nomor_faktur && r.nama_supplier)
      if (valid.length === 0) { setImportInfo(p => ({ ...p, fakturawal: 'Tidak ada baris valid (butuh nomor_faktur & nama_supplier).' })); return }
      let ok = 0; const gagal: string[] = []
      for (const r of valid) {
        let sq = supabase.from('suppliers').select('id').ilike('nama_supplier', r.nama_supplier.trim())
        if (cid) sq = sq.eq('company_id', cid)
        const { data: sup } = await sq.maybeSingle()
        if (!sup) { gagal.push(r.nomor_faktur + '→' + r.nama_supplier); continue }
        const tf = r.tanggal_faktur || new Date().toISOString().split('T')[0]
        const top = +(r.term_of_payment || 0) || 0
        let jt = r.tanggal_jatuh_tempo
        if (!jt) { const d = new Date(tf); d.setDate(d.getDate() + top); jt = d.toISOString().split('T')[0] }
        await supabase.from('faktur').insert([{ nomor_faktur: r.nomor_faktur.trim(), supplier_id: sup.id, tanggal_faktur: tf, term_of_payment: top, tanggal_jatuh_tempo: jt, total: +(r.total || 0) || 0, status: 'belum_bayar', ...(cid ? { company_id: cid } : {}) }])
        ok++
      }
      setImportInfo(p => ({ ...p, fakturawal: `✅ ${ok} faktur/hutang awal diimpor.` + (gagal.length ? ` ${gagal.length} supplier tidak ditemukan: ${gagal.slice(0, 5).join(', ')}` : '') }))
    } catch (e: any) { setImportInfo(p => ({ ...p, fakturawal: 'Gagal membaca file: ' + (e?.message || e) })) }
    finally { setImporting(null) }
  }

  // ── Export / Backup ke CSV ──
  const lingkup = (q: any) => (app.isSuper && migrasiCompany) ? q.eq('company_id', migrasiCompany) : q
  const exportProduk = async () => {
    const { data } = await lingkup(supabase.from('products').select('*').order('kode'))
    const headers = ['kode', 'nama_obat', 'nama_generik', 'kandungan', 'kategori', 'satuan', 'isi_kemasan', 'harga_beli', 'harga_jual', 'stok_total', 'stok_minimum']
    unduhCSV('export_produk.csv', headers, (data || []).map((p: any) => headers.map(h => String(p[h] ?? ''))))
  }
  const exportSupplier = async () => {
    const { data } = await lingkup(supabase.from('suppliers').select('*').order('kode'))
    const headers = ['kode', 'nama_supplier', 'jenis', 'alamat', 'telepon', 'email']
    unduhCSV('export_supplier.csv', headers, (data || []).map((s: any) => headers.map(h => String(s[h] ?? ''))))
  }
  const exportStok = async () => {
    const { data } = await lingkup(supabase.from('product_batches').select('*, products(kode)').order('expired_date'))
    const headers = ['kode_produk', 'batch_number', 'expired_date', 'stok_batch']
    unduhCSV('export_stok_batch.csv', headers, (data || []).map((b: any) => [b.products?.kode || '', b.batch_number || '', b.expired_date || '', String(b.stok_batch ?? '')]))
  }
  const exportTransaksi = async () => {
    const { data } = await lingkup(supabase.from('transactions').select('*').order('created_at', { ascending: false }))
    const headers = ['nomor_transaksi', 'tanggal', 'total', 'bayar', 'kembalian', 'status', 'nama_pasien', 'kontak_pasien', 'alamat_pasien', 'nomor_resep']
    unduhCSV('export_transaksi.csv', headers, (data || []).map((t: any) => [
      t.nomor_transaksi || '', t.created_at || '', String(t.total ?? ''), String(t.bayar ?? ''), String(t.kembalian ?? ''),
      t.status || '', t.nama_pasien || '', t.kontak_pasien || '', t.alamat_pasien || '', t.nomor_resep || '',
    ]))
  }
  const exportFaktur = async () => {
    const { data } = await lingkup(supabase.from('faktur').select('*, suppliers(nama_supplier), purchase_orders(nomor_po)').order('tanggal_faktur', { ascending: false }))
    const headers = ['nomor_faktur', 'supplier', 'nomor_po', 'tanggal_faktur', 'term_of_payment', 'tanggal_jatuh_tempo', 'total', 'status', 'tanggal_bayar', 'metode_bayar', 'catatan_bayar']
    unduhCSV('export_faktur.csv', headers, (data || []).map((f: any) => [
      f.nomor_faktur || '', f.suppliers?.nama_supplier || '', f.purchase_orders?.nomor_po || '', f.tanggal_faktur || '',
      String(f.term_of_payment ?? ''), f.tanggal_jatuh_tempo || '', String(f.total ?? ''), f.status || '',
      f.tanggal_bayar || '', f.metode_bayar || '', f.catatan_bayar || '',
    ]))
  }

  const migrasiCards = [
    { key: 'produk', title: t('Daftar Produk', 'Product List'), Icon: Pill, desc: t('Impor katalog obat: nama, kategori, harga, dan stok awal.', 'Import the drug catalog: name, category, price, and opening stock.'), cols: 'kode (opsional), nama_obat, nama_generik, kandungan, kategori, satuan, isi_kemasan, harga_beli, harga_jual, stok_total, stok_minimum', hint: t('Kategori: bebas, bebas_terbatas, keras, suplemen, psikotropika, narkotika, prekursor, alkes, lainnya.', 'Category: bebas, bebas_terbatas, keras, suplemen, psikotropika, narkotika, prekursor, alkes, lainnya.'), file: 'template_produk.csv', headers: ['kode', 'nama_obat', 'nama_generik', 'kandungan', 'kategori', 'satuan', 'isi_kemasan', 'harga_beli', 'harga_jual', 'stok_total', 'stok_minimum'], examples: [['', 'Paracetamol 500mg', 'Paracetamol', 'Paracetamol 500 mg', 'bebas', 'Tablet', '100', '500', '1000', '150', '10']], onUpload: importProduk },
    { key: 'supplier', title: t('Daftar Supplier', 'Supplier List'), Icon: Truck, desc: t('Impor daftar PBF / supplier obat.', 'Import the list of distributors / drug suppliers.'), cols: 'nama_supplier, jenis, alamat, telepon, email', hint: t('Jenis yang valid: PBF, Subdistributor, atau Lainnya (nilai lain otomatis disesuaikan).', 'Valid types: PBF, Subdistributor, or Lainnya (other values auto-adjusted).'), file: 'template_supplier.csv', headers: ['nama_supplier', 'jenis', 'alamat', 'telepon', 'email'], examples: [['PT Bina San Prima', 'PBF', 'Jl. Industri No. 1', '021-1234567', 'sales@binasan.co.id']], onUpload: importSupplier },
    { key: 'stok', title: t('Stok Awal (Batch)', 'Opening Stock (Batch)'), Icon: PackageOpen, desc: t('Impor stok awal per batch + expired date. Dicocokkan ke produk lewat kode.', 'Import opening stock per batch + expiry date. Matched to products by code.'), cols: 'kode_produk, batch_number, expired_date (YYYY-MM-DD), stok_batch', hint: t('Impor Produk dulu agar kode-nya tersedia. Stok batch akan menambah stok total produk.', 'Import Products first so codes exist. Batch stock adds to the total product stock.'), file: 'template_stok_awal.csv', headers: ['kode_produk', 'batch_number', 'expired_date', 'stok_batch'], examples: [['OBT-0001', 'BT-2401', '2026-12-31', '150']], onUpload: importStok },
    { key: 'mapping', title: t('Mapping Produk–Supplier', 'Product–Supplier Mapping'), Icon: ClipboardList, desc: t('Kaitkan tiap produk ke supplier-nya, agar pembuatan PO otomatis tahu daftar produk per supplier.', 'Link each product to its supplier, so creating a PO automatically knows the products per supplier.'), cols: 'kode_produk, nama_supplier (atau kode_supplier)', hint: t('Import Produk & Supplier dulu. Nama supplier harus sama persis dengan yang terdaftar.', 'Import Products & Suppliers first. Supplier name must match exactly.'), file: 'template_mapping_produk_supplier.csv', headers: ['kode_produk', 'nama_supplier'], examples: [['OBT-0001', 'PT Bina San Prima']], onUpload: importMapping },
    { key: 'fakturawal', title: t('Faktur / Hutang Awal', 'Opening Invoices / Debts'), Icon: Receipt, desc: t('Impor faktur pembelian yang belum lunas, langsung muncul di menu Pembayaran Faktur dengan jatuh tempo.', 'Import unpaid purchase invoices, they appear in Invoice Payments with due dates.'), cols: 'nomor_faktur, nama_supplier, tanggal_faktur (YYYY-MM-DD), term_of_payment, total', hint: t('Import Supplier dulu. Jatuh tempo dihitung dari tanggal_faktur + term_of_payment bila kolom tanggal_jatuh_tempo tidak diisi.', 'Import Suppliers first. Due date is computed from tanggal_faktur + term_of_payment if tanggal_jatuh_tempo is empty.'), file: 'template_faktur_awal.csv', headers: ['nomor_faktur', 'nama_supplier', 'tanggal_faktur', 'term_of_payment', 'total'], examples: [['INV/2025/0087', 'PT Bina San Prima', '2026-06-15', '30', '2500000']], onUpload: importFakturAwal },
  ]
  const isiHalaman = (
    <div>
      <h2 className="text-xl font-bold text-[var(--ink)] mb-1">{t('Migrasi Data', 'Data Migration')}</h2>
      <p className="text-sm text-[var(--ink-soft)] mb-5">{t('Onboarding cepat: unduh template, isi di Excel/Sheets, lalu upload CSV.', 'Fast onboarding: download a template, fill it in Excel/Sheets, then upload the CSV.')}</p>
      {app.isSuper && (
        <div className="mb-5 p-4 rounded-xl border border-amber-300 bg-amber-50 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">{t('Mode Super Admin', 'Super Admin Mode')}</p>
            <p className="text-xs text-amber-700">{t('Pilih apotek tujuan, data import/export akan masuk/diambil dari apotek ini.', 'Select a target pharmacy, imported/exported data goes to/from this pharmacy.')}</p>
          </div>
          <select value={migrasiCompany} onChange={e => setMigrasiCompany(e.target.value)}
            className="border border-amber-300 rounded-lg px-3 py-2 text-sm bg-[var(--surface)] min-w-[200px] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
            <option value="">{t('Pilih Apotek', 'Select Pharmacy')}</option>
            {app.companies.map((c: any) => <option key={c.id} value={c.id}>{c.nama}</option>)}
          </select>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {migrasiCards.map(c => (
          <div key={c.key} className="border border-[var(--line)] rounded-2xl p-4 flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] text-[var(--brand-soft)] flex items-center justify-center mb-3"><c.Icon size={18} strokeWidth={1.9} /></div>
            <h3 className="font-bold text-[var(--ink)] text-sm">{c.title}</h3>
            <p className="text-xs text-[var(--ink-soft)] mt-1 mb-3">{c.desc}</p>
            <div className="bg-[var(--surface-2)] rounded-lg p-2.5 mb-3">
              <p className="text-[10px] font-medium text-[var(--ink-soft)] mb-1">{t('Kolom CSV:', 'CSV Columns:')}</p>
              <p className="text-[10px] text-[var(--ink)] font-mono leading-relaxed break-words">{c.cols}</p>
            </div>
            <p className="text-[10px] text-[var(--ink-faint)] mb-3">{c.hint}</p>
            <div className="mt-auto flex flex-col gap-2">
              <button onClick={() => unduhCSV(c.file, c.headers, c.examples)}
                className="inline-flex items-center justify-center gap-2 border border-[var(--line)] text-[var(--brand)] py-2 rounded-lg text-xs font-medium hover:bg-[var(--surface-2)] transition">
                <Download size={14} /> {t('Download Template', 'Download Template')}
              </button>
              <label className={`inline-flex items-center justify-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] py-2 rounded-lg text-xs font-medium hover:bg-[var(--brand-hover)] transition cursor-pointer ${importing === c.key ? 'opacity-60 pointer-events-none' : ''}`}>
                <Upload size={14} /> {importing === c.key ? t('Mengimpor…', 'Importing…') : t('Upload CSV', 'Upload CSV')}
                <input type="file" accept=".csv,text/csv" className="hidden"
                  onChange={e => {
                    if (app.isSuper && !migrasiCompany) { alert(t('Pilih apotek tujuan dulu di atas.', 'Select a target pharmacy above first.')); e.target.value = ''; return }
                    if (e.target.files?.[0]) { c.onUpload(e.target.files[0]); e.target.value = '' }
                  }} />
              </label>
            </div>
            {importInfo[c.key] && (
              <p className={`text-xs mt-3 ${importInfo[c.key].startsWith('✅') ? 'text-green-700' : 'text-red-600'}`}>{importInfo[c.key]}</p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 bg-[var(--surface-2)] rounded-xl p-3.5 text-xs text-[var(--ink-soft)]">
        <p className="font-medium text-[var(--ink)] mb-1">{t('Urutan yang disarankan', 'Recommended order')}</p>
        <p>{t('1) Import Produk → 2) Supplier → 3) Stok Awal → 4) Mapping Produk–Supplier. Simpan file sebagai CSV UTF-8.', '1) Import Products → 2) Suppliers → 3) Opening Stock → 4) Product–Supplier Mapping. Save the file as CSV UTF-8.')}</p>
      </div>
      <div className="mt-5">
        <h3 className="text-sm font-bold text-[var(--ink)] mb-1">{t('Export / Backup Data', 'Export / Backup Data')}</h3>
        <p className="text-xs text-[var(--ink-soft)] mb-3">{t('Unduh data apotek saat ini ke CSV.', 'Download current pharmacy data to CSV.')}</p>
        <div className="flex flex-wrap gap-2">
          {([['Produk', exportProduk], ['Supplier', exportSupplier], ['Stok / Batch', exportStok], ['Transaksi', exportTransaksi], ['Faktur', exportFaktur]] as const).map(([label, fn]) => (
            <button key={label} onClick={() => { if (app.isSuper && !migrasiCompany) return alert(t('Pilih apotek tujuan dulu di atas.', 'Select a target pharmacy above first.')); (fn as () => void)() }}
              className="inline-flex items-center gap-2 border border-[var(--line)] text-[var(--brand)] px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[var(--surface-2)] transition"><Download size={14} /> {t('Export', 'Export')} {label}</button>
          ))}
        </div>
      </div>
    </div>
  )
  return (
    <div>
      <Link href="/pengaturan"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-soft)] hover:text-[var(--brand)] mb-4">
        <ArrowLeft size={15} /> {t('Kembali ke Pengaturan', 'Back to Settings')}
      </Link>
      {isiHalaman}
    </div>
  )
}
