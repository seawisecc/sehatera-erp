'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardCheck, Search, ArrowLeft, Printer } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { semua } from '@/lib/semua'
import { useApp } from '@/lib/app-context'
import { usePemuat } from '@/lib/pemuat'
import { useLang } from '@/lib/i18n'
import { useUmpan } from '@/components/Umpan'
import { pesanError } from '@/lib/session'
import { boleh } from '@/lib/hak'
import { angka, tanggal, tanggalJam } from '@/lib/format'
import { KATEGORI_LABEL, TBL_WRAP, TBL_KARTU, TBL_KARTU_WADAH, TBL, THEAD, TH_L, TH_R, TH_C, TR } from '@/lib/ui'
import { useBertahap, TombolLagi } from '@/lib/bertahap'
import Dialog, { TOMBOL_KEDUA, TOMBOL_UTAMA } from '@/components/Dialog'
import { bukaCetak, lembarOpname } from '@/lib/cetak'

/**
 * Stok opname: menghitung fisik, lalu menyesuaikan stok DENGAN ALASAN.
 *
 * Seluruh aturannya ditegakkan database (migrasi 0089): satu draf per faskes,
 * semua baris wajib dihitung, selisih wajib beralasan, penyesuaiannya relatif,
 * dan hanya pemilik, admin, atau apoteker yang memfinalkan. Layar ini cuma
 * menyembunyikan tombol yang sudah pasti ditolak.
 *
 * Sengaja TIDAK ada tombol "isi semua sesuai sistem". Tombol itu membuat
 * orang melewati penghitungan, dan justru itu yang hendak dihentikan fitur
 * ini: baris yang tidak dihitung bukan berarti tidak berubah.
 */

type Opname = {
  id: string; nomor: string | null; tanggal: string; kategori: string | null; catatan: string | null
  status: 'draf' | 'final' | 'batal'; dibuat_oleh: string | null; dibuat_pada: string
  difinalkan_oleh: string | null; difinalkan_pada: string | null; alasan_batal: string | null
}

type Baris = {
  id: string; product_id: string; batch_id: string | null
  stok_sistem: number; stok_fisik: number | null; selisih: number | null
  alasan: string | null; catatan: string | null
  products: { nama_obat: string; kode: string | null; satuan: string | null; kategori: string | null; rak: string | null } | null
  product_batches: { batch_number: string | null; expired_date: string | null } | null
}

type Ubahan = { stok_fisik: number | null; alasan: string | null }

const ALASAN: [string, string, string][] = [
  ['rusak', 'Rusak', 'Damaged'],
  ['hilang', 'Hilang', 'Missing'],
  ['kedaluwarsa', 'Kedaluwarsa', 'Expired'],
  ['salah_catat', 'Salah catat', 'Recording error'],
  ['lainnya', 'Lainnya', 'Other'],
]

const INPUT = 'border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-sm bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'

const STATUS_CLS: Record<Opname['status'], string> = {
  draf:  'bg-amber-50 text-amber-800 ring-1 ring-amber-600/20',
  final: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  batal: 'bg-gray-100 text-gray-500 ring-1 ring-gray-400/20',
}

export default function StokOpname() {
  const app = useApp()
  const { t } = useLang()
  const { kabar, konfirmasi, tanya } = useUmpan()
  const { memuat, mulai, selesai } = usePemuat(app.superViewCompany)

  const [daftar, setDaftar] = useState<Opname[]>([])
  const [pilih, setPilih] = useState<Opname | null>(null)
  const [baris, setBaris] = useState<Baris[]>([])
  const [ubah, setUbah] = useState<Record<string, Ubahan>>({})
  const [muatBaris, setMuatBaris] = useState(false)
  const [sibuk, setSibuk] = useState(false)
  const [bukaMulai, setBukaMulai] = useState(false)
  const [formKategori, setFormKategori] = useState('')
  const [formCatatan, setFormCatatan] = useState('')
  const [cari, setCari] = useState('')
  const [saring, setSaring] = useState<'semua' | 'belum' | 'selisih'>('semua')

  const bolehHitung = boleh(app.currentRole, 'stok.opname', app.isSuper)
  const bolehFinal = boleh(app.currentRole, 'stok.opname.final', app.isSuper)
  const terkunciSuper = app.isSuper && !app.superViewCompany
  const pCompany = app.isSuper && app.superViewCompany ? app.superViewCompany : null

  const muat = useCallback(async () => {
    mulai()
    const { data, error } = await app.scope(
      supabase.from('stock_opnames').select('*').order('dibuat_pada', { ascending: false }).limit(100))
    if (error) kabar(pesanError(error), 'galat')
    setDaftar((data as Opname[]) || [])
    selesai()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.superViewCompany])

  useEffect(() => { muat() }, [muat])

  const bukaOpname = useCallback(async (o: Opname) => {
    setPilih(o); setUbah({}); setCari(''); setSaring('semua'); setMuatBaris(true)
    const { data, error } = await semua<Baris>(() => supabase.from('stock_opname_items')
      .select('id,product_id,batch_id,stok_sistem,stok_fisik,selisih,alasan,catatan,products(nama_obat,kode,satuan,kategori,rak),product_batches(batch_number,expired_date)')
      .eq('opname_id', o.id))
    if (error) kabar(pesanError(error), 'galat')
    // Urut nama obat, lalu kedaluwarsa terdekat: urutan orang berjalan di rak.
    const urut = [...(data || [])].sort((a, b) =>
      (a.products?.nama_obat || '').localeCompare(b.products?.nama_obat || '', 'id')
      || (a.product_batches?.expired_date || '9999').localeCompare(b.product_batches?.expired_date || '9999'))
    setBaris(urut)
    setMuatBaris(false)
  }, [kabar])

  // Nilai yang sedang tampil: yang diketik di layar menang atas yang tersimpan.
  const nilai = useCallback((b: Baris): Ubahan => ubah[b.id] ?? { stok_fisik: b.stok_fisik, alasan: b.alasan }, [ubah])
  const selisihDari = (b: Baris, u: Ubahan) => (u.stok_fisik === null ? null : u.stok_fisik - b.stok_sistem)

  const ringkas = useMemo(() => {
    let belum = 0, berselisih = 0, tambah = 0, kurang = 0, tanpaAlasan = 0
    for (const b of baris) {
      const u = nilai(b)
      const s = selisihDari(b, u)
      if (s === null) { belum++; continue }
      if (s !== 0) {
        berselisih++
        if (s > 0) tambah += s; else kurang -= s
        if (!u.alasan) tanpaAlasan++
      }
    }
    return { belum, berselisih, tambah, kurang, tanpaAlasan }
  }, [baris, nilai])

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return baris.filter(b => {
      const u = nilai(b)
      const s = selisihDari(b, u)
      if (saring === 'belum' && s !== null) return false
      if (saring === 'selisih' && (s === null || s === 0)) return false
      if (!q) return true
      return [b.products?.nama_obat, b.products?.kode, b.product_batches?.batch_number]
        .some(v => (v || '').toLowerCase().includes(q))
    })
  }, [baris, cari, saring, nilai])
  const bertahap = useBertahap(tersaring)

  const belumDisimpan = Object.keys(ubah).length

  const setFisik = (b: Baris, v: string) => {
    // Kosong berarti "belum dihitung", bukan nol: nol adalah hasil hitung.
    const n = Number(v)
    const fisik = v.trim() === '' || !Number.isFinite(n) ? null : Math.max(0, Math.floor(n))
    setUbah(prev => ({ ...prev, [b.id]: { ...nilai(b), stok_fisik: fisik } }))
  }
  const setAlasan = (b: Baris, v: string) => setUbah(prev => ({ ...prev, [b.id]: { ...nilai(b), alasan: v || null } }))

  const simpan = async (): Promise<boolean> => {
    if (!pilih || belumDisimpan === 0) return true
    setSibuk(true)
    const kiriman = Object.entries(ubah).map(([id, u]) => ({ id, stok_fisik: u.stok_fisik, alasan: u.alasan }))
    const { error } = await supabase.rpc('simpan_hitung_opname', { p_opname: pilih.id, p_baris: kiriman })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return false }
    // Terapkan ke salinan lokal supaya selisih tersimpan tampil tanpa memuat ulang.
    setBaris(prev => prev.map(b => ubah[b.id]
      ? { ...b, stok_fisik: ubah[b.id].stok_fisik, alasan: ubah[b.id].alasan,
          selisih: ubah[b.id].stok_fisik === null ? null : (ubah[b.id].stok_fisik as number) - b.stok_sistem }
      : b))
    setUbah({})
    kabar(t(`${kiriman.length} baris tersimpan.`, `${kiriman.length} rows saved.`), 'ok')
    return true
  }

  const mulaiOpname = async () => {
    setSibuk(true)
    const { data, error } = await supabase.rpc('buat_opname', {
      p_kategori: formKategori || null, p_catatan: formCatatan || null, p_company: pCompany,
    })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    setBukaMulai(false); setFormKategori(''); setFormCatatan('')
    kabar(t(`Opname ${data.nomor} dimulai dengan ${data.baris} baris.`, `Stock take ${data.nomor} started with ${data.baris} rows.`), 'ok')
    await muat()
    const { data: o } = await supabase.from('stock_opnames').select('*').eq('id', data.id).maybeSingle()
    if (o) bukaOpname(o as Opname)
  }

  const finalkan = async () => {
    if (!pilih) return
    if (ringkas.belum > 0) {
      kabar(t(`Masih ada ${ringkas.belum} baris yang belum dihitung.`, `${ringkas.belum} rows are not counted yet.`), 'galat'); return
    }
    if (ringkas.tanpaAlasan > 0) {
      kabar(t(`${ringkas.tanpaAlasan} baris berselisih belum diberi alasan.`, `${ringkas.tanpaAlasan} rows with a difference have no reason.`), 'galat'); return
    }
    // Kalimatnya MENYEBUT angkanya: yang ditandatangani harus terbaca sebelum ditekan.
    const pesan = ringkas.berselisih === 0
      ? t('Semua baris sama dengan sistem. Opname ditutup tanpa mengubah stok.', 'Every row matches the system. The stock take closes without changing stock.')
      : t(`${ringkas.berselisih} baris berselisih: stok bertambah ${angka(ringkas.tambah)} dan berkurang ${angka(ringkas.kurang)} unit. Stok batch dan produk disesuaikan, dan penyesuaian obat golongan tercatat di SIPNAP. Tidak bisa dibatalkan.`,
          `${ringkas.berselisih} rows differ: stock goes up ${angka(ringkas.tambah)} and down ${angka(ringkas.kurang)} units. Batch and product stock are adjusted, and controlled-drug adjustments appear in SIPNAP. This cannot be undone.`)
    if (!await konfirmasi({ judul: t(`Finalkan ${pilih.nomor}?`, `Finalize ${pilih.nomor}?`), pesan, tombol: t('Finalkan', 'Finalize') })) return
    if (!await simpan()) return
    setSibuk(true)
    const { data, error } = await supabase.rpc('finalkan_opname', { p_opname: pilih.id })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    kabar(t(`Opname ${data.nomor} final. ${data.baris_berubah} baris disesuaikan.`, `Stock take ${data.nomor} finalized. ${data.baris_berubah} rows adjusted.`), 'ok')
    await muat()
    const { data: o } = await supabase.from('stock_opnames').select('*').eq('id', pilih.id).maybeSingle()
    if (o) bukaOpname(o as Opname)
  }

  const batalkan = async () => {
    if (!pilih) return
    const alasan = await tanya({ judul: t(`Batalkan ${pilih.nomor}?`, `Cancel ${pilih.nomor}?`),
      label: t('Alasan pembatalan', 'Reason for cancelling'), wajib: true })
    if (!alasan) return
    setSibuk(true)
    const { error } = await supabase.rpc('batal_opname', { p_opname: pilih.id, p_alasan: alasan })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    kabar(t('Opname dibatalkan. Stok tidak berubah.', 'Stock take cancelled. Stock is unchanged.'), 'ok')
    setPilih(null)
    muat()
  }

  const kembali = async () => {
    if (belumDisimpan > 0 && !await konfirmasi({
      judul: t('Tinggalkan tanpa menyimpan?', 'Leave without saving?'),
      pesan: t(`${belumDisimpan} hitungan belum disimpan dan akan hilang.`, `${belumDisimpan} counts are not saved and will be lost.`),
      tombol: t('Tinggalkan', 'Leave'), bahaya: true,
    })) return
    setPilih(null); setUbah({})
  }

  /**
   * Lembar yang dibawa ke rak (draf) atau berita acaranya (final). Urutnya
   * RAK lebih dulu, bukan nama: di layar orang mencari, di gudang orang
   * berjalan, dan lembar yang urut abjad membuatnya bolak-balik antar rak.
   * Draf dicetak dengan hitung buta; lihat `lembarOpname`.
   */
  const cetak = () => {
    if (!pilih) return
    const urut = [...baris].sort((a, b) =>
      (a.products?.rak || '\uffff').localeCompare(b.products?.rak || '\uffff', 'id', { numeric: true })
      || (a.products?.nama_obat || '').localeCompare(b.products?.nama_obat || '', 'id')
      || (a.product_batches?.expired_date || '9999').localeCompare(b.product_batches?.expired_date || '9999'))
    const ok = bukaCetak(lembarOpname(app.profilCetak(), {
      nomor: pilih.nomor, tanggal: pilih.tanggal, cakupan: namaCakupan(pilih.kategori), status: pilih.status,
      dibuat_oleh: pilih.dibuat_oleh, difinalkan_oleh: pilih.difinalkan_oleh, difinalkan_pada: pilih.difinalkan_pada,
      catatan: pilih.catatan,
    }, urut.map(b => ({
      kode: b.products?.kode, nama_obat: b.products?.nama_obat, satuan: b.products?.satuan, rak: b.products?.rak,
      batch_number: b.product_batches?.batch_number, expired_date: b.product_batches?.expired_date,
      stok_sistem: b.stok_sistem, stok_fisik: b.stok_fisik, selisih: b.selisih, alasan: b.alasan,
    }))), 1100, 800)
    if (!ok) kabar(t('Jendela cetak diblokir peramban. Izinkan pop-up untuk situs ini.', 'The print window was blocked. Allow pop-ups for this site.'))
  }

  const adaDraf = daftar.some(o => o.status === 'draf')
  const namaCakupan = (k: string | null) => k ? (KATEGORI_LABEL[k] || k) : t('Semua produk', 'All products')

  // ════════ Lembar hitung ════════
  if (pilih) {
    const draf = pilih.status === 'draf'
    return (
      <div>
        <button onClick={kembali} className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-soft)] hover:text-[var(--brand)] mb-3">
          <ArrowLeft size={15} /> {t('Semua opname', 'All stock takes')}
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-3xl font-bold text-[var(--ink)] mb-1 flex items-center gap-3 flex-wrap">
              <span className="num">{pilih.nomor}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CLS[pilih.status]}`}>{pilih.status}</span>
            </h1>
            <p className="text-sm text-[var(--ink-soft)]">
              {namaCakupan(pilih.kategori)} · {t('dimulai', 'started')} {tanggalJam(pilih.dibuat_pada)}
              {pilih.difinalkan_pada && <> · {t('final', 'finalized')} {tanggalJam(pilih.difinalkan_pada)} {t('oleh', 'by')} {pilih.difinalkan_oleh}</>}
              {pilih.alasan_batal && <> · {t('dibatalkan', 'cancelled')}: {pilih.alasan_batal}</>}
            </p>
          </div>
          {(draf || pilih.status === 'final') && (
            <div className="flex flex-wrap items-center gap-2">
              {baris.length > 0 && (
                <button onClick={cetak} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--line)] text-sm text-[var(--ink-soft)] hover:bg-[var(--surface-2)]">
                  <Printer size={15} /> {draf ? t('Cetak lembar hitung', 'Print count sheet') : t('Cetak berita acara', 'Print report')}
                </button>
              )}
              {draf && bolehHitung && (
                <button onClick={batalkan} disabled={sibuk} className="px-3.5 py-2 rounded-xl border border-[var(--line)] text-sm text-[var(--ink-soft)] hover:bg-[var(--surface-2)] disabled:opacity-50">
                  {t('Batalkan', 'Cancel')}
                </button>
              )}
              {draf && bolehHitung && (
                <button onClick={simpan} disabled={sibuk || belumDisimpan === 0} className="px-3.5 py-2 rounded-xl border border-[var(--brand)] text-sm font-semibold text-[var(--brand)] hover:bg-[var(--surface-2)] disabled:opacity-40">
                  {t('Simpan hitungan', 'Save counts')}{belumDisimpan > 0 && <span className="num"> ({belumDisimpan})</span>}
                </button>
              )}
              {draf && bolehFinal && (
                <button onClick={finalkan} disabled={sibuk} className="px-3.5 py-2 rounded-xl bg-[var(--brand)] text-[var(--on-brand)] text-sm font-semibold hover:bg-[var(--brand-hover)] disabled:opacity-50">
                  {t('Finalkan', 'Finalize')}
                </button>
              )}
            </div>
          )}
        </div>

        {draf && !bolehFinal && (
          <p className="mb-4 text-sm text-[var(--ink-soft)] bg-[var(--surface-2)] rounded-xl px-4 py-3">
            {t('Anda bisa menghitung dan menyimpan. Yang memfinalkan pemilik, admin, atau apoteker.',
               'You can count and save. The owner, admin, or pharmacist finalizes it.')}
          </p>
        )}

        {/* Ringkasan: angkanya bisa dijumlahkan dengan yang terlihat di daftar. */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            [t('Baris', 'Rows'), angka(baris.length), ''],
            [t('Belum dihitung', 'Not counted'), angka(ringkas.belum), ringkas.belum > 0 ? 'text-amber-700' : ''],
            [t('Berselisih', 'Different'), angka(ringkas.berselisih), ringkas.berselisih > 0 ? 'text-[var(--ink)]' : ''],
            [t('Selisih (+/-)', 'Difference (+/-)'), `+${angka(ringkas.tambah)} / -${angka(ringkas.kurang)}`, ''],
          ].map(([l, v, c], i) => (
            <div key={i} className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-[var(--ink-faint)]">{l}</p>
              <p className={`text-lg font-semibold num ${c || 'text-[var(--ink)]'}`}>{v}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[12rem] max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
            <input value={cari} onChange={e => setCari(e.target.value)}
              placeholder={t('Cari nama obat, kode, atau batch…', 'Search drug, code, or batch…')}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
          </div>
          {([
            ['semua', t('Semua', 'All')],
            ['belum', t('Belum dihitung', 'Not counted')],
            ['selisih', t('Berselisih', 'Different')],
          ] as const).map(([k, l]) => (
            <button key={k} onClick={() => setSaring(k)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${saring === k
                ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]'
                : 'border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--brand)]'}`}>
              {l}
            </button>
          ))}
        </div>

        <div className={`${TBL_WRAP} ${TBL_KARTU_WADAH}`}>
          <table className={`${TBL} ${TBL_KARTU}`}>
            <thead className={THEAD}>
              <tr>
                <th className={TH_L}>{t('Obat', 'Drug')}</th>
                <th className={TH_L}>{t('Batch', 'Batch')}</th>
                <th className={TH_R}>{t('Sistem', 'System')}</th>
                <th className={TH_C}>{t('Fisik', 'Counted')}</th>
                <th className={TH_R}>{t('Selisih', 'Diff.')}</th>
                <th className={TH_L}>{t('Alasan', 'Reason')}</th>
              </tr>
            </thead>
            <tbody>
              {muatBaris ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</td></tr>
              ) : tersaring.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--ink-faint)]">{t('Tidak ada baris yang cocok.', 'No matching rows.')}</td></tr>
              ) : bertahap.tampil.map(b => {
                const u = nilai(b)
                const s = selisihDari(b, u)
                const warna = s === null ? 'text-[var(--ink-faint)]' : s > 0 ? 'text-emerald-700' : s < 0 ? 'text-red-700' : 'text-[var(--ink-faint)]'
                return (
                  <tr key={b.id} className={TR}>
                    <td data-utama className="px-4 py-2.5">
                      <p className="font-medium text-[var(--ink)]">{b.products?.nama_obat || '-'}</p>
                      <p className="text-[11px] text-[var(--ink-faint)] num">{b.products?.kode || ''}{b.products?.satuan ? ` · ${b.products.satuan}` : ''}</p>
                    </td>
                    <td data-l={t('Batch', 'Batch')} className="px-4 py-2.5 text-xs text-[var(--ink-soft)]">
                      {b.batch_id
                        ? <><span className="num">{b.product_batches?.batch_number || '-'}</span>{b.product_batches?.expired_date && <> · ED {tanggal(b.product_batches.expired_date)}</>}</>
                        : <span className="italic">{t('tanpa batch', 'no batch')}</span>}
                    </td>
                    <td data-l={t('Sistem', 'System')} className="px-4 py-2.5 text-right num text-[var(--ink-soft)]">{angka(b.stok_sistem)}</td>
                    <td data-l={t('Fisik', 'Counted')} className="px-4 py-2.5 text-center">
                      {draf && bolehHitung ? (
                        <input type="number" inputMode="numeric" min={0} value={u.stok_fisik ?? ''}
                          onChange={e => setFisik(b, e.target.value)}
                          aria-label={t(`Stok fisik ${b.products?.nama_obat || ''}`, `Counted stock ${b.products?.nama_obat || ''}`)}
                          className={INPUT + ' w-24 text-right num'} />
                      ) : <span className="num">{u.stok_fisik === null ? '-' : angka(u.stok_fisik)}</span>}
                    </td>
                    <td data-l={t('Selisih', 'Diff.')} className={`px-4 py-2.5 text-right num font-semibold ${warna}`}>
                      {s === null ? '-' : s > 0 ? `+${angka(s)}` : angka(s)}
                    </td>
                    <td data-l={t('Alasan', 'Reason')} className="px-4 py-2.5">
                      {draf && bolehHitung ? (
                        <select value={u.alasan || ''} onChange={e => setAlasan(b, e.target.value)}
                          disabled={s === null || s === 0}
                          aria-label={t('Alasan selisih', 'Reason for difference')}
                          className={`${INPUT} w-36 disabled:opacity-40 ${s !== null && s !== 0 && !u.alasan ? 'ring-2 ring-amber-400' : ''}`}>
                          <option value="">{s !== null && s !== 0 ? t('Pilih alasan…', 'Choose reason…') : '-'}</option>
                          {ALASAN.map(([k, id, en]) => <option key={k} value={k}>{t(id, en)}</option>)}
                        </select>
                      ) : <span className="text-xs text-[var(--ink-soft)]">{ALASAN.find(a => a[0] === u.alasan)?.[1] || '-'}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <TombolLagi {...bertahap} />
        </div>
      </div>
    )
  }

  // ════════ Daftar opname ════════
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-3xl font-bold text-[var(--ink)] mb-1">{t('Stok Opname', 'Stock Take')}</h1>
          <p className="text-sm text-[var(--ink-soft)] max-w-2xl">
            {t('Hitung stok fisik per batch, lalu sesuaikan stok sistem dengan alasan yang tercatat. Penyesuaian obat golongan ikut masuk SIPNAP.',
               'Count physical stock per batch, then adjust the system stock with a recorded reason. Controlled-drug adjustments are included in SIPNAP.')}
          </p>
        </div>
        {bolehHitung && (
          <button onClick={() => setBukaMulai(true)} disabled={adaDraf || terkunciSuper}
            title={adaDraf ? t('Selesaikan opname yang masih draf dulu.', 'Finish the open draft first.') : undefined}
            className="inline-flex items-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
            <ClipboardCheck size={16} /> {t('Mulai opname', 'Start stock take')}
          </button>
        )}
      </div>

      {terkunciSuper && (
        <p className="mb-4 text-sm text-[var(--ink-soft)] bg-[var(--surface-2)] rounded-xl px-4 py-3">
          {t('Pilih satu faskes di pemilih faskes dulu sebelum memulai opname.', 'Select a facility first before starting a stock take.')}
        </p>
      )}

      <div className={`${TBL_WRAP} ${TBL_KARTU_WADAH}`}>
        <table className={`${TBL} ${TBL_KARTU}`}>
          <thead className={THEAD}>
            <tr>
              <th className={TH_L}>{t('Nomor', 'Number')}</th>
              <th className={TH_L}>{t('Dimulai', 'Started')}</th>
              <th className={TH_L}>{t('Cakupan', 'Scope')}</th>
              <th className={TH_L}>Status</th>
              <th className={TH_L}>{t('Catatan', 'Note')}</th>
            </tr>
          </thead>
          <tbody>
            {memuat ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</td></tr>
            ) : daftar.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--ink-faint)]">
                {t('Belum pernah ada opname. Mulai yang pertama lewat tombol di atas.', 'No stock take yet. Start the first one with the button above.')}
              </td></tr>
            ) : daftar.map(o => (
              <tr key={o.id} className={`${TR} cursor-pointer`} onClick={() => bukaOpname(o)}>
                <td data-utama className="px-4 py-3 num font-medium text-[var(--brand)]">{o.nomor || '-'}</td>
                <td data-l={t('Dimulai', 'Started')} className="px-4 py-3 text-xs text-[var(--ink-soft)] num whitespace-nowrap">{tanggalJam(o.dibuat_pada)}</td>
                <td data-l={t('Cakupan', 'Scope')} className="px-4 py-3 text-sm text-[var(--ink)]">{namaCakupan(o.kategori)}</td>
                <td data-l="Status" className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CLS[o.status]}`}>{o.status}</span>
                </td>
                <td data-l={t('Catatan', 'Note')} className="px-4 py-3 text-xs text-[var(--ink-soft)]">{o.catatan || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bukaMulai && (
        <Dialog
          judul={t('Mulai opname', 'Start stock take')}
          lebar="sm"
          onTutup={() => setBukaMulai(false)}
          aksi={<>
            <button type="button" onClick={() => setBukaMulai(false)} className={TOMBOL_KEDUA}>{t('Batal', 'Cancel')}</button>
            <button type="button" onClick={mulaiOpname} disabled={sibuk} className={TOMBOL_UTAMA}>
              {sibuk ? t('Menyiapkan…', 'Preparing…') : t('Mulai', 'Start')}
            </button>
          </>}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="opname-cakupan" className="block text-[13px] font-medium text-[var(--ink-mid)] mb-1.5">{t('Cakupan', 'Scope')}</label>
              <select id="opname-cakupan" value={formKategori} onChange={e => setFormKategori(e.target.value)} className={INPUT + ' w-full py-2.5'}>
                <option value="">{t('Semua produk', 'All products')}</option>
                {Object.entries(KATEGORI_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="opname-catatan" className="block text-[13px] font-medium text-[var(--ink-mid)] mb-1.5">{t('Catatan (opsional)', 'Note (optional)')}</label>
              <input id="opname-catatan" value={formCatatan} onChange={e => setFormCatatan(e.target.value)}
                placeholder={t('Mis. opname akhir bulan September', 'E.g. end of September count')} className={INPUT + ' w-full py-2.5'} />
            </div>
            <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
              {t('Stok sistem dicatat saat tombol Mulai ditekan. Penjualan sesudahnya tetap terhitung benar, karena penyesuaiannya menambah atau mengurangi, bukan menimpa angka.',
                 'System stock is recorded when you press Start. Sales after that are still counted correctly, because adjustments add or subtract rather than overwrite.')}
            </p>
          </div>
        </Dialog>
      )}
    </div>
  )
}
