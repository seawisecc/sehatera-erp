'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, HandHelping, PackageX, Plus, Search, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/app-context'
import { useLang } from '@/lib/i18n'
import { useUmpan } from '@/components/Umpan'
import { pesanError } from '@/lib/session'
import { angka, tanggalJam } from '@/lib/format'

/**
 * Menulis resep dari kunjungan.
 *
 * Dua hal yang membuat ini beda dari sekadar formulir:
 *
 * 1. SISA STOK TERLIHAT SAAT MENULIS. Dokter melihat apa yang benar-benar ada
 *    sebelum memutuskan, bukan sesudah pasien berdiri di depan loket dan diberi
 *    tahu obatnya habis. Memindahkan kabar itu ke depan tidak menambah stok,
 *    tapi memindahkan kekecewaannya ke tempat yang masih bisa ditindaklanjuti:
 *    dokter masih duduk di sana dan bisa mengganti obatnya.
 *
 * 2. ALERGI PASIEN BERDIRI DI ATAS DAN TIDAK BISA DITUTUP. Ia satu-satunya hal
 *    di layar ini yang, kalau terlewat dibaca, bisa membunuh orang.
 *
 * Yang TIDAK dilakukan di sini, dan sengaja: pemeriksaan interaksi obat. Itu
 * butuh basis data interaksi yang terpelihara, dan pemeriksaan interaksi yang
 * setengah benar lebih berbahaya daripada tidak ada sama sekali, karena orang
 * mulai memercayainya.
 */

type Item = {
  product_id: string | null
  nama_obat: string
  jumlah: string
  satuan: string
  dosis: string
  frekuensi: string
  rute: string
  aturan_pakai: string
  stok?: number | null
  kategori?: string | null
  /** Dokter sengaja tidak memilih produknya dan menyerahkannya ke farmasi. */
  permintaan_terbuka?: boolean
  permintaan_asli?: string | null
  diisi_oleh?: string | null
}

type Produk = { id: string; nama_obat: string; satuan: string | null; stok_total: number; kategori: string | null }

const RUTE = ['oral', 'topikal', 'tetes', 'inhalasi', 'injeksi', 'rektal', 'lainnya']
const GOLONGAN = ['narkotika', 'psikotropika', 'prekursor']

export default function Resep({
  visitId, nama, alergi, tertutup, onTutup, onSimpan,
}: {
  visitId: string
  nama: string
  alergi: string | null
  tertutup: boolean
  onTutup: () => void
  onSimpan: () => void
}) {
  const { t } = useLang()
  const { kabar, konfirmasi, tanya } = useUmpan()
  const app = useApp()

  const [resep, setResep] = useState<any>(null)
  const [items, setItems] = useState<Item[]>([])
  const [catatan, setCatatan] = useState('')
  const [memuat, setMemuat] = useState(true)
  const [sibuk, setSibuk] = useState(false)

  const [cari, setCari] = useState('')
  const [hasil, setHasil] = useState<Produk[]>([])

  const muat = async () => {
    const { data, error } = await supabase.rpc('resep_kunjungan', { p_visit: visitId })
    if (error) { kabar(pesanError(error), 'galat'); onTutup(); return }
    const d = data as any
    setResep(d.resep)
    setCatatan(d.resep?.catatan || '')
    setItems((d.items || []).map((x: any) => ({
      product_id: x.product_id, nama_obat: x.nama_obat,
      permintaan_terbuka: x.permintaan_terbuka, permintaan_asli: x.permintaan_asli,
      diisi_oleh: x.diisi_oleh,
      jumlah: x.jumlah != null ? String(Number(x.jumlah)) : '',
      satuan: x.satuan || '', dosis: x.dosis || '', frekuensi: x.frekuensi || '',
      rute: x.rute || 'oral', aturan_pakai: x.aturan_pakai || '',
      stok: x.stok, kategori: x.kategori,
    })))
    setMemuat(false)
  }

  useEffect(() => { muat() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [visitId])

  useEffect(() => {
    const q = cari.trim()
    if (q.length < 2) { setHasil([]); return }
    const id = setTimeout(async () => {
      const { data } = await app.scope(
        supabase.from('products').select('id,nama_obat,satuan,stok_total,kategori')
          .ilike('nama_obat', `%${q}%`).order('nama_obat').limit(8)
      )
      setHasil((data as Produk[]) || [])
    }, 220)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cari, app.superViewCompany])

  const terkunci = tertutup || resep?.status === 'final' || resep?.status === 'dilayani'

  const tambahDariKatalog = (p: Produk) => {
    if (items.some(i => i.product_id === p.id)) return
    setItems([...items, {
      product_id: p.id, nama_obat: p.nama_obat, jumlah: '', satuan: p.satuan || '',
      dosis: '', frekuensi: '', rute: 'oral', aturan_pakai: '',
      stok: p.stok_total, kategori: p.kategori,
    }])
    setCari(''); setHasil([])
  }

  const tambahLuarKatalog = () => {
    const n = cari.trim()
    if (!n) return
    setItems([...items, {
      product_id: null, nama_obat: n, jumlah: '', satuan: '', dosis: '',
      frekuensi: '', rute: 'oral', aturan_pakai: '', stok: null,
    }])
    setCari(''); setHasil([])
  }

  /**
   * Baris yang produknya sengaja tidak dipilih dokter.
   *
   * Bedanya dengan "luar katalog": luar katalog artinya obatnya memang tidak
   * ada di sini dan pasien menebusnya di tempat lain. Permintaan terbuka
   * artinya obatnya ADA di sini, dokter cuma menyerahkan pilihannya ke
   * apoteker. Yang tercatat sebagai peresep tetap dokter, karena baris inilah
   * resepnya.
   */
  const tambahPermintaanTerbuka = () => {
    const n = cari.trim()
    if (!n) return
    setItems([...items, {
      product_id: null, nama_obat: n, jumlah: '', satuan: '', dosis: '',
      frekuensi: '', rute: 'oral', aturan_pakai: '', stok: null,
      permintaan_terbuka: true,
    }])
    setCari(''); setHasil([])
  }

  const ubah = (idx: number, k: keyof Item, v: string) =>
    setItems(items.map((x, n) => n === idx ? { ...x, [k]: v } : x))

  const kirim = async (final: boolean) => {
    if (final && items.length === 0) {
      kabar(t('Resep kosong tidak bisa difinalkan.', 'An empty prescription cannot be finalised.'))
      return
    }
    if (final && !await konfirmasi({ judul: t(
      'Sesudah difinalkan, isi resep tidak bisa diubah lagi. Koreksi dilakukan dengan membatalkannya lalu menulis ulang. Lanjutkan?',
      'Once finalised, the prescription cannot be edited. Corrections are made by cancelling and rewriting. Continue?')})) return

    setSibuk(true)
    const { error } = await supabase.rpc('simpan_resep', {
      p_visit: visitId,
      p_items: items.map(i => ({
        product_id: i.product_id, nama_obat: i.nama_obat, jumlah: i.jumlah,
        satuan: i.satuan, dosis: i.dosis, frekuensi: i.frekuensi,
        rute: i.rute, aturan_pakai: i.aturan_pakai,
        permintaan_terbuka: i.permintaan_terbuka ?? false,
      })),
      p_catatan: catatan,
      p_final: final,
    })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    onSimpan()
    if (final) onTutup(); else muat()
  }

  const batalkanResep = async () => {
    const alasan = await tanya({ judul: t('Batalkan resep ini? Tulis alasannya, dan resep baru bisa ditulis sesudahnya.',
                            'Cancel this prescription? Write the reason, then a new one can be written.'), nilai: '' })
    if (alasan === null) return
    setSibuk(true)
    const { error } = await supabase.rpc('batalkan_resep', { p_resep: resep.id, p_alasan: alasan })
    setSibuk(false)
    if (error) { kabar(pesanError(error), 'galat'); return }
    onSimpan()
    setResep(null); setItems([]); setCatatan('')
    muat()
  }

  const adaGolongan = useMemo(
    () => items.some(i => GOLONGAN.includes(String(i.kategori))), [items])
  const kurangStok = useMemo(
    () => items.filter(i => i.product_id && i.stok != null && Number(i.jumlah || 0) > Number(i.stok)),
    [items])

  const I = 'w-full border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-sm bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] disabled:opacity-60'
  const L = 'block text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)] mb-0.5'

  return (
    <div className="fixed inset-0 bg-black/45 flex items-start justify-center z-50 p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-[var(--surface-2)] rounded-2xl w-full max-w-3xl my-4 shadow-xl">

        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-[var(--surface)] rounded-t-2xl border-b border-[var(--line)]">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
              {t('Resep', 'Prescription')}
              {resep?.nomor && <span className="num text-xs font-medium text-[var(--ink-faint)]">{resep.nomor}</span>}
              {resep?.status && resep.status !== 'draf' && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  resep.status === 'dilayani' ? 'bg-green-100 text-green-700' : 'bg-[var(--brand)] text-[var(--on-brand)]'
                }`}>{resep.status.toUpperCase()}</span>
              )}
            </h2>
            <p className="text-xs text-[var(--ink-soft)] truncate">{nama}</p>
          </div>
          <button onClick={onTutup} className="shrink-0 text-[var(--ink-faint)] hover:text-[var(--ink)]" aria-label={t('Tutup', 'Close')}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {alergi && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-300 text-red-900" role="alert">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">{t('Alergi obat', 'Drug allergy')}</p>
                <p className="text-sm">{alergi}</p>
                <p className="text-xs mt-1 opacity-90">
                  {t('Cocokkan sendiri dengan obat di bawah. Aplikasi ini belum memeriksa interaksi obat, dan pemeriksaan yang setengah benar lebih berbahaya daripada tidak ada.',
                     'Check this against the drugs below yourself. This app does not check drug interactions yet, and a half-correct check is more dangerous than none.')}
                </p>
              </div>
            </div>
          )}

          {memuat ? (
            <p className="py-10 text-center text-sm text-[var(--ink-faint)]">{t('Memuat…', 'Loading…')}</p>
          ) : (
            <>
              {!terkunci && (
                <section>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
                    <input autoFocus value={cari} onChange={e => setCari(e.target.value)}
                      placeholder={t('Cari obat di katalog…', 'Search the catalogue…')}
                      className={`${I} pl-9 py-2.5`} />
                  </div>
                  {(hasil.length > 0 || cari.trim().length >= 2) && (
                    <div className="mt-1 border border-[var(--line)] rounded-lg overflow-hidden bg-[var(--surface)]">
                      {hasil.map(p => {
                        const habis = (p.stok_total ?? 0) <= 0
                        return (
                          <button key={p.id} onClick={() => tambahDariKatalog(p)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-2)] flex items-center gap-2 border-b border-[var(--line-soft)] last:border-b-0">
                            <span className="text-[var(--ink)] truncate flex-1">{p.nama_obat}</span>
                            {GOLONGAN.includes(String(p.kategori)) && (
                              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                {String(p.kategori).toUpperCase()}
                              </span>
                            )}
                            {/* Sisa stok dibaca di sini, bukan nanti di loket. */}
                            <span className={`shrink-0 num text-xs font-medium ${habis ? 'text-red-600' : 'text-[var(--ink-faint)]'}`}>
                              {habis ? t('habis', 'out') : `${angka(p.stok_total)} ${p.satuan || ''}`}
                            </span>
                          </button>
                        )
                      })}
                      <button onClick={tambahLuarKatalog}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--surface-2)] text-[var(--ink-soft)] flex items-center gap-2">
                        <Plus size={13} />
                        {t(`Tulis "${cari.trim()}" sebagai obat luar katalog`, `Write "${cari.trim()}" as an off-catalogue drug`)}
                      </button>
                      <button onClick={tambahPermintaanTerbuka}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--surface-2)] text-[var(--ink-soft)] flex items-center gap-2 border-t border-[var(--line)]">
                        <HandHelping size={13} />
                        {t(`Minta "${cari.trim()}", biar farmasi yang pilih`, `Request "${cari.trim()}", let the pharmacy choose`)}
                      </button>
                    </div>
                  )}
                </section>
              )}

              {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--ink-faint)]">
                  {t('Belum ada obat di resep ini.', 'No drugs in this prescription yet.')}
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((it, idx) => {
                    const luar = !it.product_id
                    const kurang = it.product_id && it.stok != null && Number(it.jumlah || 0) > Number(it.stok)
                    return (
                      <div key={idx} className={`rounded-xl border p-3 bg-[var(--surface)] ${kurang ? 'border-amber-300' : 'border-[var(--line)]'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="num text-xs font-bold text-[var(--ink-faint)] shrink-0">{idx + 1}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-[var(--ink)] truncate">{it.nama_obat}</span>
                            {/* Permintaan asli tetap terbaca berdampingan dengan
                                isian farmasi. Kalau ditimpa, rekamnya jadi
                                seolah dokter yang memilih produk itu. */}
                            {it.permintaan_asli && (
                              <span className="block text-[11px] text-[var(--ink-faint)] truncate">
                                {t('diminta', 'requested')}: {it.permintaan_asli}
                                {it.diisi_oleh && ` · ${t('diisi', 'filled by')} ${it.diisi_oleh}`}
                              </span>
                            )}
                          </span>
                          {it.permintaan_terbuka ? (
                            <span title={t('Farmasi yang memilih produknya. Permintaanmu tetap tercatat apa adanya.', 'The pharmacy picks the product. Your request stays recorded as written.')}
                              className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--accent-bg)] text-[var(--accent)]">
                              <HandHelping size={11} /> {it.diisi_oleh ? t('diisi farmasi', 'filled by pharmacy') : t('farmasi yang pilih', 'pharmacy chooses')}
                            </span>
                          ) : luar ? (
                            <span title={t('Tidak ada di katalog, jadi tidak bisa dilayani dari stok sini.', 'Not in the catalogue, so it cannot be dispensed from this stock.')}
                              className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--surface-2)] text-[var(--ink-faint)]">
                              <PackageX size={11} /> {t('luar katalog', 'off catalogue')}
                            </span>
                          ) : (
                            <span className={`shrink-0 num text-[11px] font-medium ${kurang ? 'text-amber-700' : 'text-[var(--ink-faint)]'}`}>
                              {t('sisa', 'stock')} {angka(Number(it.stok ?? 0))}
                            </span>
                          )}
                          {!terkunci && (
                            <button onClick={() => setItems(items.filter((_, n) => n !== idx))}
                              className="shrink-0 text-[var(--ink-faint)] hover:text-red-600" aria-label={t('Hapus', 'Remove')}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <div>
                            <label className={L}>{t('Jumlah', 'Qty')}</label>
                            <input inputMode="decimal" disabled={terkunci} value={it.jumlah}
                              onChange={e => ubah(idx, 'jumlah', e.target.value.replace(/[^0-9.]/g, ''))}
                              className={`${I} num`} />
                          </div>
                          <div>
                            <label className={L}>{t('Satuan', 'Unit')}</label>
                            <input disabled={terkunci} value={it.satuan}
                              onChange={e => ubah(idx, 'satuan', e.target.value)} className={I} />
                          </div>
                          <div>
                            <label className={L}>{t('Dosis', 'Dose')}</label>
                            <input disabled={terkunci} value={it.dosis} placeholder="500 mg"
                              onChange={e => ubah(idx, 'dosis', e.target.value)} className={I} />
                          </div>
                          <div>
                            <label className={L}>{t('Frekuensi', 'Frequency')}</label>
                            <input disabled={terkunci} value={it.frekuensi} placeholder="3x sehari"
                              onChange={e => ubah(idx, 'frekuensi', e.target.value)} className={I} />
                          </div>
                          <div>
                            <label className={L}>{t('Rute', 'Route')}</label>
                            <select disabled={terkunci} value={it.rute}
                              onChange={e => ubah(idx, 'rute', e.target.value)} className={I}>
                              {RUTE.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="mt-2">
                          <label className={L}>{t('Aturan pakai', 'Instructions')}</label>
                          <input disabled={terkunci} value={it.aturan_pakai}
                            placeholder={t('sesudah makan, habiskan', 'after meals, finish the course')}
                            onChange={e => ubah(idx, 'aturan_pakai', e.target.value)} className={I} />
                        </div>

                        {kurang && (
                          <p className="mt-2 text-xs text-amber-800">
                            {t('Jumlah melebihi sisa stok. Resepnya tetap boleh ditulis, tapi farmasi tidak akan bisa menyerahkan semuanya hari ini.',
                               'Quantity exceeds available stock. The prescription may still be written, but the pharmacy will not be able to dispense all of it today.')}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <div>
                <label className={L}>{t('Catatan untuk farmasi', 'Note to the pharmacy')}</label>
                <textarea rows={2} disabled={terkunci} value={catatan}
                  onChange={e => setCatatan(e.target.value)} className={`${I} py-2`} />
              </div>

              {adaGolongan && (
                <p className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  {t('Ada obat golongan Narkotika, Psikotropika, atau Prekursor. Penyerahannya nanti wajib mencatat data pasien dan nomor resep, dan terhitung di laporan SIPNAP.',
                     'Contains narcotics, psychotropics, or precursors. Dispensing will require patient data and a prescription number, and it counts in the SIPNAP report.')}
                </p>
              )}

              {kurangStok.length > 0 && !terkunci && (
                <p className="text-xs text-[var(--ink-soft)]">
                  {t(`${kurangStok.length} obat melebihi sisa stok.`, `${kurangStok.length} drug(s) exceed available stock.`)}
                </p>
              )}

              {resep?.status === 'dilayani' && (
                <p className="text-sm text-emerald-700 font-medium flex items-center gap-1.5">
                  <Check size={16} /> {t('Sudah diserahkan', 'Dispensed')} {resep.dilayani_pada ? tanggalJam(resep.dilayani_pada) : ''}
                </p>
              )}
            </>
          )}
        </div>

        {!memuat && (
          <div className="sticky bottom-0 flex flex-wrap gap-3 px-6 py-4 bg-[var(--surface)] rounded-b-2xl border-t border-[var(--line)]">
            {terkunci ? (
              <>
                <button onClick={onTutup}
                  className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2.5 rounded-lg text-sm">
                  {t('Tutup', 'Close')}
                </button>
                {resep?.status === 'final' && !tertutup && (
                  <button onClick={batalkanResep} disabled={sibuk}
                    className="flex-1 border border-red-300 text-red-700 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 transition disabled:opacity-50">
                    {t('Batalkan Resep', 'Cancel Prescription')}
                  </button>
                )}
              </>
            ) : (
              <>
                <button onClick={() => kirim(false)} disabled={sibuk}
                  className="flex-1 border border-[var(--line)] text-[var(--ink-soft)] py-2.5 rounded-lg text-sm hover:bg-[var(--surface-2)] transition disabled:opacity-50">
                  {t('Simpan Draf', 'Save Draft')}
                </button>
                <button onClick={() => kirim(true)} disabled={sibuk || items.length === 0}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[var(--brand)] text-[var(--on-brand)] py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-50">
                  <Check size={16} /> {t('Finalkan Resep', 'Finalise Prescription')}
                </button>
                {/* Draf pun harus bisa dibatalkan, dan itu bukan kelengkapan.
                    Draf tidak pernah sampai ke farmasi, tapi ia tetap terhitung
                    sebagai resep yang belum diserahkan, jadi kunjungannya tidak
                    bisa ditutup kasir. Tanpa tombol ini, resep yang dibuka lalu
                    ditinggalkan dokter membuat kunjungan itu menggantung
                    terbuka selamanya, dan tidak ada seorang pun yang punya cara
                    menutupnya. */}
                {resep?.id && resep.status === 'draf' && !tertutup && (
                  <button onClick={batalkanResep} disabled={sibuk}
                    className="w-full border border-red-300 text-red-700 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 transition disabled:opacity-50">
                    {t('Batalkan Draf Resep', 'Cancel Draft')}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
