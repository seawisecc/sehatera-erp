'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, Download, HeartPulse, PackageOpen, Pill, Receipt, ShieldCheck, Truck, Upload, UsersRound } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { tanggalLokal } from '@/lib/format'
import { semua } from '@/lib/semua'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { useUmpan } from '@/components/Umpan'
import { parseCSV, unduhCSV } from '@/lib/csv'
import { pesanError } from '@/lib/session'
import { boleh } from '@/lib/hak'
import { bacaSektor } from '@/lib/faskes'

/**
 * Migrasi Data: impor dan ekspor CSV.
 *
 * Sub-rute Pengaturan, bukan tab di dalamnya, karena isinya paling besar dan
 * paling jarang dibuka: satu apotek biasanya memakainya sekali seumur hidup,
 * saat pindah dari catatan lama. Menjadikannya alamat sendiri juga berarti
 * tautannya bisa dikirim ke apotek baru saat pendampingan onboarding.
 */
/** Kolom pasien yang dibaca impor dan ditulis ekspor, dalam urutan yang sama. */
const KOLOM_PASIEN = [
  'nama', 'nik', 'telepon', 'tanggal_lahir', 'tempat_lahir', 'jenis_kelamin', 'gol_darah', 'alergi',
  'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kota', 'provinsi', 'kode_pos',
  'agama', 'pekerjaan', 'nomor_bpjs', 'nomor_polis',
  'kerabat_nama', 'kerabat_hubungan', 'kerabat_telepon', 'catatan',
]

/**
 * Tanggal dari CSV jadi YYYY-MM-DD. Excel di komputer berbahasa Indonesia
 * menyimpan tanggal sebagai 31/12/1980, jadi bentuk itu ikut diterima.
 * Kosong jadi '', yang tidak terbaca jadi false supaya barisnya disebut,
 * bukan dikirim lalu ditolak database dengan pesan yang tidak menyebut kolom.
 */
function tanggalCSV(v?: string): string | false {
  const s = (v || '').trim()
  if (!s) return ''
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  let y: number, b: number, h: number
  if (m) { y = +m[1]; b = +m[2]; h = +m[3] }
  else {
    m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
    if (!m) return false
    h = +m[1]; b = +m[2]; y = +m[3]
  }
  const d = new Date(Date.UTC(y, b - 1, h))
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== b - 1 || d.getUTCDate() !== h) return false
  return `${y}-${String(b).padStart(2, '0')}-${String(h).padStart(2, '0')}`
}

export default function HalamanMigrasi() {
  const { t } = useLang()
  const { kabar } = useUmpan()
  const app = useApp()

  const [importInfo, setImportInfo] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState<string | null>(null)
  const [migrasiCompany, setMigrasiCompany] = useState('')

  // Kartu klinik (pasien, asuransi) hanya untuk faskes yang punya pasien.
  // Super admin memilih faskes tujuannya sendiri di halaman ini, jadi
  // sektornya dibaca dari pilihan itu, bukan dari klien yang sedang dilihat.
  const sektorTujuan = app.isSuper
    ? bacaSektor(app.companies.find((c: any) => c.id === migrasiCompany)?.sektor)
    : app.sektor
  const klinik = sektorTujuan !== 'apotek'
  const cidTujuan = () => (app.isSuper && migrasiCompany) ? migrasiCompany : null
  const lingkup = (q: any) => (app.isSuper && migrasiCompany) ? q.eq('company_id', migrasiCompany) : q

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
          // Tiga kolom ini sempat tertinggal saat ditambahkan ke tabel, dan
          // daftar kolom yang eksplisit tidak pernah mengeluh soal itu: impor
          // tetap "berhasil" sambil membuang barcode, rak, dan kode KFA yang
          // sudah diketik orang di berkasnya. Ini jebakan yang sama dengan
          // `saveSettings` di halaman Pengaturan.
          barcode: r.barcode?.trim() || null,
          rak: r.rak?.trim() || null,
          kode_kfa: r.kode_kfa?.trim() || null,
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
        if (!prod) { gagal.push(`${kode} (produk tidak ditemukan)`); continue }
        const qty = +(r.stok_batch || 0) || 0
        if (qty <= 0) { gagal.push(`${kode} (stok_batch harus lebih dari nol)`); continue }
        // Stok total hanya dinaikkan kalau batch-nya BENAR-BENAR tersimpan.
        // Versi lama membuang galat insert lalu tetap menaikkan stok, jadi
        // stok produk bertambah tanpa batch. Sejak SIPNAP dijangkarkan ke
        // stok sistem, selisih seperti itu langsung jadi saldo narkotika yang
        // salah di laporan wajib.
        const { data: batch, error: eb } = await supabase.from('product_batches')
          .insert([{ product_id: prod.id, batch_number: r.batch_number || null, expired_date: r.expired_date || null, stok_batch: qty, ...(cid ? { company_id: cid } : {}) }])
          .select('id').single()
        if (eb || !batch) { gagal.push(`${kode} (${eb ? pesanError(eb) : 'batch tidak tersimpan'})`); continue }
        const { error: ep } = await supabase.from('products').update({ stok_total: (prod.stok_total || 0) + qty }).eq('id', prod.id)
        if (ep) {
          // Batch dibuang lagi supaya keduanya tidak berselisih.
          await supabase.from('product_batches').delete().eq('id', batch.id)
          gagal.push(`${kode} (${pesanError(ep)})`); continue
        }
        ok++
      }
      setImportInfo(p => ({ ...p, stok: `✅ ${ok} batch stok awal diimpor.` + (gagal.length ? ` ${gagal.length} gagal: ${gagal.slice(0, 5).join('; ')}` : '') }))
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

  /**
   * Mengisi kode KFA ke produk yang SUDAH ada, dicocokkan lewat kode produk.
   *
   * Terpisah dari impor katalog karena tindakannya berbeda: yang itu MEMBUAT
   * produk baru, yang ini MEMPERBARUI yang sudah ada. Katalog yang sudah
   * berjalan setahun tidak bisa diimpor ulang cuma untuk menambahkan satu
   * kolom, dan mengetik kode KFA satu per satu lewat formulir untuk delapan
   * ratus obat bukan pekerjaan yang akan pernah selesai.
   *
   * Kode KFA dicari sekali di kfa-browser SatuSehat lalu ditempel massal.
   * Tanpa ini, resep tidak akan pernah bisa dikirim.
   */
  const importKfa = async (file: File) => {
    const cid = (app.isSuper && migrasiCompany) ? migrasiCompany : null
    setImporting('kfa'); setImportInfo(p => ({ ...p, kfa: '' }))
    try {
      const rows = parseCSV(await file.text())
      const valid = rows.filter(r => (r.kode_produk || r.kode) && r.kode_kfa)
      if (valid.length === 0) {
        setImportInfo(p => ({ ...p, kfa: 'Tidak ada baris valid (butuh kode_produk & kode_kfa).' })); return
      }
      let ok = 0; const gagal: string[] = []
      for (const r of valid) {
        const kode = String(r.kode_produk || r.kode).trim()
        const kfa = String(r.kode_kfa).trim()
        // Bentuknya diperiksa DI SINI juga, bukan cuma di database, supaya
        // baris yang salah disebut namanya alih-alih menggagalkan seluruh
        // berkas dengan satu pesan constraint.
        if (!/^9[23][0-9]{6}$/.test(kfa)) { gagal.push(`${kode} (kode "${kfa}" bukan 8 angka diawali 92/93)`); continue }
        let q = supabase.from('products').update({ kode_kfa: kfa }).eq('kode', kode)
        if (cid) q = q.eq('company_id', cid)
        // `select()` sesudah update mengembalikan baris yang benar-benar
        // tersentuh. Nol baris berarti kodenya tidak ada, dan itu harus
        // disebut namanya, bukan dihitung sebagai berhasil.
        const { data, error } = await q.select('id')
        if (error) { gagal.push(`${kode} (${error.message})`); continue }
        if (!data?.length) { gagal.push(`${kode} (produk tidak ditemukan)`); continue }
        ok++
      }
      setImportInfo(p => ({ ...p, kfa: `✅ ${ok} produk dapat kode KFA.` + (gagal.length ? ` ${gagal.length} gagal: ${gagal.slice(0, 4).join('; ')}` : '') }))
    } catch (e: any) { setImportInfo(p => ({ ...p, kfa: 'Gagal membaca file: ' + (e?.message || e) })) }
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
        const tf = r.tanggal_faktur || tanggalLokal()
        const top = +(r.term_of_payment || 0) || 0
        let jt = r.tanggal_jatuh_tempo
        if (!jt) { const d = new Date(tf); d.setDate(d.getDate() + top); jt = tanggalLokal(d) }
        await supabase.from('faktur').insert([{ nomor_faktur: r.nomor_faktur.trim(), supplier_id: sup.id, tanggal_faktur: tf, term_of_payment: top, tanggal_jatuh_tempo: jt, total: +(r.total || 0) || 0, status: 'belum_bayar', ...(cid ? { company_id: cid } : {}) }])
        ok++
      }
      setImportInfo(p => ({ ...p, fakturawal: `✅ ${ok} faktur/hutang awal diimpor.` + (gagal.length ? ` ${gagal.length} supplier tidak ditemukan: ${gagal.slice(0, 5).join(', ')}` : '') }))
    } catch (e: any) { setImportInfo(p => ({ ...p, fakturawal: 'Gagal membaca file: ' + (e?.message || e) })) }
    finally { setImporting(null) }
  }

  /**
   * Pasien dari sistem lama, satu per satu lewat `simpan_pasien()`.
   *
   * BUKAN insert langsung ke `patients`: di tabel itu tidak ada trigger yang
   * menahan NIK dan telepon kosong, aturannya hanya ada di dalam fungsinya
   * (0059). Insert massal akan meloloskan ribuan pasien tanpa identitas, dan
   * nomor RM, jejak audit, serta penolakan NIK kembar ikut terlewat.
   *
   * Nomor RM selalu diterbitkan BARU oleh Sehatera, karena deretnya per faskes
   * dan dijaga indeks unik. Nomor dari sistem lama disimpan di catatan supaya
   * berkas kertas yang sudah ada tetap bisa dicari.
   *
   * Pasien tanpa NIK atau telepon hanya masuk kalau kolom alasan_identitas
   * diisi: jalurnya sama dengan pasien gawat darurat di loket, dan alasannya
   * masuk jejak audit. Mengarang NIK supaya impornya lolos jauh lebih buruk.
   */
  const importPasien = async (file: File) => {
    const cid = cidTujuan()
    setImporting('pasien'); setImportInfo(p => ({ ...p, pasien: '' }))
    try {
      const rows = parseCSV(await file.text())
      const valid = rows.filter(r => r.nama)
      if (valid.length === 0) { setImportInfo(p => ({ ...p, pasien: 'Tidak ada baris valid (kolom nama kosong).' })); return }
      let ok = 0, kembar = 0; const gagal: string[] = []
      for (let i = 0; i < valid.length; i++) {
        const r = valid[i]
        if (i % 25 === 0) setImportInfo(p => ({ ...p, pasien: `Memproses ${i} dari ${valid.length}…` }))
        const lahir = tanggalCSV(r.tanggal_lahir)
        if (lahir === false) { gagal.push(`${r.nama} (tanggal_lahir "${r.tanggal_lahir}" tidak terbaca)`); continue }
        const jk = (r.jenis_kelamin || '').trim().toUpperCase()
        const kelamin = !jk ? '' : jk.startsWith('L') ? 'L' : jk.startsWith('P') ? 'P' : null
        if (kelamin === null) { gagal.push(`${r.nama} (jenis_kelamin harus L atau P)`); continue }
        const nik = (r.nik || '').replace(/\D/g, '')
        const alasan = (r.alasan_identitas || '').trim()
        const darurat = !!alasan && (!nik || !(r.telepon || '').trim())
        const catatan = [r.catatan, r.nomor_rm_lama ? `No. RM lama: ${r.nomor_rm_lama}` : ''].filter(Boolean).join(' | ')
        const isi: Record<string, any> = {
          nama: r.nama, nik, telepon: r.telepon, tanggal_lahir: lahir || '', jenis_kelamin: kelamin,
          tempat_lahir: r.tempat_lahir, alamat: r.alamat, rt: r.rt, rw: r.rw, kelurahan: r.kelurahan,
          kecamatan: r.kecamatan, kota: r.kota, provinsi: r.provinsi, kode_pos: r.kode_pos,
          gol_darah: r.gol_darah, alergi: r.alergi, agama: r.agama, pekerjaan: r.pekerjaan,
          nomor_bpjs: r.nomor_bpjs, nomor_polis: r.nomor_polis,
          kerabat_nama: r.kerabat_nama, kerabat_hubungan: r.kerabat_hubungan, kerabat_telepon: r.kerabat_telepon,
          catatan, identitas_belum_lengkap: darurat, alasan_identitas: darurat ? alasan : '',
        }
        const { error } = await supabase.rpc('simpan_pasien', { p_id: null, p_data: isi, p_company: cid })
        if (error) {
          // NIK yang sudah ada bukan kegagalan: impor yang diulang sesudah
          // terputus di tengah jalan memang akan menemuinya.
          if ((error.message || '').includes('sudah terdaftar')) { kembar++; continue }
          gagal.push(`${r.nama} (${pesanError(error)})`); continue
        }
        ok++
      }
      setImportInfo(p => ({ ...p, pasien: `✅ ${ok} pasien diimpor.`
        + (kembar ? ` ${kembar} dilewati karena NIK-nya sudah terdaftar.` : '')
        + (gagal.length ? ` ${gagal.length} gagal: ${gagal.slice(0, 4).join('; ')}` : '') }))
    } catch (e: any) { setImportInfo(p => ({ ...p, pasien: 'Gagal membaca file: ' + (e?.message || e) })) }
    finally { setImporting(null) }
  }

  /**
   * Tarif layanan. Nama yang sudah ada dilewati, bukan digandakan: dua baris
   * "Konsultasi Dokter Umum" berharga beda membuat kasir memilih yang mana
   * saja, dan selisihnya tidak pernah ketahuan.
   */
  const importLayanan = async (file: File) => {
    const cid = cidTujuan()
    setImporting('layanan'); setImportInfo(p => ({ ...p, layanan: '' }))
    try {
      const rows = parseCSV(await file.text())
      const valid = rows.filter(r => r.nama)
      if (valid.length === 0) { setImportInfo(p => ({ ...p, layanan: 'Tidak ada baris valid (kolom nama kosong).' })); return }
      const { data: ada, error: ea } = await semua(() => lingkup(supabase.from('services').select('id, nama')))
      if (ea) { setImportInfo(p => ({ ...p, layanan: 'Error: ' + pesanError(ea) })); return }
      const sudah = new Set((ada || []).map((x: any) => String(x.nama).trim().toLowerCase()))
      const gagal: string[] = []; let kembar = 0
      const payload: any[] = []
      for (const r of valid) {
        const nama = r.nama.trim()
        if (sudah.has(nama.toLowerCase())) { kembar++; continue }
        const icd9 = (r.kode_icd9 || '').trim()
        if (icd9 && !/^[0-9]{2}(\.[0-9]{1,3})?$/.test(icd9)) { gagal.push(`${nama} (kode_icd9 "${icd9}" bukan bentuk ICD-9-CM, contoh 86.59)`); continue }
        const jenis = (r.jenis_penunjang || '').trim().toLowerCase()
        if (jenis && jenis !== 'lab' && jenis !== 'radiologi') { gagal.push(`${nama} (jenis_penunjang harus lab, radiologi, atau kosong)`); continue }
        sudah.add(nama.toLowerCase())
        payload.push({ nama, harga: +(r.harga || 0) || 0, deskripsi: r.deskripsi || null, kode_icd9: icd9 || null,
          jenis_penunjang: jenis || null, ...(cid ? { company_id: cid } : {}) })
      }
      if (payload.length) {
        const { error } = await supabase.from('services').insert(payload)
        if (error) { setImportInfo(p => ({ ...p, layanan: 'Error: ' + pesanError(error) })); return }
      }
      setImportInfo(p => ({ ...p, layanan: `✅ ${payload.length} layanan diimpor.`
        + (kembar ? ` ${kembar} dilewati karena namanya sudah ada.` : '')
        + (gagal.length ? ` ${gagal.length} gagal: ${gagal.slice(0, 4).join('; ')}` : '') }))
    } catch (e: any) { setImportInfo(p => ({ ...p, layanan: 'Gagal membaca file: ' + (e?.message || e) })) }
    finally { setImporting(null) }
  }

  /** Asuransi rekanan. Nama unik per faskes (indeks `uq_insurer_nama`), jadi yang sudah ada dilewati. */
  const importAsuransi = async (file: File) => {
    const cid = cidTujuan()
    setImporting('asuransi'); setImportInfo(p => ({ ...p, asuransi: '' }))
    try {
      const rows = parseCSV(await file.text())
      const valid = rows.filter(r => r.nama)
      if (valid.length === 0) { setImportInfo(p => ({ ...p, asuransi: 'Tidak ada baris valid (kolom nama kosong).' })); return }
      const { data: ada, error: ea } = await lingkup(supabase.from('insurers').select('nama'))
      if (ea) { setImportInfo(p => ({ ...p, asuransi: 'Error: ' + pesanError(ea) })); return }
      const sudah = new Set((ada || []).map((x: any) => String(x.nama).trim().toLowerCase()))
      let kembar = 0
      const payload: any[] = []
      for (const r of valid) {
        const nama = r.nama.trim()
        if (sudah.has(nama.toLowerCase())) { kembar++; continue }
        sudah.add(nama.toLowerCase())
        payload.push({ nama, kode: r.kode || null, catatan: r.catatan || null, ...(cid ? { company_id: cid } : {}) })
      }
      if (payload.length) {
        const { error } = await supabase.from('insurers').insert(payload)
        if (error) { setImportInfo(p => ({ ...p, asuransi: 'Error: ' + pesanError(error) })); return }
      }
      setImportInfo(p => ({ ...p, asuransi: `✅ ${payload.length} asuransi diimpor.` + (kembar ? ` ${kembar} dilewati karena sudah ada.` : '') }))
    } catch (e: any) { setImportInfo(p => ({ ...p, asuransi: 'Gagal membaca file: ' + (e?.message || e) })) }
    finally { setImporting(null) }
  }

  // ── Export / Backup ke CSV ──
  /**
   * Ekspor yang GAGAL dikatakan, bukan diunduh kosong. Berkas cadangan yang
   * diam-diam berisi header saja baru ketahuan kosong pada hari ia dibutuhkan.
   */
  const unduh = (berkas: string, headers: string[], error: any, baris: any[], peta: (x: any) => any[]) => {
    if (error) { kabar(pesanError(error), 'galat'); return }
    unduhCSV(berkas, headers, baris.map(x => peta(x).map(v => String(v ?? ''))))
    kabar(t(`${baris.length} baris diunduh.`, `${baris.length} rows downloaded.`), 'ok')
  }

  // Kolomnya SAMA dengan template impor, termasuk barcode, rak, dan kode KFA,
  // supaya berkas hasil ekspor bisa langsung diimpor ke outlet lain.
  const exportProduk = async () => {
    const { data, error } = await semua(() => lingkup(supabase.from('products').select('*').order('kode')))
    const headers = ['kode', 'nama_obat', 'nama_generik', 'kandungan', 'kategori', 'satuan', 'isi_kemasan', 'harga_beli', 'harga_jual', 'stok_total', 'stok_minimum', 'barcode', 'rak', 'kode_kfa']
    unduh('export_produk.csv', headers, error, data, (p: any) => headers.map(h => p[h]))
  }
  const exportSupplier = async () => {
    const { data, error } = await semua(() => lingkup(supabase.from('suppliers').select('*').order('kode')))
    const headers = ['kode', 'nama_supplier', 'jenis', 'alamat', 'telepon', 'email']
    unduh('export_supplier.csv', headers, error, data, (x: any) => headers.map(h => x[h]))
  }
  const exportStok = async () => {
    const { data, error } = await semua(() => lingkup(supabase.from('product_batches').select('*, products(kode, nama_obat)').order('expired_date')))
    unduh('export_stok_batch.csv', ['kode_produk', 'nama_obat', 'batch_number', 'expired_date', 'stok_batch'], error, data,
      (b: any) => [b.products?.kode, b.products?.nama_obat, b.batch_number, b.expired_date, b.stok_batch])
  }
  // Uang yang diterima dan yang ditagihkan ke penjamin dipisah, sama seperti
  // di laporan (0051). Satu kolom "total" saja membuat piutang BPJS terbaca
  // sebagai uang di laci.
  const exportTransaksi = async () => {
    const { data, error } = await semua(() => lingkup(supabase.from('transactions').select('*').order('created_at', { ascending: false })))
    unduh('export_transaksi.csv',
      ['nomor_transaksi', 'tanggal', 'total', 'diterima_tunai', 'ditagihkan_penjamin', 'penjamin', 'metode_bayar', 'bayar', 'kembalian', 'status', 'kasir', 'nama_pasien', 'kontak_pasien', 'alamat_pasien', 'nomor_resep', 'dibatalkan_pada', 'dibatalkan_oleh', 'catatan_pembatalan'],
      error, data, (x: any) => [x.nomor_transaksi, x.created_at, x.total, x.diterima_tunai, x.ditagihkan_penjamin, x.penjamin, x.metode_bayar,
        x.bayar, x.kembalian, x.status, x.dibuat_oleh, x.nama_pasien, x.kontak_pasien, x.alamat_pasien, x.nomor_resep,
        x.dibatalkan_pada, x.dibatalkan_oleh, x.catatan_pembatalan])
  }
  const exportFaktur = async () => {
    const { data, error } = await semua(() => lingkup(supabase.from('faktur').select('*, suppliers(nama_supplier), purchase_orders(nomor_po)').order('tanggal_faktur', { ascending: false })))
    unduh('export_faktur.csv',
      ['nomor_faktur', 'supplier', 'nomor_po', 'tanggal_faktur', 'term_of_payment', 'tanggal_jatuh_tempo', 'total', 'status', 'tanggal_bayar', 'metode_bayar', 'catatan_bayar'],
      error, data, (f: any) => [f.nomor_faktur, f.suppliers?.nama_supplier, f.purchase_orders?.nomor_po, f.tanggal_faktur,
        f.term_of_payment, f.tanggal_jatuh_tempo, f.total, f.status, f.tanggal_bayar, f.metode_bayar, f.catatan_bayar])
  }
  const exportLayanan = async () => {
    const { data, error } = await semua(() => lingkup(supabase.from('services').select('*').order('nama')))
    const headers = ['nama', 'harga', 'deskripsi', 'kode_icd9', 'jenis_penunjang', 'status']
    unduh('export_layanan.csv', headers, error, data, (x: any) => headers.map(h => x[h]))
  }
  /** Satu baris per baris hitung, karena selisih dan alasannya ada di tingkat batch. */
  const exportOpname = async () => {
    const { data, error } = await semua(() => lingkup(supabase.from('stock_opname_items')
      .select('stok_sistem, stok_fisik, selisih, alasan, catatan, stock_opnames(nomor, tanggal, status, dibuat_oleh, difinalkan_oleh, difinalkan_pada), products(kode, nama_obat), product_batches(batch_number, expired_date)')))
    unduh('export_stok_opname.csv',
      ['nomor_opname', 'tanggal', 'status', 'dihitung_oleh', 'difinalkan_oleh', 'difinalkan_pada', 'kode_produk', 'nama_obat', 'batch_number', 'expired_date', 'stok_sistem', 'stok_fisik', 'selisih', 'alasan', 'catatan'],
      error, data, (x: any) => [x.stock_opnames?.nomor, x.stock_opnames?.tanggal, x.stock_opnames?.status, x.stock_opnames?.dibuat_oleh,
        x.stock_opnames?.difinalkan_oleh, x.stock_opnames?.difinalkan_pada, x.products?.kode, x.products?.nama_obat,
        x.product_batches?.batch_number ?? '(tanpa batch)', x.product_batches?.expired_date, x.stok_sistem, x.stok_fisik, x.selisih, x.alasan, x.catatan])
  }
  /**
   * Transfer KELUAR dan MASUK sekaligus. Nama outlet lawan dari `outlet_saya`,
   * bukan embed `companies`: RLS companies hanya membuka faskes yang sedang
   * dibuka, jadi embed ke outlet lain kosong tanpa galat.
   */
  const exportTransfer = async () => {
    const x = cidTujuan()
    const [{ data: o }, { data, error }] = await Promise.all([
      supabase.rpc('outlet_saya'),
      semua(() => {
        const q = supabase.from('stock_transfer_items')
          .select('qty, nama_obat, batch_number, expired_date, satuan, company_id, ke_company_id, stock_transfers(nomor, status, dibuat_oleh, dibuat_pada, diterima_oleh, diterima_pada, alasan_batal)')
        return x ? q.or(`company_id.eq.${x},ke_company_id.eq.${x}`) : q
      }),
    ])
    const nama = (id: string) => ((o as any[]) || []).find(k => k.id === id)?.nama || id
    unduh('export_transfer_stok.csv',
      ['nomor_transfer', 'status', 'dari_outlet', 'ke_outlet', 'nama_obat', 'batch_number', 'expired_date', 'qty', 'satuan', 'dikirim_oleh', 'dikirim_pada', 'diterima_oleh', 'diterima_pada', 'alasan_batal'],
      error, data, (r: any) => [r.stock_transfers?.nomor, r.stock_transfers?.status, nama(r.company_id), nama(r.ke_company_id),
        r.nama_obat, r.batch_number, r.expired_date, r.qty, r.satuan, r.stock_transfers?.dibuat_oleh, r.stock_transfers?.dibuat_pada,
        r.stock_transfers?.diterima_oleh, r.stock_transfers?.diterima_pada, r.stock_transfers?.alasan_batal])
  }

  // Kolom pasien SAMA dengan template impornya.
  const exportPasien = async () => {
    const { data, error } = await semua(() => lingkup(supabase.from('patients').select('*').order('nomor_rm')))
    unduh('export_pasien.csv', ['nomor_rm', ...KOLOM_PASIEN, 'identitas_belum_lengkap', 'alasan_identitas', 'ihs_id'], error, data,
      (x: any) => [x.nomor_rm, ...KOLOM_PASIEN.map(h => x[h]), x.identitas_belum_lengkap ? 'ya' : '', x.alasan_identitas, x.ihs_id])
  }
  /**
   * Kunjungan beserta diagnosis primernya. Diagnosis diambil terpisah lalu
   * dipasangkan di sini, karena ia data rekam medis dan tombolnya hanya
   * untuk yang memang boleh membaca rekam medis.
   */
  const exportKunjungan = async () => {
    const [{ data, error }, { data: dx, error: edx }] = await Promise.all([
      semua(() => lingkup(supabase.from('visits')
        .select('id, nomor, tanggal, status, penjamin, nomor_penjamin, jenis_kunjungan, keluhan, dokter_email, dibuka_pada, ditutup_pada, patients(nomor_rm, nama, nik), clinic_units(nama), insurers(nama)')
        .order('tanggal', { ascending: false }))),
      semua(() => lingkup(supabase.from('visit_diagnoses').select('visit_id, kode_icd10, nama').eq('tipe', 'primer'))),
    ])
    const primer = new Map(((dx as any[]) || []).map(d => [d.visit_id, d]))
    unduh('export_kunjungan.csv',
      ['nomor', 'tanggal', 'status', 'nomor_rm', 'nama_pasien', 'nik', 'poli', 'dokter', 'jenis_kunjungan', 'penjamin', 'asuransi', 'nomor_penjamin', 'keluhan', 'diagnosis_primer_icd10', 'diagnosis_primer', 'dibuka_pada', 'ditutup_pada'],
      error || edx, data, (v: any) => [v.nomor, v.tanggal, v.status, v.patients?.nomor_rm, v.patients?.nama, v.patients?.nik,
        v.clinic_units?.nama, v.dokter_email, v.jenis_kunjungan, v.penjamin, v.insurers?.nama, v.nomor_penjamin, v.keluhan,
        primer.get(v.id)?.kode_icd10, primer.get(v.id)?.nama, v.dibuka_pada, v.ditutup_pada])
  }
  const exportAsuransi = async () => {
    const { data, error } = await lingkup(supabase.from('insurers').select('*').order('nama'))
    unduh('export_asuransi.csv', ['nama', 'kode', 'catatan', 'aktif'], error, data || [], (x: any) => [x.nama, x.kode, x.catatan, x.aktif ? 'ya' : 'tidak'])
  }

  const migrasiCards = [
    { key: 'produk', title: t('Daftar Produk', 'Product List'), Icon: Pill, desc: t('Impor katalog obat: nama, kategori, harga, dan stok awal.', 'Import the drug catalog: name, category, price, and opening stock.'), cols: 'kode (opsional), nama_obat, nama_generik, kandungan, kategori, satuan, isi_kemasan, harga_beli, harga_jual, stok_total, stok_minimum, barcode, rak, kode_kfa', hint: t('Kategori: bebas, bebas_terbatas, keras, suplemen, psikotropika, narkotika, prekursor, alkes, lainnya.', 'Category: bebas, bebas_terbatas, keras, suplemen, psikotropika, narkotika, prekursor, alkes, lainnya.'), file: 'template_produk.csv', headers: ['kode', 'nama_obat', 'nama_generik', 'kandungan', 'kategori', 'satuan', 'isi_kemasan', 'harga_beli', 'harga_jual', 'stok_total', 'stok_minimum', 'barcode', 'rak', 'kode_kfa'], examples: [['', 'Paracetamol 500mg', 'Paracetamol', 'Paracetamol 500 mg', 'bebas', 'Tablet', '100', '500', '1000', '150', '10', '8992745110017', 'A1-1', '93000001']], onUpload: importProduk },
    { key: 'supplier', title: t('Daftar Supplier', 'Supplier List'), Icon: Truck, desc: t('Impor daftar PBF / supplier obat.', 'Import the list of distributors / drug suppliers.'), cols: 'nama_supplier, jenis, alamat, telepon, email', hint: t('Jenis yang valid: PBF, Subdistributor, atau Lainnya (nilai lain otomatis disesuaikan).', 'Valid types: PBF, Subdistributor, or Lainnya (other values auto-adjusted).'), file: 'template_supplier.csv', headers: ['nama_supplier', 'jenis', 'alamat', 'telepon', 'email'], examples: [['PT Bina San Prima', 'PBF', 'Jl. Industri No. 1', '021-1234567', 'sales@binasan.co.id']], onUpload: importSupplier },
    { key: 'stok', title: t('Stok Awal (Batch)', 'Opening Stock (Batch)'), Icon: PackageOpen, desc: t('Impor stok awal per batch + expired date. Dicocokkan ke produk lewat kode.', 'Import opening stock per batch + expiry date. Matched to products by code.'), cols: 'kode_produk, batch_number, expired_date (YYYY-MM-DD), stok_batch', hint: t('Impor Produk dulu agar kode-nya tersedia. Stok batch akan menambah stok total produk.', 'Import Products first so codes exist. Batch stock adds to the total product stock.'), file: 'template_stok_awal.csv', headers: ['kode_produk', 'batch_number', 'expired_date', 'stok_batch'], examples: [['OBT-0001', 'BT-2401', '2026-12-31', '150']], onUpload: importStok },
    { key: 'mapping', title: t('Mapping Produk–Supplier', 'Product–Supplier Mapping'), Icon: ClipboardList, desc: t('Kaitkan tiap produk ke supplier-nya, agar pembuatan PO otomatis tahu daftar produk per supplier.', 'Link each product to its supplier, so creating a PO automatically knows the products per supplier.'), cols: 'kode_produk, nama_supplier (atau kode_supplier)', hint: t('Import Produk & Supplier dulu. Nama supplier harus sama persis dengan yang terdaftar.', 'Import Products & Suppliers first. Supplier name must match exactly.'), file: 'template_mapping_produk_supplier.csv', headers: ['kode_produk', 'nama_supplier'], examples: [['OBT-0001', 'PT Bina San Prima']], onUpload: importMapping },
    { key: 'kfa', title: t('Kode KFA Obat', 'Drug KFA Codes'), Icon: Pill, desc: t('Isi kode KFA ke produk yang SUDAH ada, dicocokkan lewat kode produk. Tanpa kode KFA, resep obat ini tidak bisa dikirim ke SatuSehat.', 'Fill KFA codes into EXISTING products, matched by product code. Without a KFA code, prescriptions for this drug cannot be sent to SatuSehat.'), cols: 'kode_produk, kode_kfa', hint: t('Kode dicari di kfa-browser SatuSehat. Delapan angka: awalan 92 untuk produk template (zat aktif dan kekuatannya), 93 untuk produk aktual (merek tertentu).', 'Look codes up in the SatuSehat KFA browser. Eight digits: prefix 92 for template products, 93 for actual branded products.'), file: 'template_kode_kfa.csv', headers: ['kode_produk', 'kode_kfa'], examples: [['OBT-0001', '93000001']], onUpload: importKfa },
    { key: 'layanan', title: t('Layanan & Tarif', 'Services & Fees'), Icon: HeartPulse, desc: t('Impor daftar layanan jasa beserta tarifnya, termasuk paket lab dan radiologi.', 'Import services and their fees, including lab and imaging packages.'), cols: 'nama, harga, deskripsi, kode_icd9, jenis_penunjang', hint: t('kode_icd9 untuk tindakan (contoh 86.59), dikirim ke SatuSehat sebagai Procedure. jenis_penunjang: lab, radiologi, atau kosong. Nama yang sudah ada dilewati. Biaya administrasi tidak di sini: aturnya di menu Layanan Jasa.', 'kode_icd9 for procedures (e.g. 86.59), sent to SatuSehat as Procedure. jenis_penunjang: lab, radiologi, or empty. Existing names are skipped. The administration fee is not here: set it in Services.'), file: 'template_layanan.csv', headers: ['nama', 'harga', 'deskripsi', 'kode_icd9', 'jenis_penunjang'], examples: [['Jahit luka (per jahitan)', '25000', '', '86.59', ''], ['Darah Lengkap', '85000', 'Hematologi rutin', '', 'lab']], onUpload: importLayanan },
    ...(klinik ? [
      { key: 'pasien', title: t('Data Pasien', 'Patient Records'), Icon: UsersRound, desc: t('Impor identitas pasien dari sistem lama. Nomor RM diterbitkan baru; nomor lama disimpan di catatan.', 'Import patient identities from the old system. New MR numbers are issued; the old number is kept in the notes.'), cols: [...KOLOM_PASIEN, 'nomor_rm_lama', 'alasan_identitas'].join(', '), hint: t('NIK (16 angka) dan telepon wajib. Kalau memang tidak ada, isi alasan_identitas; alasannya masuk jejak audit. NIK yang sudah terdaftar dilewati, jadi aman diulang. jenis_kelamin: L atau P. Tanggal: YYYY-MM-DD atau DD/MM/YYYY. Hanya identitas: riwayat rekam medis lama tidak ikut.', 'NIK (16 digits) and phone are required. If unavailable, fill alasan_identitas; it goes to the audit trail. Registered NIKs are skipped, so re-running is safe. jenis_kelamin: L or P. Dates: YYYY-MM-DD or DD/MM/YYYY. Identity only: old medical records are not imported.'), file: 'template_pasien.csv', headers: [...KOLOM_PASIEN, 'nomor_rm_lama', 'alasan_identitas'], examples: [['I Wayan Sudiarta', '5171010101800001', '081234567890', '1980-01-01', 'Denpasar', 'L', 'O', 'Amoksisilin', 'Jl. Gatot Subroto 12', '001', '002', 'Dangin Puri', 'Denpasar Timur', 'Denpasar', 'Bali', '80232', 'Hindu', 'Wiraswasta', '0001234567890', '', 'Ni Made Sari', 'Istri', '081298765432', '', 'RM-0451', '']], onUpload: importPasien },
      { key: 'asuransi', title: t('Asuransi Rekanan', 'Partner Insurers'), Icon: ShieldCheck, desc: t('Impor daftar asuransi swasta yang bekerja sama. BPJS tidak perlu didaftarkan.', 'Import partner private insurers. BPJS does not need to be listed.'), cols: 'nama, kode, catatan', hint: t('Nama yang sudah ada dilewati.', 'Existing names are skipped.'), file: 'template_asuransi.csv', headers: ['nama', 'kode', 'catatan'], examples: [['Mandiri Inhealth', 'INH', 'Kontrak sampai Des 2027']], onUpload: importAsuransi },
    ] : []),
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
            <p className="text-xs text-amber-700">{t('Pilih faskes tujuan, data impor/ekspor akan masuk ke atau diambil dari faskes ini.', 'Select a target facility, imported/exported data goes to/from this facility.')}</p>
          </div>
          <select value={migrasiCompany} onChange={e => setMigrasiCompany(e.target.value)}
            className="border border-amber-300 rounded-lg px-3 py-2 text-sm bg-[var(--surface)] min-w-[200px] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
            <option value="">{t('Pilih faskes', 'Select facility')}</option>
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
                    if (app.isSuper && !migrasiCompany) { kabar(t('Pilih faskes tujuan dulu di atas.', 'Select a target facility above first.')); e.target.value = ''; return }
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
        <p>{t('1) Produk → 2) Supplier → 3) Stok Awal → 4) Mapping Produk–Supplier → 5) Layanan & Tarif. Simpan file sebagai CSV UTF-8.', '1) Products → 2) Suppliers → 3) Opening Stock → 4) Product–Supplier Mapping → 5) Services & Fees. Save the file as CSV UTF-8.')}</p>
        {klinik && <p className="mt-1">{t('Untuk klinik: Asuransi Rekanan dan Data Pasien bisa diimpor kapan saja, urutannya tidak saling bergantung.', 'For clinics: Partner Insurers and Patient Records can be imported at any time, in any order.')}</p>}
      </div>
      <div className="mt-5">
        <h3 className="text-sm font-bold text-[var(--ink)] mb-1">{t('Export / Backup Data', 'Export / Backup Data')}</h3>
        <p className="text-xs text-[var(--ink-soft)] mb-3">{t('Unduh data faskes saat ini ke CSV. Ekspor Produk, Layanan, Pasien, dan Asuransi memakai kolom yang sama dengan templatenya, jadi bisa diimpor ulang ke outlet lain.', 'Download current facility data to CSV. Product, Service, Patient, and Insurer exports use the same columns as their templates, so they can be re-imported into another outlet.')}</p>
        <div className="flex flex-wrap gap-2">
          {([
            [t('Produk', 'Products'), exportProduk], ['Supplier', exportSupplier], [t('Stok / Batch', 'Stock / Batch'), exportStok],
            [t('Transaksi', 'Sales'), exportTransaksi], [t('Faktur', 'Invoices'), exportFaktur], [t('Layanan', 'Services'), exportLayanan],
            [t('Stok Opname', 'Stock Take'), exportOpname], [t('Transfer Stok', 'Stock Transfer'), exportTransfer],
            ...(klinik ? [[t('Pasien', 'Patients'), exportPasien], [t('Asuransi', 'Insurers'), exportAsuransi]] : []),
            // Kunjungan membawa diagnosis, jadi tombolnya ikut hak rekam medis.
            ...(klinik && boleh(app.currentRole, 'rekam_medis.baca', app.isSuper) ? [[t('Kunjungan & Diagnosis', 'Visits & Diagnoses'), exportKunjungan]] : []),
          ] as [string, () => void][]).map(([label, fn]) => (
            <button key={label} onClick={() => { if (app.isSuper && !migrasiCompany) return kabar(t('Pilih faskes tujuan dulu di atas.', 'Select a target facility above first.')); (fn as () => void)() }}
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
